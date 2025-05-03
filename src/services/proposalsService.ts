
import { Proposal } from "@/types/services";
import { invokeFunction } from "./supabaseService";

export const proposalsService = {
  async getMyProposals(): Promise<{ proposal: Proposal; service: any }[]> {
    const data = await invokeFunction('services-management', 'GET', { 
      action: 'my-proposals' 
    });
    
    // Transform the data to match the expected format
    return (data?.data || []).map(item => ({
      proposal: {
        ...item,
        dataCriacao: item.data_criacao,
      },
      service: item.service_requests
    }));
  },

  async submitProposal(proposalData: {
    serviceRequestId: string;
    valor: string;
    prazo: string;
    mensagem: string;
  }): Promise<Proposal> {
    const data = await invokeFunction('services-management', 'POST', { 
      action: 'submit-proposal',
      ...proposalData
    });
    
    return data?.data;
  },

  async updateProposalStatus(proposalData: {
    proposalId: string;
    serviceRequestId: string;
    status: 'aceita' | 'recusada';
    action: 'accept' | 'reject';
  }): Promise<{ proposal: Proposal; project?: any }> {
    const data = await invokeFunction('services-management', 'PUT', { 
      action: 'update-proposal',
      ...proposalData
    });
    
    return {
      proposal: data?.data,
      project: data?.project
    };
  }
};
