
import { supabase } from "@/integrations/supabase/client";
import { ServiceRequest, Proposal, Project, Professional } from "@/types/services";

export const servicesService = {
  async getAvailableServices(filters?: {
    category?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ServiceRequest[]> {
    try {
      const { data, error } = await supabase.functions.invoke('services-management', {
        path: 'requests',
        query: {
          ...(filters?.category ? { category: filters.category } : {}),
          ...(filters?.status ? { status: filters.status || 'aberto' } : { status: 'aberto' }),
          limit: filters?.limit?.toString() || '10',
          offset: filters?.offset?.toString() || '0',
        }
      });
      
      if (error) {
        console.error('Error fetching services:', error);
        throw error;
      }
      
      return data?.data || [];
    } catch (error) {
      console.error('Error in getAvailableServices:', error);
      throw error;
    }
  },

  async getServiceRequestById(id: string): Promise<ServiceRequest> {
    try {
      const { data, error } = await supabase.functions.invoke('services-management', {
        path: 'request',
        query: { id }
      });
      
      if (error) {
        console.error('Error fetching service request:', error);
        throw error;
      }
      
      return data?.data;
    } catch (error) {
      console.error('Error in getServiceRequestById:', error);
      throw error;
    }
  },

  async getMyProposals(): Promise<{ proposal: Proposal; service: any }[]> {
    try {
      const { data, error } = await supabase.functions.invoke('services-management', {
        path: 'my-proposals'
      });
      
      if (error) {
        console.error('Error fetching my proposals:', error);
        throw error;
      }
      
      // Transform the data to match the expected format
      return (data?.data || []).map(item => ({
        proposal: {
          ...item,
          dataCriacao: item.data_criacao,
        },
        service: item.service_requests
      }));
    } catch (error) {
      console.error('Error in getMyProposals:', error);
      throw error;
    }
  },

  async getProjects(isProfessional: boolean): Promise<Project[]> {
    try {
      const { data, error } = await supabase.functions.invoke('services-management', {
        path: 'projects',
        query: { isProfessional: isProfessional.toString() }
      });
      
      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }
      
      return data?.data.map(project => ({
        ...project,
        etapas: project.project_steps || [],
        imagens: project.project_images || []
      })) || [];
    } catch (error) {
      console.error('Error in getProjects:', error);
      throw error;
    }
  },

  async getProjectById(id: string): Promise<Project> {
    try {
      const { data, error } = await supabase.functions.invoke('services-management', {
        path: 'project',
        query: { id }
      });
      
      if (error) {
        console.error('Error fetching project:', error);
        throw error;
      }
      
      return {
        ...data?.data,
        etapas: data?.data.project_steps || [],
        imagens: data?.data.project_images || []
      };
    } catch (error) {
      console.error('Error in getProjectById:', error);
      throw error;
    }
  },

  async createServiceRequest(requestData: Omit<ServiceRequest, 'id' | 'clienteId' | 'dataCriacao' | 'propostas' | 'status'>): Promise<ServiceRequest> {
    try {
      const { data, error } = await supabase.functions.invoke('services-management', {
        path: 'create-request',
        method: 'POST',
        body: requestData
      });
      
      if (error) {
        console.error('Error creating service request:', error);
        throw error;
      }
      
      return data?.data;
    } catch (error) {
      console.error('Error in createServiceRequest:', error);
      throw error;
    }
  },

  async submitProposal(proposalData: {
    serviceRequestId: string;
    valor: string;
    prazo: string;
    mensagem: string;
  }): Promise<Proposal> {
    try {
      const { data, error } = await supabase.functions.invoke('services-management', {
        path: 'submit-proposal',
        method: 'POST',
        body: proposalData
      });
      
      if (error) {
        console.error('Error submitting proposal:', error);
        throw error;
      }
      
      return data?.data;
    } catch (error) {
      console.error('Error in submitProposal:', error);
      throw error;
    }
  },

  async updateProposalStatus(proposalData: {
    proposalId: string;
    serviceRequestId: string;
    status: 'aceita' | 'recusada';
    action: 'accept' | 'reject';
  }): Promise<{ proposal: Proposal; project?: Project }> {
    try {
      const { data, error } = await supabase.functions.invoke('services-management', {
        path: 'update-proposal',
        method: 'PUT',
        body: proposalData
      });
      
      if (error) {
        console.error('Error updating proposal status:', error);
        throw error;
      }
      
      return {
        proposal: data?.data,
        project: data?.project
      };
    } catch (error) {
      console.error('Error in updateProposalStatus:', error);
      throw error;
    }
  },

  async updateProjectStatus(updateData: {
    projectId: string;
    status?: string;
    concluido?: boolean;
    comentariosFinais?: string;
  }): Promise<Project> {
    try {
      const { data, error } = await supabase.functions.invoke('services-management', {
        path: 'update-project',
        method: 'PUT',
        body: updateData
      });
      
      if (error) {
        console.error('Error updating project status:', error);
        throw error;
      }
      
      return data?.data;
    } catch (error) {
      console.error('Error in updateProjectStatus:', error);
      throw error;
    }
  },

  async updateProjectStep(updateData: {
    stepId: string;
    concluido?: boolean;
    comentario?: string;
  }): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('services-management', {
        path: 'update-project-step',
        method: 'PUT',
        body: updateData
      });
      
      if (error) {
        console.error('Error updating project step:', error);
        throw error;
      }
      
      return data?.data;
    } catch (error) {
      console.error('Error in updateProjectStep:', error);
      throw error;
    }
  },

  async getProfessionalProfile(professionalId?: string): Promise<Professional> {
    try {
      const { data, error } = await supabase.functions.invoke('services-management', {
        path: 'professional-profile',
        query: professionalId ? { id: professionalId } : {}
      });
      
      if (error) {
        console.error('Error fetching professional profile:', error);
        throw error;
      }
      
      return data?.data;
    } catch (error) {
      console.error('Error in getProfessionalProfile:', error);
      throw error;
    }
  },

  async createOrUpdateProfessionalProfile(profileData: Partial<Professional>): Promise<Professional> {
    try {
      const { data, error } = await supabase.functions.invoke('services-management', {
        path: 'professional-profile',
        method: 'POST',
        body: profileData
      });
      
      if (error) {
        console.error('Error updating professional profile:', error);
        throw error;
      }
      
      return data?.data;
    } catch (error) {
      console.error('Error in createOrUpdateProfessionalProfile:', error);
      throw error;
    }
  },

  async submitReview(reviewData: {
    projectId: string;
    professionalId: string;
    nota: number;
    comentario: string;
    servicoRealizado: string;
  }): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('services-management', {
        path: 'submit-review',
        method: 'POST',
        body: reviewData
      });
      
      if (error) {
        console.error('Error submitting review:', error);
        throw error;
      }
      
      return data?.data;
    } catch (error) {
      console.error('Error in submitReview:', error);
      throw error;
    }
  }
};
