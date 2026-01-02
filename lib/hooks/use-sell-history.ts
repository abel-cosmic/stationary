"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSellHistory,
  getSellHistoryById,
  updateSellHistory,
  deleteSellHistory,
  type UpdateSellHistoryData,
} from "@/lib/api";

export function useSellHistory(params?: {
  productId?: number;
  serviceId?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["sell-history", params],
    queryFn: () => getSellHistory(params),
  });
}

export function useSellHistoryById(id: number) {
  return useQuery({
    queryKey: ["sell-history", id],
    queryFn: () => getSellHistoryById(id),
    enabled: !!id,
  });
}

export function useUpdateSellHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSellHistoryData }) =>
      updateSellHistory(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sell-history"] });
      queryClient.invalidateQueries({ queryKey: ["sell-history", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

export function useDeleteSellHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteSellHistory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sell-history"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

