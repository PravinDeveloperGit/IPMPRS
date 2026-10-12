import React from 'react';
import { ProposalStatus } from '../../types';

interface StatusBadgeProps {
  status: ProposalStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyles = () => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Submitted':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Under Review':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'Clarification Requested':
        return 'bg-orange-50 text-orange-700 border-orange-300';
      case 'Resubmitted':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-300';
      case 'Implementation In Progress':
        return 'bg-cyan-50 text-cyan-700 border-cyan-300';
      case 'Implemented':
        return 'bg-teal-50 text-teal-700 border-teal-300';
      case 'Closed':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center rounded-full border ${sizeStyles} ${getStyles()}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {status}
    </span>
  );
};
