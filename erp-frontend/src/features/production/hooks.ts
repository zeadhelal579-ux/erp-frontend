import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { finishBatch, fetchBatches, startBatch } from './api';

export function useBatches(page: number, pageSize = 10) {
  return useQuery({
    queryKey: ['batches', page, pageSize],
    queryFn: () => fetchBatches(page, pageSize),
  });
}

export function useStartBatch() {
  const queryClient = useQueryClient();
  // ملحوظة تصحيح مهمة: راجعت ProductionService.StartBatchAsync فعليًا، وهو
  // *لا* يخصم من RawMaterial.CurrentQuantity إطلاقًا (الخصم الحقيقي بيحصل
  // بشكل منفصل تمامًا في StoreService.IssueMaterialAsync وقت ما أمين المخزن
  // يصرف الخامة). يعني بدء التشغيلة هنا لا يستدعي تحديث كاش المخزون.
  return useMutation({
    mutationFn: startBatch,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['batches'] }),
  });
}

export function useFinishBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: finishBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      // على عكس StartBatch: إنهاء التشغيلة *بيرجّع* الكمية المرتجعة السليمة
      // لرصيد المخزن فعليًا (material.CurrentQuantity += ReturnedMaterialQty)
      // لو ReturnedMaterialQty > 0 -- فلازم كاش المواد يتحدّث هنا فعلًا.
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}
