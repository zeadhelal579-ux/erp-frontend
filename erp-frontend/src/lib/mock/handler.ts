import type {
  ApiResponse,
  BatchState,
  BatchSummary,
  DashboardStats,
  LabResult,
  LoginResponse,
  PagedResult,
  PendingMaterial,
  PhysicalState,
  ProductionBatch,
  RawMaterial,
  ScrapEntry,
  ScrapSourceType,
  ShipmentRecord,
  Traceability,
} from '../types/api';
import { MOCK_ACCOUNTS } from './accounts';

// ==========================================================================
// باك إند وهمي بيشتغل بالكامل داخل المتصفح (الوضع التجريبي). بيحاكي نفس المسارات
// والأغلفة (ApiResponse<T>) وقواعد دورة حياة التشغيلة الموجودة في الـ api.ts لكل
// feature، عشان أي شاشة تشتغل من غير ما تعرف إن مفيش سيرفر. البيانات في الذاكرة
// بس: أي تحديث للصفحة (F5) بيرجّعها للبيانات الأولية.
// الدالة الأساسية handleMockRequest دالة عادية من غير axios، عشان تتجرّب مباشرة.
// ==========================================================================

export interface MockRequest {
  method: string;
  path: string;
  params?: Record<string, unknown>;
  body?: unknown;
  token: string | null;
}

export interface MockReply {
  status: number;
  envelope: ApiResponse<unknown>;
}

interface Decision {
  batchId: number;
  approve: boolean;
  reason: string | null;
  by: string;
  at: string;
}

interface Db {
  materials: RawMaterial[];
  rejectedMaterialIds: Set<number>;
  batches: ProductionBatch[];
  batchCreators: Map<number, string>;
  scrap: ScrapEntry[];
  labResults: LabResult[];
  decisions: Decision[];
  shipments: ShipmentRecord[];
}

const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString();
const daysAhead = (n: number) => new Date(Date.now() + n * DAY).toISOString();
const r2 = (n: number) => Math.round(n * 100) / 100;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const batchNumberFor = (id: number) => `B-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`;

// ---------------------------------------------------------------- بيانات أولية

