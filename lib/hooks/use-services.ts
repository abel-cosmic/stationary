"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { serviceRepository } from "@/lib/repositories/service-repository";
import type {
  CreateServiceData,
  UpdateServiceData,
  SellServiceData,
} from "@/types/api";

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: () => serviceRepository.getAll(),
  });
}

export function useService(id: number) {
  return useQuery({
    queryKey: ["services", id],
    queryFn: () => serviceRepository.getById(id),
    enabled: !!id,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceData) => serviceRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateServiceData }) =>
      serviceRepository.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["services", variables.id] });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => serviceRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

export function useSellService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SellServiceData }) =>
      serviceRepository.sell(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["services", variables.id] });
      // Also invalidate products to refresh sell history
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
