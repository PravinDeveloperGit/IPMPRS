import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { proposalService } from '../services/proposalService';
import { adminService } from '../services/adminService';
import { Department, PROPOSAL_CATEGORIES } from '../types';
import { FilePlus, Save, Send, AlertCircle, ArrowLeft } from 'lucide-react';

export const ProposalCreate: React.FC = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Infrastructure & Surveillance' as any,
    departmentId: '',
    summary: '',
    problemStatement: '',
    purposeAndJustification: '',
    proposedSolution: '',
    proposedBudget: 2500000,
    currency: 'INR',
    implementationTimeline: '6 Months',
    expectedBenefits: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminService.getDepartments().then(depts => {
      setDepartments(depts);
      if (depts.length > 0) {
        setFormData(prev => ({ ...prev, departmentId: depts[0]._id }));
      }
    }).catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'proposedBudget' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const created = await proposalService.createProposal(formData);
      navigate(`/proposals/${created._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create proposal.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitImmediately = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const created = await proposalService.createProposal(formData);
      await proposalService.submitProposal(created._id);
      navigate(`/proposals/${created._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to submit proposal.');
    } finally {
      setLoading(false);
    }
  };

  const populateSample = () => {
    setFormData(prev => ({
      ...prev,
      title: 'Automated Drone Patrol Network for East Coast Road & Coastal Beaches',
      category: 'Operational Equipment & Vehicles',
      summary: 'Procurement of 4 long-range autonomous patrol drones with solar recharging pads along ECR highway to support nighttime anti-smuggling and rescue operations.',
      problemStatement: 'Manual PCR van highway patrolling has severe coverage gaps along the 32 km coastal highway corridor, with blind spots near secluded sand bars.',
      purposeAndJustification: 'Vital for immediate response during maritime distress alerts and curbing illegal night haulage along coastal borders.',
      proposedSolution: 'Installation of 2 automated drone docking stations with optical and thermal cameras feeding real-time feeds to Coastal Police HQ.',
      proposedBudget: 3800000,
      implementationTimeline: '4 Months',
      expectedBenefits: 'Reduces incident arrival time from 28 minutes to under 6 minutes across the coastal ECR stretch.',
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/proposals')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Registry
        </button>
        <button
          type="button"
          onClick={populateSample}
          className="text-xs text-police-700 hover:text-police-900 font-semibold underline"
        >
          Auto-fill Sample Drone Proposal
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2 text-police-700 mb-1">
            <FilePlus className="w-5 h-5" />
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Create New Departmental Proposal
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Submit administrative, technical, infrastructure, or operational proposals for review and sanction.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-5 text-xs">
          <div>
            <label className="label-gov">Proposal Title *</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Installation of High-Definition IP Surveillance Network..."
              className="input-gov font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-gov">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input-gov"
              >
                {PROPOSAL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-gov">Departmental Wing *</label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                className="input-gov"
              >
                {departments.map(d => (
                  <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label-gov">Executive Summary *</label>
            <textarea
              name="summary"
              rows={2}
              required
              value={formData.summary}
              onChange={handleChange}
              placeholder="Concise executive briefing of the proposal scope and objectives..."
              className="input-gov"
            />
          </div>

          <div>
            <label className="label-gov">Problem Statement *</label>
            <textarea
              name="problemStatement"
              rows={3}
              required
              value={formData.problemStatement}
              onChange={handleChange}
              placeholder="Detail current operational bottlenecks, security blind spots, or technical deficiencies..."
              className="input-gov"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-gov">Purpose and Justification</label>
              <textarea
                name="purposeAndJustification"
                rows={2}
                value={formData.purposeAndJustification}
                onChange={handleChange}
                placeholder="Statutory or strategic need for this procurement..."
                className="input-gov"
              />
            </div>

            <div>
              <label className="label-gov">Proposed Solution</label>
              <textarea
                name="proposedSolution"
                rows={2}
                value={formData.proposedSolution}
                onChange={handleChange}
                placeholder="Technical architecture or deployment methodology..."
                className="input-gov"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label-gov">Estimated Budget (₹ INR) *</label>
              <input
                type="number"
                name="proposedBudget"
                required
                min="0"
                value={formData.proposedBudget}
                onChange={handleChange}
                className="input-gov font-mono"
              />
            </div>

            <div>
              <label className="label-gov">Implementation Timeline *</label>
              <input
                type="text"
                name="implementationTimeline"
                required
                value={formData.implementationTimeline}
                onChange={handleChange}
                placeholder="e.g., 6 Months"
                className="input-gov"
              />
            </div>

            <div>
              <label className="label-gov">Currency</label>
              <input
                type="text"
                disabled
                value="INR (Indian Rupee)"
                className="input-gov bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="label-gov">Expected Benefits & Outcomes</label>
            <textarea
              name="expectedBenefits"
              rows={2}
              value={formData.expectedBenefits}
              onChange={handleChange}
              placeholder="Projected improvements in policing response times, public safety, or crime prevention..."
              className="input-gov"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              disabled={loading}
              onClick={handleSaveDraft}
              className="btn-secondary text-xs"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Save as Draft
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmitImmediately}
              className="btn-primary text-xs"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Submit Proposal for Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
