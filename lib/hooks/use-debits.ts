"use client";

import {
  createDebit,
  deleteDebit,
  getDebitById,
  getDebits,
  payDebit,
  removeDebitItem,
  updateDebit,
  type CreateDebitData,
  type PayDebitData,
  type UpdateDebitData,
} from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useDebits(params?: {
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["debits", params],
    queryFn: () => getDebits(params),
  });
}

export function useDebit(id: number) {
  return useQuery({
    queryKey: ["debits", id],
    queryFn: () => getDebitById(id),
    enabled: !!id,
  });
}

export function useCreateDebit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDebitData) => createDebit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debits"] });
      queryClient.invalidateQueries({ queryKey: ["sell-history"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateDebit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDebitData }) =>
      updateDebit(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["debits"] });
      queryClient.invalidateQueries({ queryKey: ["debits", variables.id] });
    },
  });
}

export function useDeleteDebit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteDebit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debits"] });
      queryClient.invalidateQueries({ queryKey: ["sell-history"] });
    },
  });
}

export function usePayDebit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PayDebitData }) =>
      payDebit(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["debits"] });
      queryClient.invalidateQueries({ queryKey: ["debits", variables.id] });
    },
  });
}

export function useRemoveDebitItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sellHistoryId: number) => removeDebitItem(sellHistoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debits"] });
      queryClient.invalidateQueries({ queryKey: ["sell-history"] });
    },
  });
}

