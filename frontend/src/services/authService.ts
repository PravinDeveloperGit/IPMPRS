import api from './api';
import { User } from '../types';

export const authService = {
  async login(email: string, password: string):Promise<{ token: string; user: User }> {
    const res = await api.post('/auth/login', { email, password });
    return res.data.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('ipmprs_token');
      localStorage.removeItem('ipmprs_user');
    }
  },

  async getMe(): Promise<User> {
    const res = await api.get('/auth/me');
    return res.data.data.user;
  },
};
