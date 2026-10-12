import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Search,
  CheckSquare,
  FolderArchive,
  Kanban,
  ShieldAlert,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { hasRole } = useAuth();

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      to: '/proposals',
      label: 'Proposals Management',
      icon: FileText,
      show: true,
    },
    {
      to: '/precedents',
      label: 'Precedent Search & RAG',
      icon: Search,
      show: true,
    },
    {
      to: '/review-queue',
      label: 'Review Queue',
      icon: CheckSquare,
      show: hasRole('REVIEWER', 'APPROVING_AUTHORITY', 'SYSTEM_ADMIN'),
    },
    {
      to: '/documents',
      label: 'Document Repository',
      icon: FolderArchive,
      show: hasRole('KNOWLEDGE_ADMIN', 'SYSTEM_ADMIN', 'OFFICER_CREATOR', 'REVIEWER', 'APPROVING_AUTHORITY'),
    },
    {
      to: '/implementation',
      label: 'Implementation & Closure',
      icon: Kanban,
      show: true,
    },
    {
      to: '/admin',
      label: 'Admin & Audit Trails',
      icon: ShieldAlert,
      show: hasRole('SYSTEM_ADMIN', 'AUDITOR', 'APPROVING_AUTHORITY'),
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 min-h-[calc(100vh-4rem)] flex flex-col justify-between py-6">
      <div className="space-y-1 px-3">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Core Operations
        </div>

        {navItems
          .filter(item => item.show)
          .map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-police-700 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0 opacity-80" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
      </div>

      <div className="px-4 pt-6 border-t border-slate-800/80">
        <div className="rounded-lg bg-slate-800/60 p-3 border border-slate-700/60 text-xs text-slate-300 space-y-1">
          <p className="font-semibold text-slate-200">Security Standard</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Zero-Trust RBAC active. All state transitions, searches, and file retrievals are immutably audited.
          </p>
        </div>
      </div>
    </aside>
  );
};
