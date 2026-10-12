import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { proposalService } from '../services/proposalService';
import { adminService } from '../services/adminService';
import { Proposal, Department, PROPOSAL_CATEGORIES } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Search,
  Plus,
  ArrowRight,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const ProposalsList: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const data = await proposalService.getProposals({
        page,
        limit: 10,
        search: search || undefined,
        category: category || undefined,
        departmentId: departmentId || undefined,
        status: status || undefined,
      });
      setProposals(data.proposals);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      console.error('Error fetching proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    adminService.getDepartments().then(setDepartments).catch(console.error);
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [page, category, departmentId, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProposals();
  };

  const statusOptions = [
    'Draft',
    'Submitted',
    'Under Review',
    'Clarification Requested',
    'Resubmitted',
    'Approved',
    'Rejected',
    'Implementation In Progress',
    'Implemented',
    'Closed',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Proposal Registry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Total of {total} registered administrative, technical, and operational proposals.
          </p>
        </div>
        <Link to="/proposals/new" className="btn-primary text-xs whitespace-nowrap self-start sm:self-auto">
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Create New Proposal
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by proposal ID, title, problem statement..."
              className="input-gov pl-9"
            />
          </div>
          <button type="submit" className="btn-secondary text-xs">
            Search
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="label-gov">Category</label>
            <select
              value={category}
              onChange={e => { setCategory(e.target.value); setPage(1); }}
              className="input-gov py-1.5 text-xs"
            >
              <option value="">All Categories</option>
              {PROPOSAL_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-gov">Department</label>
            <select
              value={departmentId}
              onChange={e => { setDepartmentId(e.target.value); setPage(1); }}
              className="input-gov py-1.5 text-xs"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-gov">Workflow Status</label>
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
              className="input-gov py-1.5 text-xs"
            >
              <option value="">All Statuses</option>
              {statusOptions.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-3.5">Proposal ID</th>
                <th className="px-6 py-3.5">Title</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Budget</th>
                <th className="px-6 py-3.5">Version</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    Loading records from secure registry...
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
                      {prop.category}
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
                        className="text-police-700 hover:text-police-900 font-semibold inline-flex items-center"
                      >
                        Open <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No proposals matched the configured criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Page {page} of {totalPages} ({total} items)
            </span>
            <div className="flex space-x-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary py-1 px-2.5 text-xs disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary py-1 px-2.5 text-xs disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
