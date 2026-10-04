import { apiClient, unwrap } from '@/lib/api-client';
import type {
  AddRawMaterialRequest,
  ApiResponse,
  IssueMaterialRequest,
  PagedResult,
  RawMaterial,
  RecordMaterialWasteRequest,
} from '@/lib/types/api';

// كل المسارات دي منسوخة حرفيًا من StoreController.cs الفعلي (مش افتراضات).

export function fetchMaterials(page: number, pageSize = 10) {
  return unwrap(
    apiClient.get<ApiResponse<PagedResult<RawMaterial>>>('/store/materials', {
      params: { page, pageSize },
    })
  );
}

/** مستخدمة في شاشة الإنتاج لملء Dropdown الخامات المتاحة للصرف */
export function fetchApprovedMaterials() {
  return unwrap(apiClient.get<ApiResponse<RawMaterial[]>>('/store/materials/approved'));
}

export function addMaterial(input: AddRawMaterialRequest) {
  return unwrap(apiClient.post<ApiResponse<RawMaterial>>('/store/add-material', input));
}

export function issueMaterial(input: IssueMaterialRequest) {
  return unwrap(apiClient.post<ApiResponse<RawMaterial>>('/store/issue-material', input));
}

export function recordMaterialWaste(input: RecordMaterialWasteRequest) {
  return unwrap(apiClient.post<ApiResponse<RawMaterial>>('/store/record-waste', input));
}
