import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { proposalService } from '../services/proposalService';
import { documentService } from '../services/documentService';
import { useAuth } from '../context/AuthContext';
import {
  Proposal,
  WorkflowEvent,
  Observation,
  Decision,
  ImplementationRecord,
  Document as DocType,
} from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Shield,
  Clock,
  Sparkles,
  Paperclip,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  Calendar,
  Send,
  Building2,
  FileCheck2,
} from 'lucide-react';

export const ProposalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const [data, setData] = useState<{
    proposal: Proposal;
    events: WorkflowEvent[];
    observations: Observation[];
    decision?: Decision;
    implementation?: ImplementationRecord;
    documents: DocType[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [observationText, setObservationText] = useState('');
  const [showObsModal, setShowObsModal] = useState(false);

  const [clarificationText, setClarificationText] = useState('');
  const [showClarifyModal, setShowClarifyModal] = useState(false);

  const [resubmitExplanation, setResubmitExplanation] = useState('');
  const [showResubmitModal, setShowResubmitModal] = useState(false);

  const [decisionOutcome, setDecisionOutcome] = useState<'Approved' | 'Rejected'>('Approved');
  const [decisionReason, setDecisionReason] = useState('');
  const [approvedAmount, setApprovedAmount] = useState(0);
  const [showDecisionModal, setShowDecisionModal] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const loadData = async () => {
    if (!id) return;
    try {
      const res = await proposalService.getProposalById(id);
      setData(res);
      setApprovedAmount(res.proposal.proposedBudget);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load proposal details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSubmitProposal = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await proposalService.submitProposal(id);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !observationText.trim()) return;
    setActionLoading(true);
    try {
      await proposalService.addObservation(id, observationText);
      setObservationText('');
      setShowObsModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestClarification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !clarificationText.trim()) return;
    setActionLoading(true);
    try {
      await proposalService.requestClarification(id, clarificationText);
      setClarificationText('');
      setShowClarifyModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !resubmitExplanation.trim()) return;
    setActionLoading(true);
    try {
      await proposalService.resubmitProposal(id, resubmitExplanation);
      setResubmitExplanation('');
      setShowResubmitModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !decisionReason.trim()) return;
    setActionLoading(true);
    try {
      await proposalService.recordDecision(id, {
        outcome: decisionOutcome,
        reason: decisionReason,
        approvedAmount: decisionOutcome === 'Approved' ? approvedAmount : 0,
      });
      setShowDecisionModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('proposalId', id);
    formData.append('title', uploadTitle || selectedFile.name);
    formData.append('sourceType', 'Proposal Supporting Document');
    formData.append('accessLevel', 'Internal Department');

    setActionLoading(true);
    try {
      await documentService.uploadDocument(formData);
      setSelectedFile(null);
      setUploadTitle('');
      setShowUploadModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Retrieving proposal verification records...</div>;
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-rose-200 text-rose-700 text-xs">
        {error || 'Proposal could not be located.'}
      </div>
    );
  }

  const { proposal, events, observations, decision, documents } = data;
  const isAuthor = user && (String(typeof proposal.createdBy === 'object' ? proposal.createdBy?._id || (proposal.createdBy as any).id : proposal.createdBy) === String(user.id || (user as any)._id));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner and Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="font-mono text-sm font-bold text-police-700 bg-police-50 border border-police-200 px-2 py-0.5 rounded">
                {proposal.proposalId}
              </span>
              <span className="text-xs text-slate-500 font-mono font-medium">
                Version {proposal.currentVersion}
              </span>
              <StatusBadge status={proposal.status} />
              {proposal.isSynthetic && (
                <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                  SYNTHETIC CASE
                </span>
              )}
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              {proposal.title}
            </h1>
          </div>

          {/* Quick AI Analysis button */}
          <Link
            to={`/ai-report/${proposal._id}`}
            className="btn-primary text-xs flex items-center space-x-1.5 self-start md:self-auto bg-gradient-to-r from-police-700 to-indigo-700 hover:from-police-800 hover:to-indigo-800 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span>Generate Precedent Analysis</span>
          </Link>
        </div>

        {/* Action Controls based on Role & State */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {proposal.status === 'Draft' && (isAuthor || hasRole('SYSTEM_ADMIN')) && (
            <button
              onClick={handleSubmitProposal}
              disabled={actionLoading}
              className="btn-primary text-xs"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Submit Draft for Review
            </button>
          )}

          {['Submitted', 'Under Review'].includes(proposal.status) && hasRole('REVIEWER', 'APPROVING_AUTHORITY', 'SYSTEM_ADMIN') && (
            <>
              <button
                onClick={() => setShowObsModal(true)}
                className="btn-secondary text-xs"
              >
                Add Observation
              </button>
              <button
                onClick={() => setShowClarifyModal(true)}
                className="btn-secondary text-xs text-orange-700 border-orange-300 hover:bg-orange-50"
              >
                Request Clarification
              </button>
            </>
          )}

          {proposal.status === 'Clarification Requested' && (isAuthor || hasRole('SYSTEM_ADMIN')) && (
            <button
              onClick={() => setShowResubmitModal(true)}
              className="btn-primary text-xs bg-indigo-600 hover:bg-indigo-700"
            >
              Respond to Query & Resubmit (v{proposal.currentVersion + 1})
            </button>
          )}

          {['Under Review', 'Resubmitted'].includes(proposal.status) && hasRole('APPROVING_AUTHORITY', 'SYSTEM_ADMIN') && (
            <button
              onClick={() => setShowDecisionModal(true)}
              className="btn-primary text-xs bg-emerald-700 hover:bg-emerald-800"
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
              Record Formal Decision (Sanction)
            </button>
          )}

          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-secondary text-xs ml-auto"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Attach Document
          </button>
        </div>
      </div>

      {/* Main Grid: Details + Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Proposal Details & Documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Executive Overview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Proposal Brief & Problem Statement
            </h2>

            <div>
              <span className="label-gov">Executive Summary</span>
              <p className="text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                {proposal.summary}
              </p>
            </div>

            <div>
              <span className="label-gov">Problem Statement</span>
              <p className="text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                {proposal.problemStatement}
              </p>
            </div>

            {proposal.purposeAndJustification && (
              <div>
                <span className="label-gov">Purpose and Justification</span>
                <p className="text-slate-800 leading-relaxed">
                  {proposal.purposeAndJustification}
                </p>
              </div>
            )}

            {proposal.proposedSolution && (
              <div>
                <span className="label-gov">Proposed Solution</span>
                <p className="text-slate-800 leading-relaxed">
                  {proposal.proposedSolution}
                </p>
              </div>
            )}

            {/* Financial & Timeline Metrics */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="label-gov text-[10px]">Estimated Budget</span>
                <p className="text-base font-bold font-mono text-slate-900">
                  ₹{proposal.proposedBudget.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="label-gov text-[10px]">Timeline</span>
                <p className="text-base font-semibold text-slate-900">
                  {proposal.implementationTimeline}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="label-gov text-[10px]">Category</span>
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {proposal.category}
                </p>
              </div>
            </div>
          </div>

          {/* Official Sanction Decision Record (If decided) */}
          {decision && (
            <div className={`rounded-xl border p-6 text-xs space-y-2 shadow-sm ${
              decision.outcome === 'Approved' ? 'bg-emerald-50/70 border-emerald-300' : 'bg-rose-50/70 border-rose-300'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center space-x-1.5 text-slate-900 uppercase tracking-wider">
                  {decision.outcome === 'Approved' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>Official Decision: {decision.outcome}</span>
                </h3>
                <span className="font-mono text-xs text-slate-500">
                  {new Date(decision.decidedAt).toLocaleDateString()}
                </span>
              </div>

              <div className="pt-1">
                <span className="font-semibold text-slate-700">Official Rationale:</span>
                <p className="text-slate-900 mt-0.5 leading-relaxed bg-white/80 p-3 rounded-lg border border-slate-200/60">
                  {decision.reason}
                </p>
              </div>

              {decision.outcome === 'Approved' && (
                <div className="flex items-center space-x-4 pt-1 font-mono">
                  <span>Sanctioned Amount: <strong>₹{decision.approvedAmount.toLocaleString()}</strong></span>
                  {decision.conditions && <span className="text-slate-600">Conditions: {decision.conditions}</span>}
                </div>
              )}
            </div>
          )}

          {/* Supporting Documents Repository */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Paperclip className="w-4 h-4 text-slate-500" />
                <span>Supporting Files ({documents.length})</span>
              </h2>
              <button
                onClick={() => setShowUploadModal(true)}
                className="text-police-700 hover:text-police-900 font-semibold"
              >
                + Add File
              </button>
            </div>

            {documents.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {documents.map(doc => (
                  <div key={doc._id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{doc.title}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {doc.originalFilename} • {(doc.fileSize / 1024).toFixed(1)} KB • Status: {doc.processingStatus}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={documentService.getDownloadUrl(doc._id)}
                        className="btn-secondary py-1 px-2.5 text-xs"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-4">No documents attached to this proposal draft.</p>
            )}
          </div>
        </div>

        {/* Right Column: Workflow Activity Timeline & Observations */}
        <div className="space-y-6">
          {/* Review Observations */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Review Observations & Queries ({observations.length})
            </h2>

            {observations.length > 0 ? (
              <div className="space-y-2.5">
                {observations.map(obs => (
                  <div key={obs._id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-police-700">{obs.type}</span>
                      <span className="text-slate-400 font-mono">{new Date(obs.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed">{obs.text}</p>
                    <p className="text-[10px] text-slate-500 font-medium">By: {obs.reviewerId?.displayName || 'Officer'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-4">No observations recorded yet.</p>
            )}
          </div>

          {/* Audit & Workflow Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Workflow State History
            </h2>

            <div className="space-y-4 relative before:absolute before:inset-0 before:left-2.5 before:w-0.5 before:bg-slate-200">
              {events.map((evt, idx) => (
                <div key={evt._id || idx} className="relative flex items-start space-x-3 pl-6">
                  <span className="absolute left-1.5 top-1 w-2.5 h-2.5 rounded-full bg-police-600 border-2 border-white ring-1 ring-slate-300"></span>
                  <div className="flex-1 space-y-0.5">
                    <p className="font-semibold text-slate-900">
                      {evt.fromStatus} → {evt.toStatus}
                    </p>
                    {evt.reason && <p className="text-slate-600 text-[11px] italic">"{evt.reason}"</p>}
                    <p className="text-[10px] text-slate-400 font-mono">
                      {new Date(evt.timestamp).toLocaleString()} • {evt.actorId?.displayName || 'Actor'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Observation Modal */}
      {showObsModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase">Record Review Observation</h3>
            <textarea
              rows={4}
              value={observationText}
              onChange={e => setObservationText(e.target.value)}
              placeholder="Enter technical, administrative, or logistical observations..."
              className="input-gov"
            />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowObsModal(false)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleAddObservation} disabled={actionLoading} className="btn-primary text-xs">Save Observation</button>
            </div>
          </div>
        </div>
      )}

      {/* Clarification Modal */}
      {showClarifyModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase">Request Clarification from Author</h3>
            <p className="text-slate-500 text-xs">This will transition the proposal to 'Clarification Requested'.</p>
            <textarea
              rows={4}
              value={clarificationText}
              onChange={e => setClarificationText(e.target.value)}
              placeholder="State clear queries or information required..."
              className="input-gov"
            />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowClarifyModal(false)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleRequestClarification} disabled={actionLoading} className="btn-primary text-xs">Submit Query</button>
            </div>
          </div>
        </div>
      )}

      {/* Resubmit Modal */}
      {showResubmitModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase">Submit Clarification Response</h3>
            <p className="text-slate-500 text-xs">Explaining changes advances proposal to version {proposal.currentVersion + 1}.</p>
            <textarea
              rows={4}
              value={resubmitExplanation}
              onChange={e => setResubmitExplanation(e.target.value)}
              placeholder="Detail your compliance answers to reviewer queries..."
              className="input-gov"
            />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowResubmitModal(false)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleResubmit} disabled={actionLoading} className="btn-primary text-xs">Resubmit for Review</button>
            </div>
          </div>
        </div>
      )}

      {/* Formal Decision Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase">Record Official Sanction Decision</h3>
            <div>
              <label className="label-gov">Official Sanction Outcome</label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="outcome"
                    checked={decisionOutcome === 'Approved'}
                    onChange={() => setDecisionOutcome('Approved')}
                  />
                  <span className="font-semibold text-emerald-700">Sanction Approved</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="outcome"
                    checked={decisionOutcome === 'Rejected'}
                    onChange={() => setDecisionOutcome('Rejected')}
                  />
                  <span className="font-semibold text-rose-700">Proposal Disallowed / Rejected</span>
                </label>
              </div>
            </div>

            {decisionOutcome === 'Approved' && (
              <div>
                <label className="label-gov">Approved Sanction Amount (₹ INR)</label>
                <input
                  type="number"
                  value={approvedAmount}
                  onChange={e => setApprovedAmount(parseFloat(e.target.value) || 0)}
                  className="input-gov font-mono"
                />
              </div>
            )}

            <div>
              <label className="label-gov">Official Justification Rationale *</label>
              <textarea
                rows={4}
                required
                value={decisionReason}
                onChange={e => setDecisionReason(e.target.value)}
                placeholder="State statutory references, technical reasons, or departmental sanction guidelines..."
                className="input-gov"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setShowDecisionModal(false)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleRecordDecision} disabled={actionLoading} className="btn-primary text-xs">
                Log Formal Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase">Attach Supporting Evidence File</h3>
            <div>
              <label className="label-gov">Document Title</label>
              <input
                type="text"
                value={uploadTitle}
                onChange={e => setUploadTitle(e.target.value)}
                placeholder="e.g., Technical Blueprint or Sanction Memo"
                className="input-gov"
              />
            </div>
            <div>
              <label className="label-gov">Choose File (PDF, DOCX, TXT)</label>
              <input
                type="file"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                className="input-gov"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowUploadModal(false)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleUploadDocument} disabled={actionLoading || !selectedFile} className="btn-primary text-xs">
                Upload & Queue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
