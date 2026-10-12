import api from './api';
import { PrecedentResult } from '../types';

export interface PrecedentSearchParams {
  query: string;
  category?: string;
  departmentId?: string;
  outcome?: string;
  limit?: number;
}

export const precedentService = {
  async searchPrecedents(params: PrecedentSearchParams): Promise<{
    results: PrecedentResult[];
    source: string;
    latencyMs: number;
  }> {
    const res = await api.post('/precedents/search', params);
    return res.data.data;
  },

  async getAiHealth() {
    const res = await api.get('/ai/health');
    return res.data.data;
  },
};
