
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
      const queryParams: Record<string, string> = {};
      if (filters?.category) queryParams.category = filters.category;
      if (filters?.status) queryParams.status = filters.status || 'aberto';
      if (filters?.limit) queryParams.limit = filters.limit.toString();
      if (filters?.offset) queryParams.offset = filters.offset.toString();

      const { data, error } = await supabase.functions.invoke('services-management', {
        method: 'GET',
        query: queryParams,
        body: { action: 'requests' }
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
        method: 'GET',
        query: { id },
        body: { action: 'request' }
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
        method: 'GET',
        body: { action: 'my-proposals' }
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
        method: 'GET',
        query: { isProfessional: isProfessional.toString() },
        body: { action: 'projects' }
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
        method: 'GET',
        query: { id },
        body: { action: 'project' }
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

  async createServiceRequest(requestData: {
    titulo: string;
    descricao: string;
    categoria: string;
    endereco: string;
    orcamento: string | null;
  }): Promise<ServiceRequest> {
    try {
      const { data, error } = await supabase.functions.invoke('services-management', {
        method: 'POST',
        body: { 
          action: 'create-request',
          ...requestData
        }
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
        method: 'POST',
        body: { 
          action: 'submit-proposal',
          ...proposalData
        }
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
        method: 'PUT',
        body: { 
          action: 'update-proposal',
          ...proposalData
        }
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
        method: 'PUT',
        body: { 
          action: 'update-project',
          ...updateData 
        }
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
        method: 'PUT',
        body: { 
          action: 'update-project-step',
          ...updateData 
        }
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
      const queryParams: Record<string, string> = {};
      if (professionalId) queryParams.id = professionalId;

      const { data, error } = await supabase.functions.invoke('services-management', {
        method: 'GET',
        query: queryParams,
        body: { action: 'professional-profile' }
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
        method: 'POST',
        body: { 
          action: 'professional-profile',
          ...profileData
        }
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
        method: 'POST',
        body: { 
          action: 'submit-review',
          ...reviewData
        }
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
