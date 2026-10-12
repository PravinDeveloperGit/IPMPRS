import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { proposalService } from '../services/proposalService';
import { Proposal, ImplementationRecord } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Kanban, CheckCircle, Clock, ArrowRight, DollarSign, Archive } from 'lucide-react';

export const ImplementationView: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [implRecord, setImplRecord] = useState<ImplementationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [closureNotes, setClosureNotes] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);

  const fetchImplementing = async () => {
    setLoading(true);
    try {
      const data = await proposalService.getProposals({ limit: 50 });
      const filtered = data.proposals.filter((p: Proposal) =>
        ['Approved', 'Implementation In Progress', 'Implemented', 'Closed'].includes(p.status)
      );
      setProposals(filtered);
      if (filtered.length > 0 && !selectedProposal) {
        selectProposal(filtered[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectProposal = async (prop: Proposal) => {
    setSelectedProposal(prop);
    try {
      const details = await proposalService.getProposalById(prop._id);
      setImplRecord(details.implementation || null);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchImplementing();
  }, []);

  const handleCloseProposal = async () => {
    if (!selectedProposal) return;
    try {
      await proposalService.closeProposal(selectedProposal._id, closureNotes);
      setShowCloseModal(false);
      setClosureNotes('');
      await fetchImplementing();
      await selectProposal(selectedProposal);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center space-x-2 text-police-700">
          <Kanban className="w-5 h-5 text-police-700" />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Implementation & Project Closure Tracking
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Monitor sanctioned project deployment milestones, track actual cost disbursements, and execute formal closure into the precedent index.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Proposal Selection List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3 text-xs">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Sanctioned Projects ({proposals.length})
          </h2>

          <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto pr-1">
            {proposals.map(prop => (
              <button
                key={prop._id}
                onClick={() => selectProposal(prop)}
                className={`w-full text-left p-3 rounded-lg transition-colors space-y-1 block ${
                  selectedProposal?._id === prop._id ? 'bg-police-50 border border-police-200' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-police-700">{prop.proposalId}</span>
                  <StatusBadge status={prop.status} size="sm" />
                </div>
                <p className="font-semibold text-slate-900 truncate">{prop.title}</p>
                <p className="text-[11px] text-slate-500 font-mono">₹{prop.proposedBudget.toLocaleString()}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Implementation Details & Milestones */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-xs space-y-5">
          {selectedProposal ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-mono font-bold text-police-700">{selectedProposal.proposalId}</span>
                    <StatusBadge status={selectedProposal.status} />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">{selectedProposal.title}</h2>
                </div>

                {['Approved', 'Implementation In Progress', 'Implemented'].includes(selectedProposal.status) && (
                  <button
                    onClick={() => setShowCloseModal(true)}
                    className="btn-primary text-xs self-start sm:self-auto bg-purple-700 hover:bg-purple-800"
                  >
                    <Archive className="w-3.5 h-3.5 mr-1.5" />
                    Archive & Close into Precedent Index
                  </button>
                )}
              </div>

              {/* Cost comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="label-gov text-[10px]">Sanctioned Allocation</span>
                  <p className="text-lg font-bold font-mono text-slate-900">
                    ₹{selectedProposal.proposedBudget.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="label-gov text-[10px]">Actual Recorded Spend</span>
                  <p className="text-lg font-bold font-mono text-emerald-700">
                    ₹{(implRecord?.actualCost || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Milestones Checklist */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Deployment Milestones
                </h3>

                {implRecord?.milestones && implRecord.milestones.length > 0 ? (
                  <div className="space-y-2">
                    {implRecord.milestones.map((m, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border flex items-start space-x-3 ${
                          m.completed ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        {m.completed ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 space-y-0.5">
                          <p className={`font-semibold ${m.completed ? 'text-emerald-900' : 'text-slate-900'}`}>
                            {m.title}
                          </p>
                          {m.description && <p className="text-slate-600 text-[11px]">{m.description}</p>}
                          {m.completionDate && (
                            <p className="text-[10px] text-slate-400 font-mono">
                              Completed on: {new Date(m.completionDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-4">No milestone schedule logged for this case.</p>
                )}
              </div>

              {/* Closure Notes */}
              {implRecord?.closureNotes && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <span className="label-gov text-[10px]">Archival Closure Notes</span>
                  <p className="text-slate-800 leading-relaxed">{implRecord.closureNotes}</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-center py-12 text-slate-400">Select a project to inspect implementation progress.</p>
          )}
        </div>
      </div>

      {/* Close Proposal Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 text-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase">Archive & Close Proposal</h3>
            <p className="text-slate-500 leading-relaxed">
              Archiving closes the official project lifecycle and marks the record as an indexed precedent for future departmental queries.
            </p>
            <div>
              <label className="label-gov">Final Archival Notes & Implementation Sign-off</label>
              <textarea
                rows={4}
                required
                value={closureNotes}
                onChange={e => setClosureNotes(e.target.value)}
                placeholder="Detail final commissioning sign-off, warranty period, or archive reasons..."
                className="input-gov"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setShowCloseModal(false)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleCloseProposal} className="btn-primary text-xs bg-purple-700 hover:bg-purple-800">
                Confirm Archival & Index
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
