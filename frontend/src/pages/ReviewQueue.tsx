import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { proposalService } from '../services/proposalService';
import { Proposal } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { CheckSquare, ArrowRight, Clock, AlertCircle } from 'lucide-react';

export const ReviewQueue: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'under_review' | 'clarification'>('all');
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      let statusQuery: string | undefined = undefined;
      if (filter === 'submitted') statusQuery = 'Submitted';
      else if (filter === 'under_review') statusQuery = 'Under Review';
      else if (filter === 'clarification') statusQuery = 'Clarification Requested';

      const data = await proposalService.getProposals({
        status: statusQuery,
        limit: 30,
      });

      // Filter in client if 'all' to show active queue statuses
      let items = data.proposals;
      if (filter === 'all') {
        items = items.filter((p: Proposal) =>
          ['Submitted', 'Under Review', 'Clarification Requested', 'Resubmitted'].includes(p.status)
        );
      }
      setProposals(items);
    } catch (err) {
      console.error('Queue load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [filter]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-police-700">
            <CheckSquare className="w-5 h-5 text-police-700" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Scrutiny & Review Queue
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Proposals submitted for technical scrutiny, clarification dispatch, or final approving sanction.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-medium space-x-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              filter === 'all' ? 'bg-white shadow text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Pending ({proposals.length})
          </button>
          <button
            onClick={() => setFilter('submitted')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              filter === 'submitted' ? 'bg-white shadow text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            New Submissions
          </button>
          <button
            onClick={() => setFilter('under_review')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              filter === 'under_review' ? 'bg-white shadow text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Under Review
          </button>
          <button
            onClick={() => setFilter('clarification')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              filter === 'clarification' ? 'bg-white shadow text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Clarification
          </button>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-6 py-3.5">Proposal ID</th>
              <th className="px-6 py-3.5">Title</th>
              <th className="px-6 py-3.5">Department</th>
              <th className="px-6 py-3.5">Budget</th>
              <th className="px-6 py-3.5">Version</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Review Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  Loading scrutiny queue...
                </td>
              </tr>
            ) : proposals.length > 0 ? (
              proposals.map(prop => (
                <tr key={prop._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-3.5 font-mono font-semibold text-police-700 whitespace-nowrap">
                    {prop.proposalId}
                  </td>
                  <td className="px-6 py-3.5 font-medium text-slate-900 max-w-xs truncate">
                    {prop.title}
                  </td>
                  <td className="px-6 py-3.5 text-slate-600 whitespace-nowrap">
                    {typeof prop.departmentId === 'object' && prop.departmentId ? prop.departmentId.name : 'HQ'}
                  </td>
                  <td className="px-6 py-3.5 font-mono text-slate-900 whitespace-nowrap">
                    ₹{prop.proposedBudget.toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5 font-mono text-slate-500 whitespace-nowrap">
                    v{prop.currentVersion}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <StatusBadge status={prop.status} size="sm" />
                  </td>
                  <td className="px-6 py-3.5 text-right whitespace-nowrap">
                    <Link
                      to={`/proposals/${prop._id}`}
                      className="btn-primary py-1 px-3 text-xs inline-flex items-center"
                    >
                      Conduct Review <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  No pending proposals in review queue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
