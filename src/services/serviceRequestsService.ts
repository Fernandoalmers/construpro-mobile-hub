
import { ServiceRequest } from "@/types/services";
import { invokeFunction } from "./supabaseService";

export const serviceRequestsService = {
  async getAvailableServices(filters?: {
    category?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ServiceRequest[]> {
    const requestBody: Record<string, any> = { 
      action: 'requests'
    };
    
    if (filters?.category) requestBody.category = filters.category;
    if (filters?.status) requestBody.status = filters.status || 'aberto';
    if (filters?.limit) requestBody.limit = filters.limit;
    if (filters?.offset) requestBody.offset = filters.offset;
    
    const data = await invokeFunction('services-management', 'GET', requestBody);
    
    return data?.data || [];
  },

  async getServiceRequestById(id: string): Promise<ServiceRequest> {
    const data = await invokeFunction('services-management', 'GET', { 
      action: 'request', 
      id 
    });
    
    return data?.data;
  },

  async createServiceRequest(requestData: {
    titulo: string;
    descricao: string;
    categoria: string;
    endereco: string;
    orcamento: string | null;
  }): Promise<ServiceRequest> {
    const data = await invokeFunction('services-management', 'POST', { 
      action: 'create-request',
      ...requestData
    });
    
    return data?.data;
  }
};
