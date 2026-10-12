import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, LogOut, User as UserIcon } from 'lucide-react';
import { SyntheticBanner } from './SyntheticBanner';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case 'OFFICER_CREATOR': return 'Proposal Author';
      case 'REVIEWER': return 'Reviewer';
      case 'APPROVING_AUTHORITY': return 'Approving Authority';
      case 'KNOWLEDGE_ADMIN': return 'Knowledge Admin';
      case 'SYSTEM_ADMIN': return 'System Admin';
      case 'AUDITOR': return 'Auditor';
      default: return role || 'Officer';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-police-900 border-b border-police-800 text-white shadow-sm">
      <SyntheticBanner />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-police-800 border border-police-700 flex items-center justify-center text-blue-300 shadow-inner">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">IPMPRS</span>
                <span className="text-xs bg-police-800 border border-police-700 text-blue-300 px-2 py-0.5 rounded font-mono font-medium">
                  v1.0 • PUDUCHERRY POLICE
                </span>
              </div>
              <p className="text-xs text-slate-300 font-normal">
                Intelligent Proposal Management & Precedent Retrieval System
              </p>
            </div>
          </div>

          {/* Right User Bar */}
          {user && (
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex flex-col text-right">
                <div className="flex items-center space-x-2 justify-end">
                  <span className="text-sm font-semibold text-white">{user.displayName}</span>
                  <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded font-medium">
                    {getRoleDisplayName(user.role)}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {user.badgeNumber && <span className="font-mono text-slate-400 mr-2">{user.badgeNumber}</span>}
                  <span>{typeof user.departmentId === 'object' && user.departmentId ? user.departmentId.name : 'Police HQ'}</span>
                </div>
              </div>

              <div className="w-9 h-9 rounded-full bg-police-800 border border-police-700 flex items-center justify-center text-blue-200">
                <UserIcon className="w-5 h-5 text-blue-300" />
              </div>

              <button
                onClick={logout}
                title="Sign out of departmental console"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-police-800/80 hover:bg-rose-900/40 hover:border-rose-700/50 border border-police-700 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
