import api from './api';
import { Document, DocumentChunk } from '../types';

export const documentService = {
  async getDocuments(params: { proposalId?: string; processingStatus?: string; search?: string; page?: number; limit?: number } = {}) {
    const res = await api.get('/documents', { params });
    return res.data.data;
  },

  async getDocumentById(id: string): Promise<Document> {
    const res = await api.get(`/documents/${id}`);
    return res.data.data.document;
  },

  async getDocumentContent(id: string): Promise<{ document: Document; chunks: DocumentChunk[] }> {
    const res = await api.get(`/documents/${id}/content`);
    return res.data.data;
  },

  async uploadDocument(formData: FormData): Promise<{ document: Document; isDuplicate: boolean; message: string }> {
    const res = await api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  async reprocessDocument(id: string): Promise<Document> {
    const res = await api.post(`/documents/${id}/reprocess`);
    return res.data.data.document;
  },

  getDownloadUrl(id: string): string {
    const token = localStorage.getItem('token');
    return `/api/documents/${id}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },

};
