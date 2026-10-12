import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { proposalService } from '../services/proposalService';
import { useAuth } from '../context/AuthContext';
import { Proposal, DashboardMetrics } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  FileText,
  Clock,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Truck,
  Plus,
  Search,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [distribution, setDistribution] = useState<{ name: string; count: number }[]>([]);
  const [recentProposals, setRecentProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await proposalService.getDashboardStats();
        setMetrics(data.metrics);
        setDistribution(data.statusDistribution || []);
        setRecentProposals(data.recentProposals || []);
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    { title: 'Total Proposals', count: metrics?.totalProposals ?? 0, icon: FileText, color: 'text-police-700', bg: 'bg-police-50' },
    { title: 'Draft Proposals', count: metrics?.draftCount ?? 0, icon: Clock, color: 'text-slate-700', bg: 'bg-slate-100' },
    { title: 'Awaiting Review', count: metrics?.awaitingReviewCount ?? 0, icon: Clock, color: 'text-amber-700', bg: 'bg-amber-50' },
    { title: 'Clarifications', count: metrics?.clarificationCount ?? 0, icon: HelpCircle, color: 'text-orange-700', bg: 'bg-orange-50' },
    { title: 'Approved', count: metrics?.approvedCount ?? 0, icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { title: 'Implementing', count: metrics?.implementingCount ?? 0, icon: Truck, color: 'text-cyan-700', bg: 'bg-cyan-50' },
    { title: 'Rejected', count: metrics?.rejectedCount ?? 0, icon: XCircle, color: 'text-rose-700', bg: 'bg-rose-50' },
  ];

  const BAR_COLORS = ['#64748b', '#f59e0b', '#ea580c', '#10b981', '#06b6d4', '#0d9488', '#f43f5e'];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Departmental Command Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome, <strong className="text-slate-800 font-semibold">{user?.displayName}</strong>. Real-time proposal tracking, precedent intelligence, and sanction review.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link to="/precedents" className="btn-secondary text-xs">
            <Search className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Search Precedents
          </Link>
          <Link to="/proposals/new" className="btn-primary text-xs">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Proposal Draft
          </Link>
        </div>
      </div>

      {/* Operational Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{card.title}</span>
                <div className={`p-1.5 rounded-lg ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {loading ? '—' : card.count}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics & Tasks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Proposal Lifecycle Distribution
              </h2>
              <p className="text-xs text-slate-500">Live counts across workflow stages</p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-64 w-full">
            {distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Loading status metrics...
              </div>
            )}
          </div>
        </div>

        {/* Action Panel & Precedent Quick Access */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">
              AI Advisory Precedents
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Query historical proposals before initiating high-value tenders to verify previous sanction reasons and budgets.
            </p>

            <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-900 space-y-2 mb-4">
              <p className="font-semibold text-blue-950 flex items-center">
                <Search className="w-3.5 h-3.5 mr-1 text-blue-700" />
                Featured Test Precedent
              </p>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                "CCTV surveillance along coastal promenade Rock Beach": 38 cameras sanctioned, Rs.44 Lakhs approved with 3-year vendor warranty AMC.
              </p>
              <Link to="/precedents" className="text-xs font-semibold text-police-700 hover:text-police-900 underline inline-flex items-center">
                Query this precedent now <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100">
            <Link to="/proposals/new" className="w-full btn-primary text-xs flex justify-center">
              Create New Proposal
            </Link>
            <Link to="/proposals" className="w-full btn-secondary text-xs flex justify-center">
              View All Proposals
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Proposals Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Recently Updated Proposals
          </h2>
          <Link to="/proposals" className="text-xs font-semibold text-police-700 hover:text-police-900 flex items-center">
            View Complete Registry <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-3">Proposal ID</th>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Budget</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {recentProposals.length > 0 ? (
                recentProposals.map(prop => (
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
                    <td className="px-6 py-3.5 font-mono text-slate-900 whitespace-nowrap">
                      ₹{prop.proposedBudget.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <StatusBadge status={prop.status} size="sm" />
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <Link
                        to={`/proposals/${prop._id}`}
                        className="text-police-700 hover:text-police-900 font-semibold inline-flex items-center"
                      >
                        Details <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No proposals found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
