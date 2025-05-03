
import { Professional } from "@/types/services";
import { invokeFunction } from "./supabaseService";

export const professionalsService = {
  async getProfessionalProfile(professionalId?: string): Promise<Professional> {
    const data = await invokeFunction('services-management', 'GET', { 
      action: 'professional-profile',
      professionalId 
    });
    
    return data?.data;
  },

  async createOrUpdateProfessionalProfile(profileData: Partial<Professional>): Promise<Professional> {
    const data = await invokeFunction('services-management', 'POST', { 
      action: 'professional-profile',
      ...profileData
    });
    
    return data?.data;
  },

  async submitReview(reviewData: {
    projectId: string;
    professionalId: string;
    nota: number;
    comentario: string;
    servicoRealizado: string;
  }): Promise<any> {
    const data = await invokeFunction('services-management', 'POST', { 
      action: 'submit-review',
      ...reviewData
    });
    
    return data?.data;
  }
};
