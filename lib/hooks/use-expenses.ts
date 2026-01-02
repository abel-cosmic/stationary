"use client";

import {
  createDailyExpense,
  createSupplyExpense,
  deleteDailyExpense,
  deleteSupplyExpense,
  getDailyExpenseById,
  getDailyExpenses,
  getSupplyExpenseById,
  getSupplyExpenses,
  updateDailyExpense,
  updateSupplyExpense,
  type CreateDailyExpenseData,
  type CreateSupplyExpenseData,
  type UpdateDailyExpenseData,
  type UpdateSupplyExpenseData,
} from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Supply Expense Hooks
export function useSupplyExpenses(params?: {
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["supply-expenses", params],
    queryFn: () => getSupplyExpenses(params),
  });
}

export function useSupplyExpense(id: number) {
  return useQuery({
    queryKey: ["supply-expenses", id],
    queryFn: () => getSupplyExpenseById(id),
    enabled: !!id,
  });
}

export function useCreateSupplyExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupplyExpenseData) => createSupplyExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supply-expenses"] });
    },
  });
}

export function useUpdateSupplyExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSupplyExpenseData }) =>
      updateSupplyExpense(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["supply-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["supply-expenses", variables.id] });
    },
  });
}

export function useDeleteSupplyExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteSupplyExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supply-expenses"] });
    },
  });
}

// Daily Expense Hooks
export function useDailyExpenses(params?: {
  startDate?: string;
  endDate?: string;
  category?: string;
}) {
  return useQuery({
    queryKey: ["daily-expenses", params],
    queryFn: () => getDailyExpenses(params),
  });
}

export function useDailyExpense(id: number) {
  return useQuery({
    queryKey: ["daily-expenses", id],
    queryFn: () => getDailyExpenseById(id),
    enabled: !!id,
  });
}

export function useCreateDailyExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDailyExpenseData) => createDailyExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-expenses"] });
    },
  });
}

export function useUpdateDailyExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDailyExpenseData }) =>
      updateDailyExpense(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["daily-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["daily-expenses", variables.id] });
    },
  });
}

export function useDeleteDailyExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteDailyExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-expenses"] });
    },
  });
}

