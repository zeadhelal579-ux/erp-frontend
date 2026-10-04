// ============================================================================
// أنواع منقولة حرفيًا من DTOs الفعلية في ERP-Backend-Migrated.zip (مش افتراضات
// من مستند التصميم المعماري). كل اسم حقل هنا اتنسخ بالظبط من كلاس الـ C# المقابل
// له، بعد تحويل PascalCase إلى camelCase (المطابق لسلوك System.Text.Json
// الافتراضي في ASP.NET Core). لو الباك إند اتغيّر، رجّع مراجعة هذا الملف مقابل
// مجلد DTOs/ الفعلي قبل أي تعديل هنا.
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  errorCode: string | null;
  message: string | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// -------------------- Auth --------------------

export type UserRole =
  | 'SuperAdmin'
  | 'Storekeeper'
  | 'ProductionManager'
  | 'LabTech'
  | 'QualityManager'
  | 'GeneralManager';

export interface LoginRequest {
  username: string;
  password: string;
}

// LoginResponseDto الحقيقي: Token, FullName, Role, ExpiresAt فقط —
// مفيش Id ولا Username راجعين. القيمة دي ثابتة، متتوقعش شكل تاني.
export interface LoginResponse {
  token: string;
  fullName: string;
  role: UserRole;
  expiresAt: string;
}

// -------------------- Store / Inventory --------------------

// مؤكدة بالـ 4 قيم دول بالظبط عبر AddRawMaterialValidator.ValidStates في الباك إند.
export type PhysicalState = 'Liquid' | 'Solid' | 'Frozen' | 'Powder';

export interface RawMaterial {
  id: number;
  materialName: string;
  supplierName: string;
  currentQuantity: number;
  physicalState: PhysicalState;
  expiryDate: string;
  isQCApproved: boolean;
}

export interface AddRawMaterialRequest {
  materialName: string;
  supplierName: string;
  quantity: number; // اسم الحقل في الطلب "quantity" مش "currentQuantity" (اللي في الرد بس)
  physicalState: PhysicalState;
  expiryDate: string;
}

export interface IssueMaterialRequest {
  rawMaterialId: number;
  quantityToIssue: number; // مش "quantity" -- الاسم الحقيقي في IssueMaterialDto
}

export interface RecordMaterialWasteRequest {
  rawMaterialId: number;
  wastedQuantity: number;
  reason: string;
}

// -------------------- Production --------------------

export type BatchState =
  | 'In_Production'
  | 'Waiting_QC'
  | 'QC_Passed'
  | 'QC_Failed'
  | 'Ready_For_Shipping'
  | 'Quarantine'
  | 'Rework_In_Progress'
  | 'Shipped'
  | 'Destroyed';

// BatchResponseDto الحقيقي مفيهوش productName ولا rawMaterialName -- مجرد IDs.
// الفرونت بيعمل lookup محلي على قائمة الخامات المعتمدة اللي أصلًا بيجيبها
// عشان يعرض اسم الخامة؛ اسم المنتج للأسف مش متاح من غير Endpoint إضافي
// (راجع قسم "فجوات مكتشفة" في التقرير المرفق).
export interface ProductionBatch {
  id: number;
  batchNumber: string;
  productId: number;
  rawMaterialId: number;
  issuedMaterialQty: number;
  producedQty: number;
  returnedMaterialQty: number;
  scrapQty: number;
  currentState: BatchState;
  isReworked: boolean;
  expiryDate: string | null;
  createdAt: string;
}

export interface BatchSummary {
  id: number;
  batchNumber: string;
  productId: number;
  producedQty: number;
  expiryDate: string | null;
  createdAt: string;
}

export interface StartBatchRequest {
  productId: number;
  rawMaterialId: number;
  issuedMaterialQty: number;
}

export interface FinishBatchRequest {
  batchId: number;
  producedQty: number;
  returnedMaterialQty: number;
  expiryDate: string; // مطلوب هنا (مش Nullable) خلافًا لحقل الرد
}