function createDb(): Db {
  const material = (
    id: number,
    materialName: string,
    supplierName: string,
    currentQuantity: number,
    physicalState: PhysicalState,
    expiryInDays: number,
    isQCApproved: boolean
  ): RawMaterial => ({
    id,
    materialName,
    supplierName,
    currentQuantity,
    physicalState,
    expiryDate: daysAhead(expiryInDays),
    isQCApproved,
  });

  const materials: RawMaterial[] = [
    material(1, 'Polypropylene Granules', 'PolyChem Egypt', 5200, 'Solid', 300, true),
    material(2, 'Titanium Dioxide Pigment', 'ColorTech Industries', 800, 'Powder', 420, true),
    material(3, 'Industrial Solvent X-20', 'ChemSupply Co.', 1200, 'Liquid', 180, true),
    material(4, 'Frozen Resin Blend', 'CryoMaterials Ltd.', 300, 'Frozen', 90, true),
    material(5, 'Carbon Black Powder', 'ColorTech Industries', 450, 'Powder', 365, false),
    material(6, 'Nylon 6 Pellets', 'PolyChem Egypt', 2000, 'Solid', 540, false),
    material(7, 'Plasticizer DOP', 'ChemSupply Co.', 90, 'Liquid', 240, true),
    material(8, 'Anti-UV Stabilizer', 'AddiTech', 260, 'Powder', 270, true),
    material(9, 'Glass Fiber Rovings', 'FiberWorks', 1500, 'Solid', 600, true),
    material(10, 'Silicone Rubber Base', 'SilTech Egypt', 700, 'Solid', 200, true),
    material(11, 'Calcium Carbonate Filler', 'Delta Minerals', 3800, 'Powder', 700, true),
    material(12, 'Epoxy Hardener H-5', 'ChemSupply Co.', 180, 'Liquid', 45, false),
  ];

  const batch = (
    id: number,
    productId: number,
    rawMaterialId: number,
    issued: number,
    produced: number,
    returned: number,
    currentState: BatchState,
    ageDays: number,
    isReworked = false
  ): ProductionBatch => {
    const finished = currentState !== 'In_Production';
    return {
      id,
      batchNumber: batchNumberFor(id),
      productId,
      rawMaterialId,
      issuedMaterialQty: issued,
      producedQty: produced,
      returnedMaterialQty: returned,
      scrapQty: finished ? r2(issued - produced - returned) : 0,
      currentState,
      isReworked,
      expiryDate: finished ? daysAhead(400 - ageDays) : null,
      createdAt: daysAgo(ageDays),
    };
  };

  const batches: ProductionBatch[] = [
    batch(1, 101, 1, 1000, 940, 40, 'Shipped', 40),
    batch(2, 102, 2, 500, 470, 20, 'Shipped', 33),
    batch(3, 101, 1, 800, 760, 30, 'Ready_For_Shipping', 14),
    batch(4, 103, 9, 600, 585, 15, 'Ready_For_Shipping', 10),
    batch(5, 102, 11, 1200, 1100, 60, 'QC_Passed', 6),
    batch(6, 104, 10, 400, 360, 20, 'QC_Passed', 5),
    batch(7, 101, 1, 900, 850, 25, 'Waiting_QC', 3),
    batch(8, 105, 3, 300, 270, 15, 'Waiting_QC', 2),
    batch(9, 103, 9, 700, 0, 0, 'In_Production', 1),
    batch(10, 104, 10, 250, 0, 0, 'In_Production', 0),
    batch(11, 102, 2, 350, 300, 25, 'Quarantine', 12),
    batch(12, 101, 1, 600, 540, 30, 'Rework_In_Progress', 20, true),
    batch(13, 105, 3, 200, 160, 10, 'QC_Failed', 4),
    batch(14, 103, 9, 450, 400, 20, 'Destroyed', 28),
    batch(15, 104, 10, 380, 330, 25, 'Quarantine', 9),
  ];

  const scrapEntry = (
    id: number,
    sourceType: ScrapSourceType,
    referenceId: number,
    quantity: number,
    scrapReason: string,
    finalDecision: ScrapEntry['finalDecision'],
    ageDays: number
  ): ScrapEntry => ({ id, sourceType, referenceId, quantity, scrapReason, finalDecision, createdAt: daysAgo(ageDays) });

  const scrap: ScrapEntry[] = [
    scrapEntry(1, 'ProductionLine', 3, 10, 'Production line scrap (calculated at batch finish)', 'Pending', 14),
    scrapEntry(2, 'RawMaterial', 7, 15, 'Spillage during transfer', 'Pending', 4),
    scrapEntry(3, 'ManagerRejection', 11, 300, 'Failed tensile strength test', 'Pending', 11),
    scrapEntry(4, 'ManagerRejection', 15, 330, 'Surface defects above tolerance', 'Sent_To_Rework', 8),
    scrapEntry(5, 'ManagerRejection', 12, 540, 'Colour deviation from reference sample', 'Reworked', 19),
    scrapEntry(6, 'ManagerRejection', 14, 400, 'Contamination detected', 'Destroyed', 27),
    scrapEntry(7, 'ProductionLine', 13, 30, 'Production line scrap (calculated at batch finish)', 'Pending', 4),
  ];

  const labResults: LabResult[] = [1, 2, 3, 4, 5, 6, 11, 12, 14, 15].map((batchId, i) => ({
    id: i + 1,
    inspectionType: 'FinishedBatch' as const,
    batchId,
    rawMaterialId: null,
    resultDetails: 'Tensile, viscosity and colour within specification',
    isPassed: true,
    notes: null,
    testedAt: daysAgo(Math.max(1, 12 - i)),
  }));
  labResults.push({
    id: labResults.length + 1,
    inspectionType: 'FinishedBatch',
    batchId: 13,
    rawMaterialId: null,
    resultDetails: 'Viscosity out of range',
    isPassed: false,
    notes: 'Retest recommended',
    testedAt: daysAgo(3),
  });

  const decision = (batchId: number, approve: boolean, reason: string | null, ageDays: number): Decision => ({
    batchId,
    approve,
    reason,
    by: 'Hana Samir',
    at: daysAgo(ageDays),
  });

  const decisions: Decision[] = [
    decision(1, true, null, 38),
    decision(2, true, null, 31),
    decision(3, true, null, 12),
    decision(4, true, null, 8),
    decision(11, false, 'Failed tensile strength test', 11),
    decision(12, false, 'Colour deviation from reference sample', 19),
    decision(14, false, 'Contamination detected', 27),
    decision(15, false, 'Surface defects above tolerance', 8),
  ];

  const shipments: ShipmentRecord[] = [
    {
      id: 1,
      batchId: 1,
      batchNumber: batchNumberFor(1),
      clientName: 'Nile Plastics Co.',
      driverName: 'Mahmoud Saeed',
      truckPlates: 'ABC 1234',
      shippingDate: daysAgo(36),
    },
    {
      id: 2,
      batchId: 2,
      batchNumber: batchNumberFor(2),
      clientName: 'Delta Packaging',
      driverName: 'Karim Fawzy',
      truckPlates: 'XYZ 5678',
      shippingDate: daysAgo(29),
    },
  ];

  return {
    materials,
    rejectedMaterialIds: new Set<number>(),
    batches,
    batchCreators: new Map(batches.map((b) => [b.id, 'Mona Adel'])),
    scrap,
    labResults,
    decisions,
    shipments,
  };
}

