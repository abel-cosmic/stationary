"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productRepository } from "@/lib/repositories/product-repository";
import { bulkSell, type BulkSellRequest } from "@/lib/api";
import type {
  CreateProductData,
  UpdateProductData,
  SellProductData,
} from "@/types/api";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => productRepository.getAll(),
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => productRepository.getById(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductData) => productRepository.create(data),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      // If product has a category, invalidate categories to update product count
      if (product.categoryId) {
        queryClient.invalidateQueries({ queryKey: ["categories"] });
      }
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductData }) =>
      productRepository.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products", variables.id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => productRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useSellProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SellProductData }) =>
      productRepository.sell(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products", variables.id] });
    },
  });
}

export function useBulkSell() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkSellRequest) => bulkSell(data),
    onSuccess: () => {
      // Invalidate all products since multiple products may have been updated
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