// -------------------- Lab --------------------

export type InspectionType = 'IncomingMaterial' | 'FinishedBatch';

export interface PendingMaterial {
  id: number;
  materialName: string;
  supplierName: string;
  currentQuantity: number;
  physicalState: PhysicalState;
  expiryDate: string;
}

export interface SubmitLabResultRequest {
  inspectionType: InspectionType;
  batchId: number | null;
  rawMaterialId: number | null;
  resultDetails: string;
  isPassed: boolean;
  notes: string | null;
}

export interface LabResult {
  id: number;
  inspectionType: InspectionType;
  batchId: number | null;
  rawMaterialId: number | null;
  resultDetails: string;
  isPassed: boolean;
  notes: string | null;
  testedAt: string;
}

// -------------------- Manager (Approvals) --------------------

export interface ManagerDecisionRequest {
  batchId: number;
  approve: boolean; // true = Approve, false = Reject -- إندبوينت واحد بس للاتنين
  reason: string | null; // إجباري فعليًا لو approve=false (ManagerDecisionValidator)
}

// -------------------- Scrap & Quarantine --------------------

export type ScrapSourceType = 'RawMaterial' | 'ProductionLine' | 'ManagerRejection';
export type ScrapFinalDecision = 'Pending' | 'Sent_To_Rework' | 'Reworked' | 'Destroyed';
export type ScrapDecision = 'Destroy' | 'RequestRework';

export interface ScrapEntry {
  id: number;
  sourceType: ScrapSourceType;
  referenceId: number;
  quantity: number;
  scrapReason: string;
  finalDecision: ScrapFinalDecision;
  createdAt: string;
}

export interface ScrapDecisionRequest {
  scrapEntryId: number;
  decision: ScrapDecision;
}

// -------------------- Shipping --------------------

export interface ShipmentRecord {
  id: number;
  batchId: number;
  batchNumber: string;
  clientName: string;
  driverName: string;
  truckPlates: string;
  shippingDate: string;
}

// مفيش shippingDate هنا -- الباك إند بيسجّلها UtcNow تلقائيًا، مفيش حقل تاريخ
// بيتبعت من الفرونت خالص (راجع قسم "فجوات مكتشفة" في التقرير المرفق).
export interface CreateShipmentRequest {
  batchId: number;
  clientName: string;
  driverName: string;
  truckPlates: string;
}

// -------------------- Reports --------------------

// شكل حقيقي 100% لكن أضيق كتير من تصميم Stitch المعتمد: مفيش ReadyToShipCount،
// ومفيش تفصيل زمني للرسم البياني، ومفيش تقسيم الهالك حسب المصدر. الشاشة اتبنت
// على أساس الحقول دي بالظبط -- مفيش أي رقم متلفّق. راجع التقرير المرفق.
export interface DashboardStats {
  totalBatches: number;
  inProductionCount: number;
  waitingQcCount: number;
  pendingApprovalCount: number; // ملحوظة: بيحسب QC_Passed بس فعليًا في الباك إند
  shippedCount: number;
  quarantineCount: number;
  totalScrapQty: number;
  totalDestroyedQty: number;
  totalReworkedBatches: number;
}

// شكل مسطّح من نصوص جاهزة (مش خطوات منفصلة بتاريخ/فاعل لكل واحدة زي تصميم
// Stitch)-- الباك إند بيرجّع ملخصات نصية جاهزة بس لكل مرحلة، مش بيانات مُهيكلة.
export interface Traceability {
  batchId: number;
  batchNumber: string;
  currentState: BatchState;
  isReworked: boolean;
  rawMaterialName: string | null;
  issuedMaterialQty: number;
  producedQty: number;
  returnedMaterialQty: number;
  scrapQty: number;
  expiryDate: string | null;
  createdAt: string;
  createdByUser: string | null;
  labResultsSummary: string[];
  managerDecisionSummary: string | null;
  shippingSummary: string | null;
  scrapSummary: string | null;
}