let db = createDb();

/** يرجّع كل البيانات للحالة الأولية (للاختبارات) */
export function resetMockDb() {
  db = createDb();
}

// ---------------------------------------------------------------- أدوات الرد

function ok<T>(data: T): MockReply {
  return { status: 200, envelope: { success: true, data: clone(data), errorCode: null, message: null } };
}

function fail(status: number, errorCode: string, message: string): MockReply {
  return { status, envelope: { success: false, data: null, errorCode, message } };
}

const notFound = (what: string) => fail(404, 'NOT_FOUND', `${what} غير موجود`);
const badRequest = (code: string, message: string) => fail(400, code, message);

function asRecord(body: unknown): Record<string, unknown> {
  return body !== null && typeof body === 'object' ? (body as Record<string, unknown>) : {};
}
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const num = (v: unknown) => (v === '' || v === null || v === undefined ? NaN : Number(v));

function intParam(v: unknown, fallback: number, min: number, max: number) {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function paged<T>(items: T[], params?: Record<string, unknown>): PagedResult<T> {
  const pageSize = intParam(params?.pageSize, 10, 1, 100);
  const page = intParam(params?.page, 1, 1, 1_000_000);
  const totalCount = items.length;
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    totalCount,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

const newestFirst = <T extends { id: number }>(items: T[]) => [...items].sort((a, b) => b.id - a.id);
const nextId = (items: { id: number }[]) => items.reduce((max, i) => Math.max(max, i.id), 0) + 1;

function toSummary(b: ProductionBatch): BatchSummary {
  return {
    id: b.id,
    batchNumber: b.batchNumber,
    productId: b.productId,
    producedQty: b.producedQty,
    expiryDate: b.expiryDate,
    createdAt: b.createdAt,
  };
}

function toPending(m: RawMaterial): PendingMaterial {
  return {
    id: m.id,
    materialName: m.materialName,
    supplierName: m.supplierName,
    currentQuantity: m.currentQuantity,
    physicalState: m.physicalState,
    expiryDate: m.expiryDate,
  };
}

const findMaterial = (id: number) => db.materials.find((m) => m.id === id);
const findBatch = (id: number) => db.batches.find((b) => b.id === id);

function addScrap(sourceType: ScrapSourceType, referenceId: number, quantity: number, scrapReason: string) {
  const entry: ScrapEntry = {
    id: nextId(db.scrap),
    sourceType,
    referenceId,
    quantity: r2(quantity),
    scrapReason,
    finalDecision: 'Pending',
    createdAt: new Date().toISOString(),
  };
  db.scrap.push(entry);
  return entry;
}

// ---------------------------------------------------------------- Auth

const SESSION_HOURS = 8;
const TOKEN_PREFIX = 'mock.';

function login(body: unknown): MockReply {
  const { username, password } = asRecord(body);
  const account = MOCK_ACCOUNTS.find((a) => a.username === str(username).toLowerCase());
  if (!account || str(password) === '') {
    return fail(401, 'INVALID_CREDENTIALS', 'اسم المستخدم أو كلمة المرور غير صحيحة');
  }
  const result: LoginResponse = {
    token: `${TOKEN_PREFIX}${account.username}`,
    fullName: account.fullName,
    role: account.role,
    expiresAt: new Date(Date.now() + SESSION_HOURS * 3_600_000).toISOString(),
  };
  return ok(result);
}

function userFromToken(token: string | null) {
  if (!token?.startsWith(TOKEN_PREFIX)) return null;
  return MOCK_ACCOUNTS.find((a) => a.username === token.slice(TOKEN_PREFIX.length)) ?? null;
}

// ---------------------------------------------------------------- Store

function addMaterial(body: unknown): MockReply {
  const b = asRecord(body);
  const materialName = str(b.materialName);
  const supplierName = str(b.supplierName);
  const quantity = num(b.quantity);
  const physicalState = str(b.physicalState) as PhysicalState;
  const expiry = new Date(str(b.expiryDate));

  if (!materialName || !supplierName) return badRequest('VALIDATION_ERROR', 'اسم الخامة والمورد مطلوبان');
  if (!Number.isFinite(quantity) || quantity <= 0) return badRequest('VALIDATION_ERROR', 'الكمية يجب أن تكون أكبر من صفر');
  if (!['Liquid', 'Solid', 'Frozen', 'Powder'].includes(physicalState)) {
    return badRequest('VALIDATION_ERROR', 'الحالة الفيزيائية غير صالحة');
  }
  if (Number.isNaN(expiry.getTime()) || expiry.getTime() <= Date.now()) {
    return badRequest('VALIDATION_ERROR', 'تاريخ الصلاحية يجب أن يكون في المستقبل');
  }

  const created: RawMaterial = {
    id: nextId(db.materials),
    materialName,
    supplierName,
    currentQuantity: r2(quantity),
    physicalState,
    expiryDate: expiry.toISOString(),
    isQCApproved: false, // الخامة الجديدة لازم تعدّي فحص المعمل الأول
  };
  db.materials.push(created);
  return ok(created);
}

function issueMaterial(body: unknown): MockReply {
  const b = asRecord(body);
  const material = findMaterial(num(b.rawMaterialId));
  const qty = num(b.quantityToIssue);
  if (!material) return notFound('الخامة');
  if (!Number.isFinite(qty) || qty <= 0) return badRequest('VALIDATION_ERROR', 'الكمية يجب أن تكون أكبر من صفر');
  if (!material.isQCApproved) return badRequest('MATERIAL_NOT_APPROVED', 'الخامة لم تعتمد من المعمل بعد');
  if (qty > material.currentQuantity) return badRequest('INSUFFICIENT_QUANTITY', 'الكمية المطلوبة أكبر من المتاح');
  material.currentQuantity = r2(material.currentQuantity - qty);
  return ok(material);
}

function recordWaste(body: unknown): MockReply {
  const b = asRecord(body);
  const material = findMaterial(num(b.rawMaterialId));
  const qty = num(b.wastedQuantity);
  const reason = str(b.reason);
  if (!material) return notFound('الخامة');
  if (!Number.isFinite(qty) || qty <= 0) return badRequest('VALIDATION_ERROR', 'الكمية يجب أن تكون أكبر من صفر');
  if (!reason) return badRequest('VALIDATION_ERROR', 'سبب الهالك مطلوب');
  if (qty > material.currentQuantity) return badRequest('INSUFFICIENT_QUANTITY', 'الكمية المطلوبة أكبر من المتاح');
  material.currentQuantity = r2(material.currentQuantity - qty);
  addScrap('RawMaterial', material.id, qty, reason);
  return ok(material);
}

// ---------------------------------------------------------------- Production

function startBatch(body: unknown, creator: string): MockReply {
  const b = asRecord(body);
  const productId = num(b.productId);
  const material = findMaterial(num(b.rawMaterialId));
  const qty = num(b.issuedMaterialQty);
  if (!Number.isFinite(productId) || productId <= 0) return badRequest('VALIDATION_ERROR', 'رقم المنتج غير صالح');
  if (!material) return notFound('الخامة');
  if (!Number.isFinite(qty) || qty <= 0) return badRequest('VALIDATION_ERROR', 'الكمية يجب أن تكون أكبر من صفر');
  if (!material.isQCApproved) return badRequest('MATERIAL_NOT_APPROVED', 'الخامة لم تعتمد من المعمل بعد');
  if (qty > material.currentQuantity) return badRequest('INSUFFICIENT_QUANTITY', 'الكمية المطلوبة أكبر من المتاح');

  material.currentQuantity = r2(material.currentQuantity - qty);
  const id = nextId(db.batches);
  const created: ProductionBatch = {
    id,
    batchNumber: batchNumberFor(id),
    productId,
    rawMaterialId: material.id,
    issuedMaterialQty: r2(qty),
    producedQty: 0,
    returnedMaterialQty: 0,
    scrapQty: 0,
    currentState: 'In_Production',
    isReworked: false,
    expiryDate: null,
    createdAt: new Date().toISOString(),
  };
  db.batches.push(created);
  db.batchCreators.set(id, creator);
  return ok(created);
}

function finishBatch(body: unknown): MockReply {
  const b = asRecord(body);
  const batch = findBatch(num(b.batchId));
  const produced = num(b.producedQty);
  const returned = num(b.returnedMaterialQty);
  const expiry = new Date(str(b.expiryDate));
  if (!batch) return notFound('التشغيلة');
  if (batch.currentState !== 'In_Production' && batch.currentState !== 'Rework_In_Progress') {
    return badRequest('INVALID_BATCH_STATE', 'لا يمكن إنهاء تشغيلة في هذه الحالة');
  }
  if (!Number.isFinite(produced) || produced < 0 || !Number.isFinite(returned) || returned < 0) {
    return badRequest('VALIDATION_ERROR', 'الكميات يجب أن تكون صفرًا أو أكثر');
  }
  if (Number.isNaN(expiry.getTime())) return badRequest('VALIDATION_ERROR', 'تاريخ الصلاحية مطلوب');

  // المعادلة الذهبية: Scrap = Issued - (Produced + Returned)
  const scrap = r2(batch.issuedMaterialQty - (produced + returned));
  if (scrap < 0) {
    return badRequest('INVALID_QUANTITIES', 'مجموع الكمية المنتجة والمرتجعة أكبر من الكمية المصروفة');
  }

  batch.producedQty = r2(produced);
  batch.returnedMaterialQty = r2(returned);
  batch.scrapQty = scrap;
  batch.expiryDate = expiry.toISOString();
  batch.currentState = 'Waiting_QC';

  const material = findMaterial(batch.rawMaterialId);
  if (material && returned > 0) material.currentQuantity = r2(material.currentQuantity + returned);
  if (scrap > 0) addScrap('ProductionLine', batch.id, scrap, 'Production line scrap (calculated at batch finish)');
  return ok(batch);
}

// ---------------------------------------------------------------- Lab

function submitLabResult(body: unknown): MockReply {
  const b = asRecord(body);
  const type = str(b.inspectionType);
  const resultDetails = str(b.resultDetails);
  const isPassed = b.isPassed === true;
  const notes = str(b.notes) || null;
  if (!resultDetails) return badRequest('VALIDATION_ERROR', 'تفاصيل النتيجة مطلوبة');

  const result: LabResult = {
    id: nextId(db.labResults),
    inspectionType: type === 'IncomingMaterial' ? 'IncomingMaterial' : 'FinishedBatch',
    batchId: null,
    rawMaterialId: null,
    resultDetails,
    isPassed,
    notes,
    testedAt: new Date().toISOString(),
  };

  if (type === 'IncomingMaterial') {
    const material = findMaterial(num(b.rawMaterialId));
    if (!material) return notFound('الخامة');
    if (material.isQCApproved || db.rejectedMaterialIds.has(material.id)) {
      return badRequest('ALREADY_INSPECTED', 'تم فحص هذه الخامة من قبل');
    }
    result.rawMaterialId = material.id;
    if (isPassed) {
      material.isQCApproved = true;
    } else {
      db.rejectedMaterialIds.add(material.id);
      addScrap('RawMaterial', material.id, material.currentQuantity, `Failed incoming inspection: ${resultDetails}`);
      material.currentQuantity = 0;
    }
  } else if (type === 'FinishedBatch') {
    const batch = findBatch(num(b.batchId));
    if (!batch) return notFound('التشغيلة');
    if (batch.currentState !== 'Waiting_QC') {
      return badRequest('INVALID_BATCH_STATE', 'التشغيلة ليست في انتظار فحص المعمل');
    }
    result.batchId = batch.id;
    batch.currentState = isPassed ? 'QC_Passed' : 'QC_Failed';
  } else {
    return badRequest('VALIDATION_ERROR', 'نوع الفحص غير صالح');
  }

  db.labResults.push(result);
  return ok(result);
}

// ---------------------------------------------------------------- Manager

function makeDecision(body: unknown, decidedBy: string): MockReply {
  const b = asRecord(body);
  const batch = findBatch(num(b.batchId));
  const approve = b.approve === true;
  const reason = str(b.reason) || null;
  if (!batch) return notFound('التشغيلة');
  if (batch.currentState !== 'QC_Passed' && batch.currentState !== 'QC_Failed') {
    return badRequest('INVALID_BATCH_STATE', 'لا يمكن اتخاذ قرار على تشغيلة في هذه الحالة');
  }
  if (approve && batch.currentState === 'QC_Failed') {
    return badRequest('INVALID_BATCH_STATE', 'لا يمكن اعتماد تشغيلة راسبة معمليًا');
  }
  if (!approve && !reason) return badRequest('VALIDATION_ERROR', 'سبب الرفض مطلوب');

  db.decisions.push({ batchId: batch.id, approve, reason, by: decidedBy, at: new Date().toISOString() });
  if (approve) {
    batch.currentState = 'Ready_For_Shipping';
  } else {
    batch.currentState = 'Quarantine';
    addScrap('ManagerRejection', batch.id, batch.producedQty, reason ?? '');
  }
  return ok(batch);
}

// ---------------------------------------------------------------- Scrap & Quarantine

function qualityDecision(body: unknown): MockReply {
  const b = asRecord(body);
  const entry = db.scrap.find((e) => e.id === num(b.scrapEntryId));
  const decision = str(b.decision);
  if (!entry) return notFound('سطر الهالك');
  if (entry.finalDecision !== 'Pending') return badRequest('INVALID_STATE', 'تم اتخاذ قرار على هذا السطر من قبل');

  if (decision === 'Destroy') {
    entry.finalDecision = 'Destroyed';
    if (entry.sourceType === 'ManagerRejection') {
      const batch = findBatch(entry.referenceId);
      if (batch) batch.currentState = 'Destroyed';
    }
    return ok(entry);
  }
  if (decision === 'RequestRework') {
    if (entry.sourceType === 'RawMaterial') {
      return badRequest('REWORK_NOT_SUPPORTED', 'إعادة التصنيع غير متاحة لهالك الخامات');
    }
    entry.finalDecision = 'Sent_To_Rework';
    return ok(entry);
  }
  return badRequest('VALIDATION_ERROR', 'القرار غير صالح');
}

function approveRework(id: number): MockReply {
  const entry = db.scrap.find((e) => e.id === id);
  if (!entry) return notFound('سطر الهالك');
  if (entry.finalDecision !== 'Sent_To_Rework') {
    return badRequest('INVALID_STATE', 'هذا السطر لم يُرسل لإعادة التصنيع');
  }
  const batch = findBatch(entry.referenceId);
  if (!batch) return notFound('التشغيلة');
  entry.finalDecision = 'Reworked';
  batch.isReworked = true;
  if (entry.sourceType === 'ManagerRejection') batch.currentState = 'Rework_In_Progress';
  return ok(batch);
}

// ---------------------------------------------------------------- Shipping

function createShipment(body: unknown): MockReply {
  const b = asRecord(body);
  const batch = findBatch(num(b.batchId));
  const clientName = str(b.clientName);
  const driverName = str(b.driverName);
  const truckPlates = str(b.truckPlates);
  if (!batch) return notFound('التشغيلة');
  if (batch.currentState !== 'Ready_For_Shipping') {
    return badRequest('INVALID_BATCH_STATE', 'التشغيلة غير جاهزة للشحن');
  }
  if (!clientName || !driverName || !truckPlates) {
    return badRequest('VALIDATION_ERROR', 'اسم العميل والسائق ورقم اللوحة مطلوبة');
  }
  const shipment: ShipmentRecord = {
    id: nextId(db.shipments),
    batchId: batch.id,
    batchNumber: batch.batchNumber,
    clientName,
    driverName,
    truckPlates,
    shippingDate: new Date().toISOString(),
  };
  db.shipments.push(shipment);
  batch.currentState = 'Shipped';
  return ok(shipment);
}

// ---------------------------------------------------------------- Reports

function dashboardStats(): MockReply {
  const count = (state: BatchState) => db.batches.filter((b) => b.currentState === state).length;
  const stats: DashboardStats = {
    totalBatches: db.batches.length,
    inProductionCount: count('In_Production'),
    waitingQcCount: count('Waiting_QC'),
    pendingApprovalCount: count('QC_Passed'),
    shippedCount: count('Shipped'),
    quarantineCount: count('Quarantine'),
    totalScrapQty: r2(db.scrap.reduce((sum, e) => sum + e.quantity, 0)),
    totalDestroyedQty: r2(
      db.scrap.filter((e) => e.finalDecision === 'Destroyed').reduce((sum, e) => sum + e.quantity, 0)
    ),
    totalReworkedBatches: db.batches.filter((b) => b.isReworked).length,
  };
  return ok(stats);
}

const fmtDate = (iso: string) => iso.slice(0, 10);

function traceability(batchNumber: string): MockReply {
  const batch = db.batches.find((b) => b.batchNumber.toLowerCase() === batchNumber.trim().toLowerCase());
  if (!batch) return fail(404, 'BATCH_NOT_FOUND', 'رقم التشغيلة غير موجود');

  const material = findMaterial(batch.rawMaterialId);
  const lastDecision = [...db.decisions].reverse().find((d) => d.batchId === batch.id);
  const shipment = db.shipments.find((s) => s.batchId === batch.id);
  const scraps = db.scrap.filter((e) => e.sourceType !== 'RawMaterial' && e.referenceId === batch.id);

  const result: Traceability = {
    batchId: batch.id,
    batchNumber: batch.batchNumber,
    currentState: batch.currentState,
    isReworked: batch.isReworked,
    rawMaterialName: material?.materialName ?? null,
    issuedMaterialQty: batch.issuedMaterialQty,
    producedQty: batch.producedQty,
    returnedMaterialQty: batch.returnedMaterialQty,
    scrapQty: batch.scrapQty,
    expiryDate: batch.expiryDate,
    createdAt: batch.createdAt,
    createdByUser: db.batchCreators.get(batch.id) ?? null,
    labResultsSummary: db.labResults
      .filter((l) => l.batchId === batch.id)
      .map(
        (l) =>
          `${l.isPassed ? 'Passed' : 'Failed'} — ${l.resultDetails}${l.notes ? ` (${l.notes})` : ''} — ${fmtDate(l.testedAt)}`
      ),
    managerDecisionSummary: lastDecision
      ? `${lastDecision.approve ? 'Approved' : 'Rejected'} by ${lastDecision.by} on ${fmtDate(lastDecision.at)}${
          lastDecision.reason ? ` — ${lastDecision.reason}` : ''
        }`
      : null,
    shippingSummary: shipment
      ? `Shipped to ${shipment.clientName} — driver ${shipment.driverName} (${shipment.truckPlates}) on ${fmtDate(
          shipment.shippingDate
        )}`
      : null,
    scrapSummary: scraps.length
      ? scraps.map((e) => `${e.quantity} units — ${e.scrapReason} [${e.finalDecision}]`).join('; ')
      : null,
  };
  return ok(result);
}

// ---------------------------------------------------------------- Router

export function handleMockRequest(req: MockRequest): MockReply {
  const method = req.method.toUpperCase();
  const path = (req.path.split('?')[0].replace(/\/+$/, '') || '/').toLowerCase();

  if (method === 'POST' && path === '/auth/login') return login(req.body);

  const user = userFromToken(req.token);
  if (!user) return fail(401, 'UNAUTHORIZED', 'انتهت الجلسة، سجّل الدخول مرة أخرى');

  if (method === 'GET') {
    switch (path) {
      case '/store/materials':
        return ok(paged(newestFirst(db.materials), req.params));
      case '/store/materials/approved':
        return ok(db.materials.filter((m) => m.isQCApproved && m.currentQuantity > 0));
      case '/production/batches':
        return ok(paged(newestFirst(db.batches), req.params));
      case '/lab/pending-materials':
        return ok(db.materials.filter((m) => !m.isQCApproved && !db.rejectedMaterialIds.has(m.id)).map(toPending));
      case '/lab/pending-batches':
        return ok(db.batches.filter((b) => b.currentState === 'Waiting_QC').map(toSummary));
      case '/manager/pending-approvals':
        return ok(db.batches.filter((b) => b.currentState === 'QC_Passed').map(toSummary));
      case '/scrap/pending':
        return ok(
          newestFirst(db.scrap.filter((e) => e.finalDecision === 'Pending' || e.finalDecision === 'Sent_To_Rework'))
        );
      case '/shipping/ready':
        return ok(db.batches.filter((b) => b.currentState === 'Ready_For_Shipping').map(toSummary));
      case '/shipping/all':
        return ok(paged(newestFirst(db.shipments), req.params));
      case '/reports/dashboard-stats':
        return dashboardStats();
    }
    const trace = /^\/reports\/traceability\/by-number\/(.+)$/.exec(path);
    if (trace) return traceability(decodeURIComponent(trace[1]));
  }

  if (method === 'POST') {
    switch (path) {
      case '/store/add-material':
        return addMaterial(req.body);
      case '/store/issue-material':
        return issueMaterial(req.body);
      case '/store/record-waste':
        return recordWaste(req.body);
      case '/production/start-batch':
        return startBatch(req.body, user.fullName);
      case '/production/finish-batch':
        return finishBatch(req.body);
      case '/lab/submit-result':
        return submitLabResult(req.body);
      case '/manager/decision':
        return makeDecision(req.body, user.fullName);
      case '/scrap/quality-decision':
        return qualityDecision(req.body);
      case '/shipping/create':
        return createShipment(req.body);
    }
    const rework = /^\/scrap\/approve-rework\/(\d+)$/.exec(path);
    if (rework) return approveRework(Number(rework[1]));
  }

  return fail(404, 'NOT_FOUND', 'المسار غير موجود في الوضع التجريبي');
}
