import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createShipment, fetchReadyToShip, fetchShipmentHistory } from './api';

export function useReadyToShip() {
  return useQuery({ queryKey: ['shipping', 'ready'], queryFn: fetchReadyToShip });
}

export function useShipmentHistory(page: number) {
  return useQuery({ queryKey: ['shipping', 'history', page], queryFn: () => fetchShipmentHistory(page) });
}

export function useCreateShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createShipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping'] });
      queryClient.invalidateQueries({ queryKey: ['batches'] }); // الحالة بتتحول لـ Shipped
    },
  });
}
