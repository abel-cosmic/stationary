import type {
  Service,
  CreateServiceData,
  UpdateServiceData,
  SellServiceData,
} from "@/types/api";

/**
 * Repository interface for service data access
 * Follows Dependency Inversion Principle - components depend on abstraction, not concrete implementation
 */
export interface IServiceRepository {
  getAll(): Promise<Service[]>;
  getById(id: number): Promise<Service>;
  create(data: CreateServiceData): Promise<Service>;
  update(id: number, data: UpdateServiceData): Promise<Service>;
  delete(id: number): Promise<void>;
  sell(id: number, data: SellServiceData): Promise<Service>;
}
