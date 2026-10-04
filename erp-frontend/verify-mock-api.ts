// سكريبت تحقق قابل للتنفيذ فعليًا للـ Mock API (الوضع التجريبي): بيمشّي دورة حياة
// كاملة (خامة -> معمل -> إنتاج -> معمل -> اعتماد -> شحن -> تتبّع) ومسارات الرفض والعزل.
// شغّله بـ:  npx tsx verify-mock-api.ts
import assert from 'node:assert/strict';
import { handleMockRequest, resetMockDb, type MockReply } from './src/lib/mock/handler';
import type {
  DashboardStats,
  LabResult,
  PagedResult,
  PendingMaterial,
  ProductionBatch,
  RawMaterial,
  ScrapEntry,
  ShipmentRecord,
  Traceability,
  LoginResponse,
  BatchSummary,
} from './src/lib/types/api';

let passed = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

let token: string | null = null;
function call(method: string, path: string, body?: unknown, params?: Record<string, unknown>): MockReply {
  return handleMockRequest({ method, path, body, params, token });
}
function data<T>(reply: MockReply): T {
  assert.equal(reply.envelope.success, true, `expected success but got ${reply.envelope.errorCode}: ${reply.envelope.message}`);
  return reply.envelope.data as T;
}
function failure(reply: MockReply, status: number, code: string) {
  assert.equal(reply.status, status);
  assert.equal(reply.envelope.success, false);
  assert.equal(reply.envelope.errorCode, code);
}
const future = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

resetMockDb();

console.log('Auth:');
check('rejects unknown user and empty password', () => {
  failure(call('POST', '/auth/login', { username: 'nobody', password: 'x' }), 401, 'INVALID_CREDENTIALS');
  failure(call('POST', '/auth/login', { username: 'lab', password: '' }), 401, 'INVALID_CREDENTIALS');
});
check('protected routes need a token', () => {
  failure(call('GET', '/store/materials'), 401, 'UNAUTHORIZED');
});
check('login returns token, fullName, role', () => {
  const r = data<LoginResponse>(call('POST', '/auth/login', { username: 'Storekeeper', password: 'demo' }));
  assert.equal(r.role, 'Storekeeper');
  token = r.token;
});

console.log('\nStore:');
check('materials are paged (12 seeded, 10 per page)', () => {
  const p1 = data<PagedResult<RawMaterial>>(call('GET', '/store/materials', undefined, { page: 1, pageSize: 10 }));
  const p2 = data<PagedResult<RawMaterial>>(call('GET', '/store/materials', undefined, { page: 2, pageSize: 10 }));
  assert.equal(p1.items.length, 10);
  assert.equal(p2.items.length, 2);
  assert.equal(p1.totalCount, 12);
  assert.equal(p1.totalPages, 2);
});
check('approved list excludes pending-QC materials', () => {
  const approved = data<RawMaterial[]>(call('GET', '/store/materials/approved'));
  assert.ok(approved.length > 0 && approved.every((m) => m.isQCApproved && m.currentQuantity > 0));
  assert.ok(!approved.some((m) => m.id === 5));
});
let newMaterialId = 0;
check('add-material validates and creates an unapproved material', () => {
  failure(
    call('POST', '/store/add-material', { materialName: 'X', supplierName: 'Y', quantity: 10, physicalState: 'Solid', expiryDate: '2020-01-01' }),
    400,
    'VALIDATION_ERROR'
  );
  const m = data<RawMaterial>(
    call('POST', '/store/add-material', { materialName: 'Test Resin', supplierName: 'Acme', quantity: 500, physicalState: 'Solid', expiryDate: future(200) })
  );
  assert.equal(m.isQCApproved, false);
  newMaterialId = m.id;
});
check('cannot issue unapproved material, or more than available', () => {
  failure(call('POST', '/store/issue-material', { rawMaterialId: newMaterialId, quantityToIssue: 10 }), 400, 'MATERIAL_NOT_APPROVED');
  failure(call('POST', '/store/issue-material', { rawMaterialId: 1, quantityToIssue: 999999 }), 400, 'INSUFFICIENT_QUANTITY');
});
check('record-waste reduces stock and creates a RawMaterial scrap entry', () => {
  const before = data<RawMaterial[]>(call('GET', '/store/materials/approved')).find((m) => m.id === 2)!;
  const after = data<RawMaterial>(call('POST', '/store/record-waste', { rawMaterialId: 2, wastedQuantity: 10, reason: 'Spill' }));
  assert.equal(after.currentQuantity, before.currentQuantity - 10);
  const scrap = data<ScrapEntry[]>(call('GET', '/scrap/pending'));
  assert.ok(scrap.some((e) => e.sourceType === 'RawMaterial' && e.referenceId === 2 && e.scrapReason === 'Spill'));
});

