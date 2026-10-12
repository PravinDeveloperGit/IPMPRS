import api from './api';
import { Department, User, AuditEvent, DatasetManifest } from '../types';

export const adminService = {
  async getDepartments(): Promise<Department[]> {
    const res = await api.get('/departments');
    return res.data.data.departments;
  },

  async getUsers(params: { role?: string; departmentId?: string; active?: boolean } = {}): Promise<User[]> {
    const res = await api.get('/users', { params });
    return res.data.data.users;
  },

  async createUser(data: any): Promise<User> {
    const res = await api.post('/users', data);
    return res.data.data.user;
  },

  async updateUser(id: string, data: any): Promise<User> {
    const res = await api.patch(`/users/${id}`, data);
    return res.data.data.user;
  },

  async getAuditEvents(params: { action?: string; resourceType?: string; page?: number; limit?: number } = {}) {
    const res = await api.get('/audit-events', { params });
    return res.data.data;
  },

  async getSystemHealth() {
    const res = await api.get('/health');
    return res.data;
  },

  async getDatasetManifest(): Promise<DatasetManifest> {
    const res = await api.get('/dataset-manifest');
    return res.data.data;
  },
};


