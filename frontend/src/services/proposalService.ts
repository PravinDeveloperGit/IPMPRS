import api from './api';
import { Proposal, Observation, Decision, WorkflowEvent, ImplementationRecord, Document, DashboardMetrics, PrecedentReport } from '../types';

export interface ProposalFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  departmentId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const proposalService = {
  async getProposals(params: ProposalFilterParams = {}) {
    const res = await api.get('/proposals', { params });
    return res.data.data;
  },

  async getProposalById(id: string): Promise<{
    proposal: Proposal;
    events: WorkflowEvent[];
    observations: Observation[];
    decision?: Decision;
    implementation?: ImplementationRecord;
    documents: Document[];
  }> {
    const res = await api.get(`/proposals/${id}`);
    return res.data.data;
  },

  async createProposal(data: Partial<Proposal>): Promise<Proposal> {
    const res = await api.post('/proposals', data);
    return res.data.data.proposal;
  },

  async updateProposal(id: string, data: Partial<Proposal>): Promise<Proposal> {
    const res = await api.patch(`/proposals/${id}`, data);
    return res.data.data.proposal;
  },

  async submitProposal(id: string) {
    const res = await api.post(`/proposals/${id}/submit`);
    return res.data.data;
  },

  async addObservation(id: string, text: string, type = 'Review Observation') {
    const res = await api.post(`/proposals/${id}/observations`, { text, type });
    return res.data.data;
  },

  async requestClarification(id: string, text: string) {
    const res = await api.post(`/proposals/${id}/clarification`, { text });
    return res.data.data;
  },

  async resubmitProposal(id: string, responseExplanation: string, updates: Partial<Proposal> = {}) {
    const res = await api.post(`/proposals/${id}/resubmit`, {
      responseExplanation,
      ...updates,
    });
    return res.data.data;
  },

  async recordDecision(id: string, decision: {
    outcome: 'Approved' | 'Rejected' | 'Modified';
    reason: string;
    approvedAmount?: number;
    conditions?: string;
  }) {
    const res = await api.post(`/proposals/${id}/decision`, decision);
    return res.data.data;
  },

  async updateImplementation(id: string, data: any) {
    const res = await api.post(`/proposals/${id}/implementation`, data);
    return res.data.data;
  },

  async closeProposal(id: string, closureNotes: string) {
    const res = await api.post(`/proposals/${id}/close`, { closureNotes });
    return res.data.data;
  },

  async getDashboardStats(): Promise<{
    metrics: DashboardMetrics;
    statusDistribution: { name: string; count: number }[];
    recentProposals: Proposal[];
  }> {
    const res = await api.get('/proposals/stats/overview');
    return res.data.data;
  },

  async getAiReport(id: string): Promise<PrecedentReport> {
    const res = await api.post(`/ai/proposals/${id}/report`);
    return res.data.data.report;
  },
};