console.log('\nLab (incoming material):');
check('pending-materials lists the new material; passing it approves it', () => {
  assert.ok(data<PendingMaterial[]>(call('GET', '/lab/pending-materials')).some((m) => m.id === newMaterialId));
  data<LabResult>(call('POST', '/lab/submit-result', { inspectionType: 'IncomingMaterial', batchId: null, rawMaterialId: newMaterialId, resultDetails: 'OK', isPassed: true, notes: null }));
  assert.ok(data<RawMaterial[]>(call('GET', '/store/materials/approved')).some((m) => m.id === newMaterialId));
  failure(
    call('POST', '/lab/submit-result', { inspectionType: 'IncomingMaterial', batchId: null, rawMaterialId: newMaterialId, resultDetails: 'again', isPassed: true, notes: null }),
    400,
    'ALREADY_INSPECTED'
  );
});
check('failing an incoming material removes it from pending and scraps its stock', () => {
  data<LabResult>(call('POST', '/lab/submit-result', { inspectionType: 'IncomingMaterial', batchId: null, rawMaterialId: 5, resultDetails: 'Moisture too high', isPassed: false, notes: null }));
  assert.ok(!data<PendingMaterial[]>(call('GET', '/lab/pending-materials')).some((m) => m.id === 5));
  assert.ok(data<ScrapEntry[]>(call('GET', '/scrap/pending')).some((e) => e.sourceType === 'RawMaterial' && e.referenceId === 5 && e.quantity === 450));
});

console.log('\nFull batch lifecycle:');
let batch!: ProductionBatch;
check('start-batch deducts stock and creates In_Production batch', () => {
  batch = data<ProductionBatch>(call('POST', '/production/start-batch', { productId: 201, rawMaterialId: newMaterialId, issuedMaterialQty: 100 }));
  assert.equal(batch.currentState, 'In_Production');
  assert.match(batch.batchNumber, /^B-\d{4}-\d{4}$/);
  const mat = data<RawMaterial[]>(call('GET', '/store/materials/approved')).find((m) => m.id === newMaterialId)!;
  assert.equal(mat.currentQuantity, 400);
});
check('finish-batch rejects negative scrap (produced + returned > issued)', () => {
  failure(call('POST', '/production/finish-batch', { batchId: batch.id, producedQty: 90, returnedMaterialQty: 20, expiryDate: future(300) }), 400, 'INVALID_QUANTITIES');
});
check('finish-batch applies Scrap = Issued - (Produced + Returned), returns stock, moves to Waiting_QC', () => {
  const b = data<ProductionBatch>(call('POST', '/production/finish-batch', { batchId: batch.id, producedQty: 90, returnedMaterialQty: 5, expiryDate: future(300) }));
  assert.equal(b.scrapQty, 5);
  assert.equal(b.currentState, 'Waiting_QC');
  const mat = data<RawMaterial[]>(call('GET', '/store/materials/approved')).find((m) => m.id === newMaterialId)!;
  assert.equal(mat.currentQuantity, 405);
  assert.ok(data<ScrapEntry[]>(call('GET', '/scrap/pending')).some((e) => e.sourceType === 'ProductionLine' && e.referenceId === b.id && e.quantity === 5));
});
check('lab pass -> QC_Passed and appears in manager approvals', () => {
  assert.ok(data<BatchSummary[]>(call('GET', '/lab/pending-batches')).some((b) => b.id === batch.id));
  data<LabResult>(call('POST', '/lab/submit-result', { inspectionType: 'FinishedBatch', batchId: batch.id, rawMaterialId: null, resultDetails: 'Within spec', isPassed: true, notes: 'Clean run' }));
  assert.ok(data<BatchSummary[]>(call('GET', '/manager/pending-approvals')).some((b) => b.id === batch.id));
});
check('rejecting needs a reason; approving makes the batch ready to ship', () => {
  failure(call('POST', '/manager/decision', { batchId: batch.id, approve: false, reason: null }), 400, 'VALIDATION_ERROR');
  const b = data<ProductionBatch>(call('POST', '/manager/decision', { batchId: batch.id, approve: true, reason: null }));
  assert.equal(b.currentState, 'Ready_For_Shipping');
  assert.ok(data<BatchSummary[]>(call('GET', '/shipping/ready')).some((x) => x.id === batch.id));
});
check('create shipment marks the batch Shipped and lists it in history', () => {
  failure(call('POST', '/shipping/create', { batchId: 9, clientName: 'A', driverName: 'B', truckPlates: 'C' }), 400, 'INVALID_BATCH_STATE');
  const s = data<ShipmentRecord>(call('POST', '/shipping/create', { batchId: batch.id, clientName: 'Cairo Foods', driverName: 'Sami', truckPlates: 'QWE 111' }));
  assert.equal(s.batchNumber, batch.batchNumber);
  const history = data<PagedResult<ShipmentRecord>>(call('GET', '/shipping/all', undefined, { page: 1, pageSize: 10 }));
  assert.equal(history.items[0].id, s.id);
  assert.ok(!data<BatchSummary[]>(call('GET', '/shipping/ready')).some((x) => x.id === batch.id));
});
check('traceability tells the whole story (case-insensitive batch number)', () => {
  const t = data<Traceability>(call('GET', `/reports/traceability/by-number/${encodeURIComponent(batch.batchNumber.toLowerCase())}`));
  assert.equal(t.currentState, 'Shipped');
  assert.equal(t.rawMaterialName, 'Test Resin');
  assert.equal(t.createdByUser, 'Ahmed Hassan');
  assert.equal(t.labResultsSummary.length, 1);
  assert.match(t.managerDecisionSummary ?? '', /Approved/);
  assert.match(t.shippingSummary ?? '', /Cairo Foods/);
  failure(call('GET', '/reports/traceability/by-number/B-0000-0000'), 404, 'BATCH_NOT_FOUND');
});

