import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { proposalService } from '../services/proposalService';
import { PrecedentReport, Proposal } from '../types';
import {
  Sparkles,
  ShieldAlert,
  FileCheck2,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

export const AIReportView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<PrecedentReport | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      if (!id) return;
      try {
        const propData = await proposalService.getProposalById(id);
        setProposal(propData.proposal);
        const reportData = await proposalService.getAiReport(id);
        setReport(reportData);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to synthesize AI precedent report.');
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center space-y-3 bg-white rounded-xl border border-slate-200">
        <Sparkles className="w-8 h-8 text-police-600 animate-pulse mx-auto" />
        <h2 className="text-sm font-bold text-slate-800">Synthesizing Grounded Precedent Evidence...</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Vector retrieval engine is identifying authorized historical cases, cross-verifying document citations, and analyzing budgetary variance.
        </p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white rounded-xl border border-rose-200 text-rose-700 text-xs space-y-2">
        <p className="font-semibold">{error || 'Could not generate report.'}</p>
        <Link to={`/proposals/${id}`} className="underline font-medium">Return to Proposal</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation and Title */}
      <div className="flex items-center justify-between">
        <Link
          to={`/proposals/${id}`}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Proposal Record
        </Link>
        <span className="text-xs font-mono text-slate-400">
          Proposal: {proposal?.proposalId}
        </span>
      </div>

      {/* Main Report Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 text-xs">
        {/* Header */}
        <div className="border-b border-slate-200 pb-5 space-y-2">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Sparkles className="w-4 h-4" />
            </span>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Evidence-Based AI Precedent Analysis Report
            </h1>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Target Proposal: <strong className="text-slate-900 font-semibold">{proposal?.title}</strong> ({proposal?.category})
          </p>

          {/* Strict Uncertainty Warning Alert */}
          <div className="p-3.5 rounded-lg bg-slate-900 text-slate-200 border border-slate-800 space-y-1">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>Statutory Compliance & Decision Sovereignty Notice</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {report.uncertaintyNotice}
            </p>
          </div>
        </div>

        {/* 1. Synthesis Summary */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            1. Executive Precedent Synthesis
          </h2>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed">
            {report.summary}
          </div>
        </div>

        {/* 2. Budgetary Comparison Matrix */}
        {report.budgetComparison && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Budget & Financial Variance Analysis
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Proposed Budget</span>
                <p className="text-base font-bold font-mono text-slate-900">
                  ₹{report.budgetComparison.proposedBudget.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Historical Baseline Avg</span>
                <p className="text-base font-bold font-mono text-slate-900">
                  ₹{report.budgetComparison.historicalAverageBudget.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Cost Variance</span>
                <p className={`text-base font-bold font-mono flex items-center ${
                  report.budgetComparison.variancePercent > 0 ? 'text-amber-700' : 'text-emerald-700'
                }`}>
                  {report.budgetComparison.variancePercent > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                  {report.budgetComparison.variancePercent > 0 ? `+${report.budgetComparison.variancePercent}%` : `${report.budgetComparison.variancePercent}%`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. Similarities & Crucial Differences */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center">
              <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
              Identified Similarities
            </h3>
            <ul className="space-y-1.5 text-slate-700 text-[11px] list-disc list-inside">
              {report.similarities.map((sim, idx) => (
                <li key={idx} className="leading-relaxed">{sim}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-200 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center">
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-amber-700" />
              Crucial Differences
            </h3>
            <ul className="space-y-1.5 text-slate-700 text-[11px] list-disc list-inside">
              {report.differences.map((diff, idx) => (
                <li key={idx} className="leading-relaxed">{diff}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* 4. Missing Information and Unresolved Technical Questions */}
        <div className="p-4 rounded-lg bg-orange-50/60 border border-orange-200 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-900 flex items-center">
            <HelpCircle className="w-3.5 h-3.5 mr-1.5 text-orange-700" />
            Missing Evidence & Unresolved Information
          </h3>
          <ul className="space-y-1 text-slate-800 text-[11px] list-disc list-inside">
            {report.missingInformation.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        {/* 5. Verified Citations List */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            5. Verified Source Citations & Document References
          </h2>
          <div className="space-y-2">
            {report.citations.map((cite, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between text-[11px]"
              >
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-900">{cite.claim}</p>
                  <div className="flex items-center space-x-2 text-slate-500 font-mono text-[10px]">
                    <FileCheck2 className="w-3 h-3 text-police-600" />
                    <span>Doc: {cite.documentTitle}</span>
                    <span>• Page: {cite.pageNumber}</span>
                    {cite.proposalId && <span>• Ref ID: {cite.proposalId}</span>}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Verified Chunk
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
