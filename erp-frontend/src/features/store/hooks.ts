import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addMaterial, fetchApprovedMaterials, fetchMaterials, issueMaterial, recordMaterialWaste } from './api';

export function useMaterials(page: number) {
  return useQuery({
    queryKey: ['materials', page],
    queryFn: () => fetchMaterials(page),
  });
}

export function useApprovedMaterials() {
  return useQuery({
    queryKey: ['materials', 'approved'],
    queryFn: fetchApprovedMaterials,
  });
}

export function useAddMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addMaterial,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materials'] }),
  });
}

export function useIssueMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: issueMaterial,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materials'] }),
  });
}

export function useRecordMaterialWaste() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recordMaterialWaste,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materials'] }),
  });
}