console.log('\nQuarantine paths:');
check('reject -> Quarantine -> RequestRework -> ApproveRework -> Rework_In_Progress -> finish again', () => {
  const rejected = data<ProductionBatch>(call('POST', '/manager/decision', { batchId: 5, approve: false, reason: 'Cracks found' }));
  assert.equal(rejected.currentState, 'Quarantine');
  const entry = data<ScrapEntry[]>(call('GET', '/scrap/pending')).find((e) => e.sourceType === 'ManagerRejection' && e.referenceId === 5)!;
  assert.equal(entry.finalDecision, 'Pending');
  assert.equal(data<ScrapEntry>(call('POST', '/scrap/quality-decision', { scrapEntryId: entry.id, decision: 'RequestRework' })).finalDecision, 'Sent_To_Rework');
  const reworked = data<ProductionBatch>(call('POST', `/scrap/approve-rework/${entry.id}`));
  assert.equal(reworked.currentState, 'Rework_In_Progress');
  assert.equal(reworked.isReworked, true);
  assert.ok(!data<ScrapEntry[]>(call('GET', '/scrap/pending')).some((e) => e.id === entry.id));
  assert.equal(data<ProductionBatch>(call('POST', '/production/finish-batch', { batchId: 5, producedQty: 1000, returnedMaterialQty: 100, expiryDate: future(250) })).currentState, 'Waiting_QC');
});
check('reject -> Destroy marks the batch Destroyed; rework is blocked for raw-material scrap', () => {
  data<ProductionBatch>(call('POST', '/manager/decision', { batchId: 6, approve: false, reason: 'Off-colour' }));
  const entry = data<ScrapEntry[]>(call('GET', '/scrap/pending')).find((e) => e.sourceType === 'ManagerRejection' && e.referenceId === 6)!;
  data<ScrapEntry>(call('POST', '/scrap/quality-decision', { scrapEntryId: entry.id, decision: 'Destroy' }));
  assert.equal(data<PagedResult<ProductionBatch>>(call('GET', '/production/batches', undefined, { page: 1, pageSize: 100 })).items.find((b) => b.id === 6)!.currentState, 'Destroyed');
  failure(call('POST', '/scrap/quality-decision', { scrapEntryId: 2, decision: 'RequestRework' }), 400, 'REWORK_NOT_SUPPORTED');
  failure(call('POST', `/scrap/approve-rework/${entry.id}`), 400, 'INVALID_STATE');
});
check('a lab-failed batch cannot be approved', () => {
  failure(call('POST', '/manager/decision', { batchId: 13, approve: true, reason: null }), 400, 'INVALID_BATCH_STATE');
});

console.log('\nReports:');
check('dashboard counters match the batch list', () => {
  const all = data<PagedResult<ProductionBatch>>(call('GET', '/production/batches', undefined, { page: 1, pageSize: 100 })).items;
  const stats = data<DashboardStats>(call('GET', '/reports/dashboard-stats'));
  assert.equal(stats.totalBatches, all.length);
  assert.equal(stats.inProductionCount, all.filter((b) => b.currentState === 'In_Production').length);
  assert.equal(stats.waitingQcCount, all.filter((b) => b.currentState === 'Waiting_QC').length);
  assert.equal(stats.pendingApprovalCount, all.filter((b) => b.currentState === 'QC_Passed').length);
  assert.equal(stats.shippedCount, all.filter((b) => b.currentState === 'Shipped').length);
  assert.equal(stats.quarantineCount, all.filter((b) => b.currentState === 'Quarantine').length);
  assert.equal(stats.totalReworkedBatches, all.filter((b) => b.isReworked).length);
});
check('unknown routes return 404 envelope', () => {
  failure(call('GET', '/nope'), 404, 'NOT_FOUND');
});

console.log(`\n${passed} checks passed.`);
