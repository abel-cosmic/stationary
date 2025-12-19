import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  sellService,
  type CreateServiceData,
  type UpdateServiceData,
  type SellServiceData,
} from "@/lib/api";
import type { IServiceRepository } from "@/lib/interfaces/service-repository.interface";
import type { Service } from "@/types/api";

/**
 * Service repository implementation
 * Wraps API calls and implements IServiceRepository interface
 */
export class ServiceRepository implements IServiceRepository {
  async getAll(): Promise<Service[]> {
    return getServices();
  }

  async getById(id: number): Promise<Service> {
    return getServiceById(id);
  }

  async create(data: CreateServiceData): Promise<Service> {
    return createService(data);
  }

  async update(id: number, data: UpdateServiceData): Promise<Service> {
    return updateService(id, data);
  }

  async delete(id: number): Promise<void> {
    return deleteService(id);
  }

  async sell(id: number, data: SellServiceData): Promise<Service> {
    return sellService(id, data);
  }
}

// Export singleton instance
export const serviceRepository = new ServiceRepository();
