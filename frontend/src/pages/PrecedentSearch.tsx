import React, { useState } from 'react';
import { precedentService } from '../services/precedentService';
import { PrecedentResult, PROPOSAL_CATEGORIES } from '../types';
import {
  Search,
  Sparkles,
  FileCheck2,
  Calendar,
  Building2,
  ExternalLink,
  Info,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

export const PrecedentSearch: React.FC = () => {
  const [query, setQuery] = useState('CCTV surveillance along coastal Rock Beach promenade');
  const [category, setCategory] = useState('');
  const [outcome, setOutcome] = useState('');
  const [results, setResults] = useState<PrecedentResult[]>([]);
  const [sourceEngine, setSourceEngine] = useState('');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const data = await precedentService.searchPrecedents({
        query,
        category: category || undefined,
        outcome: outcome || undefined,
        limit: 6,
      });
      setResults(data.results || []);
      setSourceEngine(data.source || 'HYBRID_RETRIEVAL_ENGINE');
      setLatencyMs(data.latencyMs || 25);
    } catch (err) {
      console.error('Precedent search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const benchmarkQueries = [
    { label: 'BitLocker Windows Decryption (QRY-0001)', query: 'How should an investigating officer acquire digital evidence from a running Windows PC when BitLocker is enabled by default?', tag: 'BPR&D Digital Forensics' },
    { label: 'Linux Live System dcfldd (QRY-0002)', query: 'What command-line tool and parameters are recommended for imaging live Linux systems to prevent errors on bad blocks?', tag: 'BPR&D Forensics' },
    { label: 'MCSPU Anti-Phishing Model (QRY-0003)', query: 'What is the MCSPU security model and how does it prevent Man-in-the-Browser phishing attacks?', tag: 'BPR&D Hard AI' },
    { label: 'WhatsApp MMI Hijacking (QRY-0004)', query: 'How do cybercriminals hijack WhatsApp accounts using telecom MMI forwarding codes?', tag: 'BPR&D Advisory' },
    { label: 'Prison Perimeter Pulse Fence (QRY-0005)', query: 'What are the technical and electrical safety standards required for prison perimeter pulsed fences?', tag: 'BPR&D Prison Security' },
    { label: 'Coastal Promenade CCTV (PROP-0101)', query: 'CCTV surveillance along coastal Rock Beach promenade', tag: 'CCTV Precedent' },
    { label: 'Solar Powered Checkpost (PROP-0214)', query: 'Solar powered standalone wireless surveillance cameras for rural checkpost', tag: 'Solar Precedent' },
    { label: 'ANPR Traffic Junction (PROP-0042)', query: 'Automated number plate recognition ANPR Anna Salai', tag: 'Traffic Precedent' },
  ];

  const handleQuerySelect = (selectedQuery: string) => {
    setQuery(selectedQuery);
    setLoading(true);
    setHasSearched(true);
    precedentService.searchPrecedents({
      query: selectedQuery,
      category: category || undefined,
      outcome: outcome || undefined,
      limit: 6,
    }).then(data => {
      setResults(data.results || []);
      setSourceEngine(data.source || 'HYBRID_RETRIEVAL_ENGINE');
      setLatencyMs(data.latencyMs || 25);
    }).catch(err => {
      console.error('Precedent search error:', err);
    }).finally(() => {
      setLoading(false);
    });
  };


  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-2">
        <div className="flex items-center space-x-2 text-police-700">
          <Search className="w-5 h-5 text-police-700" />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Historical Precedent Intelligence Search
          </h1>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
          Retrieve semantically relevant departmental proposals, past sanction orders, technical committees' objections, approved budgets, and real-world deployment outcomes.
        </p>

        {/* Disclaimer alert */}
        <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start space-x-2">
          <Info className="w-4 h-4 flex-shrink-0 text-blue-600 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Relevance Signal Notice:</strong> The percentage score represents contextual and lexical semantic similarity to past departmental records. It does <em>not</em> represent probability of sanction or official approval.
          </p>
        </div>
      </div>

      {/* Query Formulation Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs">
        <form onSubmit={handleSearch} className="space-y-3">
          <div>
            <label className="label-gov">Natural Language Query or Problem Scope</label>
            <div className="relative">
              <input
                type="text"
                required
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g., Installation of high-definition night vision PTZ cameras in crowded heritage markets..."
                className="input-gov pl-3 py-2.5 text-sm font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label-gov">Filter by Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="input-gov"
              >
                <option value="">All Operational Categories</option>
                {PROPOSAL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-gov">Filter by Previous Sanction Outcome</label>
              <select
                value={outcome}
                onChange={e => setOutcome(e.target.value)}
                className="input-gov"
              >
                <option value="">All Sanction Outcomes</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Modified">Modified</option>
                <option value="Pending">Pending / Incomplete</option>
              </select>
            </div>
          </div>

          {/* Benchmark Test Queries Carousel / Grid */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-police-600" />
                BPR&D National Benchmark Queries & Departmental Scenarios:
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Click to test instant retrieval</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {benchmarkQueries.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuerySelect(item.query)}
                  className={`text-left p-2 rounded-lg border transition-all text-[11px] group ${
                    query === item.query
                      ? 'bg-police-50 border-police-300 text-police-900 shadow-sm'
                      : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-police-600 px-1 py-0.2 bg-white rounded border border-slate-200">
                      {item.tag}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800 line-clamp-1 group-hover:text-police-700">
                    {item.label}
                  </p>
                  <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                    {item.query}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-xs px-6 py-2.5 whitespace-nowrap shadow-sm hover:shadow"
            >
              <Search className="w-4 h-4 mr-1.5" />
              {loading ? 'Querying Index...' : 'Search Precedents'}
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        {hasSearched && (
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Found <strong className="text-slate-900">{results.length}</strong> matching historical records
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              Engine: {sourceEngine} • Retrieval Latency: {latencyMs}ms
            </span>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            Vectorizing query embedding and ranking precedent candidates...
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            {results.map((rec, idx) => {
              const relevancePercent = Math.round(rec.score * 100);
              const scoreBadgeColor =
                relevancePercent >= 75
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : relevancePercent >= 55
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-slate-100 text-slate-700 border-slate-300';

              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 hover:border-police-300 transition-all text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-police-700 text-xs">
                        {rec.proposalId}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600 font-medium">{rec.departmentName}</span>
                      {rec.sourceDocument && rec.sourceDocument.includes('BPRD') ? (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-300 flex items-center gap-1">
                          <FileCheck2 className="w-3 h-3 text-blue-700" />
                          BPR&D NATIONAL MANUAL
                        </span>
                      ) : rec.isSynthetic ? (
                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-300">
                          BENCHMARK SCENARIO
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-300">
                          OFFICIAL RECORD
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${scoreBadgeColor}`}>
                        {relevancePercent}% Relevance Signal
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        rec.outcome === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                        rec.outcome === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rec.outcome}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {rec.title}
                  </h3>

                  {/* Excerpt with Citation */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 leading-relaxed">
                    <span className="font-semibold text-slate-900 text-[11px] block mb-1">
                      Matched Source Excerpt:
                    </span>
                    <p className="italic text-[11px]">"{rec.excerpt}..."</p>
                    <div className="mt-2 text-[10px] font-mono text-slate-500 flex items-center space-x-2">
                      <FileCheck2 className="w-3 h-3 text-police-600" />
                      <span>Source: {rec.sourceDocument}</span>
                      <span>• Page: {rec.pageReference}</span>
                    </div>
                  </div>

                  {/* Decision & Budget Comparison Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-semibold text-slate-500 block">Sanction Outcome & Reason</span>
                      <span className="font-semibold text-slate-900">{rec.outcome}</span>
                      <p className="text-[10px] text-slate-600 line-clamp-2 mt-0.5">{rec.decisionReason}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-semibold text-slate-500 block">Historical Budget</span>
                      <span className="font-bold font-mono text-slate-900">
                        ₹{(rec.decidedAmount || 0).toLocaleString()}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Actual Spend: ₹{(rec.actualCost || 0).toLocaleString()}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-semibold text-slate-500 block">Implementation Outcome</span>
                      <span className="font-semibold text-slate-900">{rec.implementationStatus}</span>
                      <p className="text-[10px] text-slate-600 line-clamp-2 mt-0.5">{rec.implementationOutcome}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : hasSearched ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500 space-y-2">
            <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700">No sufficient historical precedents located.</p>
            <p className="text-slate-400 max-w-sm mx-auto">
              No previous departmental records matched this search scope. Adjust your search keywords or clear the category filters.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
