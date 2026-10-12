import React, { useEffect, useState } from 'react';
import { documentService } from '../services/documentService';
import { Document as DocType, DocumentChunk } from '../types';
import {
  FolderArchive,
  Upload,
  Search,
  FileText,
  FileCheck2,
  RefreshCw,
  Download,
  Eye,
  AlertTriangle,
  X,
} from 'lucide-react';

export const DocumentRepository: React.FC = () => {
  const [documents, setDocuments] = useState<DocType[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'BPRD' | 'DEPARTMENTAL'>('ALL');
  const [loading, setLoading] = useState(true);

  // Preview Modal
  const [selectedDoc, setSelectedDoc] = useState<DocType | null>(null);
  const [docChunks, setDocChunks] = useState<DocumentChunk[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);

  // Upload Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [sourceType, setSourceType] = useState('Historical Government Sanction Order');
  const [accessLevel, setAccessLevel] = useState<'Internal Department' | 'Public Reference'>('Internal Department');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const data = await documentService.getDocuments({
        search: search || undefined,
        processingStatus: statusFilter || undefined,
        limit: 50,
      });
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [statusFilter]);

  const bprdCount = documents.filter(d => (d.sourceType && d.sourceType.includes('BPR&D')) || d.documentId.startsWith('BPRD')).length;
  const deptCount = documents.length - bprdCount;

  const displayedDocs = documents.filter(doc => {
    if (sourceFilter === 'BPRD') return (doc.sourceType && doc.sourceType.includes('BPR&D')) || doc.documentId.startsWith('BPRD');
    if (sourceFilter === 'DEPARTMENTAL') return !(doc.sourceType && doc.sourceType.includes('BPR&D')) && !doc.documentId.startsWith('BPRD');
    return true;
  });


  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocs();
  };

  const handlePreviewChunks = async (doc: DocType) => {
    setSelectedDoc(doc);
    setLoadingChunks(true);
    try {
      const res = await documentService.getDocumentContent(doc._id);
      setDocChunks(res.chunks || []);
    } catch (err) {
      console.error('Error fetching chunks:', err);
    } finally {
      setLoadingChunks(false);
    }
  };

  const handleReprocess = async (docId: string) => {
    try {
      await documentService.reprocessDocument(docId);
      await fetchDocs();
    } catch (err) {
      console.error('Reprocess error:', err);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploadLoading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', docTitle || file.name);
      formData.append('sourceType', sourceType);
      formData.append('accessLevel', accessLevel);

      const res = await documentService.uploadDocument(formData);
      if (res.isDuplicate) {
        alert(res.message);
      }
      setShowUploadModal(false);
      setFile(null);
      setDocTitle('');
      await fetchDocs();
    } catch (err: any) {
      setUploadError(err.response?.data?.message || err.message || 'Upload failed.');
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-police-700">
            <FolderArchive className="w-5 h-5 text-police-700" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Departmental Knowledge & Document Repository
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Historical sanction orders, standard operating procedures, technical manuals, and chunked vector representations.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary text-xs whitespace-nowrap self-start sm:self-auto"
        >
          <Upload className="w-3.5 h-3.5 mr-1.5" />
          Upload Official Document
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3 text-xs">
        {/* Source Repository Tabs */}
        <div className="flex border-b border-slate-200 pb-2.5 gap-2">
          <button
            type="button"
            onClick={() => setSourceFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              sourceFilter === 'ALL'
                ? 'bg-police-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Repository Records ({documents.length})
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter('BPRD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              sourceFilter === 'BPRD'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            BPR&D National Publications ({bprdCount})
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter('DEPARTMENTAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              sourceFilter === 'DEPARTMENTAL'
                ? 'bg-police-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Departmental Sanction Orders ({deptCount})
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, original filename, or document ID..."
              className="input-gov pl-9"
            />
          </div>
          <button type="submit" className="btn-secondary text-xs">Search</button>
        </form>

        <div className="flex items-center space-x-4 pt-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Processing Filter:</span>
          {['', 'Indexed', 'Pending', 'Processing', 'Failed'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                statusFilter === st ? 'bg-police-700 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st || 'All Statuses'}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-6 py-3.5">Document ID</th>
              <th className="px-6 py-3.5">Title / File</th>
              <th className="px-6 py-3.5">Source Type</th>
              <th className="px-6 py-3.5">Pages & Size</th>
              <th className="px-6 py-3.5">Chunks</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  Retrieving documents and indexing metadata...
                </td>
              </tr>
            ) : displayedDocs.length > 0 ? (
              displayedDocs.map(doc => {
                const isBprd = (doc.sourceType && doc.sourceType.includes('BPR&D')) || doc.documentId.startsWith('BPRD');
                const fileSizeFormatted = doc.fileSize > 1024 * 1024
                  ? `${(doc.fileSize / (1024 * 1024)).toFixed(1)} MB`
                  : `${Math.round(doc.fileSize / 1024)} KB`;

                return (
                  <tr key={doc._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-semibold text-police-700 whitespace-nowrap">
                      {doc.documentId}
                    </td>
                    <td className="px-6 py-3.5 max-w-sm">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-slate-900 truncate">{doc.title}</p>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{doc.originalFilename}</p>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      {isBprd ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          BPR&D National Manual
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[11px]">
                          {doc.sourceType}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-900 whitespace-nowrap">
                      <span className="font-bold">{doc.pageCount}</span> pgs
                      <span className="text-slate-400 text-[10px] block font-sans">{fileSizeFormatted}</span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-900 whitespace-nowrap">
                      <span className="font-semibold">{doc.chunkCount}</span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        doc.processingStatus === 'Indexed' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                        doc.processingStatus === 'Processing' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                        doc.processingStatus === 'Failed' ? 'bg-rose-50 text-rose-700 border-rose-300' :
                        'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {doc.processingStatus}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handlePreviewChunks(doc)}
                        title="Inspect extracted text chunks"
                        className="p-1.5 rounded text-slate-500 hover:text-police-700 hover:bg-slate-100"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleReprocess(doc._id)}
                        title="Reprocess vector index"
                        className="p-1.5 rounded text-slate-500 hover:text-police-700 hover:bg-slate-100"
                      >
                        <RefreshCw className="w-4 h-4 inline" />
                      </button>
                      <a
                        href={documentService.getDownloadUrl(doc._id)}
                        target="_blank"
                        rel="noreferrer"
                        title="Download official PDF document"
                        className="p-1.5 rounded text-police-600 hover:text-police-800 hover:bg-police-50 inline-block"
                      >
                        <Download className="w-4 h-4 inline" />
                      </a>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  No documents found in repository matching criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Preview Chunks Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Extracted Chunks & Vector References</h3>
                <p className="text-[11px] text-slate-500 font-mono">{selectedDoc.title} ({selectedDoc.documentId})</p>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingChunks ? (
                <p className="text-center py-8 text-slate-400">Loading extracted chunks from store...</p>
              ) : docChunks.length > 0 ? (
                docChunks.map(chunk => (
                  <div key={chunk._id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                      <span className="font-semibold text-police-700">{chunk.chunkId}</span>
                      <span>Page {chunk.pageNumber} • {chunk.sectionTitle}</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed font-sans text-[11px] bg-white p-2 rounded border border-slate-200/60">
                      {chunk.text}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-slate-400">No chunks available for this document.</p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedDoc(null)} className="btn-secondary text-xs">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase">Upload & Index Document</h3>
            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {uploadError}
              </div>
            )}
            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="label-gov">Document Title *</label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={e => setDocTitle(e.target.value)}
                  placeholder="e.g., CCTV Technical Guidelines Memo"
                  className="input-gov"
                />
              </div>

              <div>
                <label className="label-gov">Source Type</label>
                <select
                  value={sourceType}
                  onChange={e => setSourceType(e.target.value)}
                  className="input-gov"
                >
                  <option value="Historical Government Sanction Order">Historical Government Sanction Order</option>
                  <option value="Proposal Supporting Document">Proposal Supporting Document</option>
                  <option value="Technical Specification">Technical Specification</option>
                  <option value="Committee Appraisal Report">Committee Appraisal Report</option>
                  <option value="Standard Operating Procedure">Standard Operating Procedure</option>
                </select>
              </div>

              <div>
                <label className="label-gov">Access Level</label>
                <select
                  value={accessLevel}
                  onChange={e => setAccessLevel(e.target.value as any)}
                  className="input-gov"
                >
                  <option value="Internal Department">Internal Department</option>
                  <option value="Public Reference">Public Reference</option>
                </select>
              </div>

              <div>
                <label className="label-gov">File Attachment (PDF, DOCX, TXT) *</label>
                <input
                  type="file"
                  required
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  className="input-gov"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowUploadModal(false)} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={uploadLoading} className="btn-primary text-xs">
                  {uploadLoading ? 'Uploading & Hashing...' : 'Upload & Queue Ingestion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
