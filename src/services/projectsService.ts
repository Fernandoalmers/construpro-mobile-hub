
import { Project } from "@/types/services";
import { invokeFunction } from "./supabaseService";

export const projectsService = {
  async getProjects(isProfessional: boolean): Promise<Project[]> {
    const data = await invokeFunction('services-management', 'GET', { 
      action: 'projects',
      isProfessional: isProfessional.toString() 
    });
    
    return data?.data.map(project => ({
      ...project,
      etapas: project.project_steps || [],
      imagens: project.project_images || []
    })) || [];
  },

  async getProjectById(id: string): Promise<Project> {
    const data = await invokeFunction('services-management', 'GET', { 
      action: 'project',
      id 
    });
    
    return {
      ...data?.data,
      etapas: data?.data.project_steps || [],
      imagens: data?.data.project_images || []
    };
  },

  async updateProjectStatus(updateData: {
    projectId: string;
    status?: string;
    concluido?: boolean;
    comentariosFinais?: string;
  }): Promise<Project> {
    const data = await invokeFunction('services-management', 'PUT', { 
      action: 'update-project',
      ...updateData 
    });
    
    return data?.data;
  },

  async updateProjectStep(updateData: {
    stepId: string;
    concluido?: boolean;
    comentario?: string;
  }): Promise<any> {
    const data = await invokeFunction('services-management', 'PUT', { 
      action: 'update-project-step',
      ...updateData 
    });
    
    return data?.data;
  }
};
