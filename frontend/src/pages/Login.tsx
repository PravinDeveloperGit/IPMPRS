import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('officer@police.gov.in');
  const [password, setPassword] = useState('Police@2026');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (targetEmail: string) => {
    setEmail(targetEmail);
    setPassword('Police@2026');
    setError(null);
  };

  const demoAccounts = [
    { role: 'Proposal Author', email: 'officer@police.gov.in', title: 'Insp. R. Sundaralingam (Traffic & Tech)' },
    { role: 'Reviewer', email: 'reviewer@police.gov.in', title: 'SP K. Jayaprakash (Scrutiny Team)' },
    { role: 'Approving Authority', email: 'approver@police.gov.in', title: 'DIG M. Balasubramanian (HQ Command)' },
    { role: 'Knowledge Admin', email: 'knowledge@police.gov.in', title: 'Admin S. Priya (Doc Repository & FAISS)' },
    { role: 'System Admin', email: 'admin@police.gov.in', title: 'SysAdmin V. Karthik (Users & Permissions)' },
    { role: 'Auditor', email: 'auditor@police.gov.in', title: 'Auditor N. Chandran (Compliance & Logs)' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-police-800 border border-police-700 shadow-xl mb-4">
          <Shield className="w-9 h-9 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          IPMPRS Authentication Gateway
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Intelligent Proposal Management & Precedent Retrieval System
        </p>
        <p className="text-xs text-blue-400/90 font-mono mt-1 font-medium">
          Puducherry Police Hackathon 2026 • Official Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800/90 border border-slate-700/80 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Official Departmental Email
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="officer@police.gov.in"
                  className="block w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-police-500 focus:border-police-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Access Passcode
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-police-500 focus:border-police-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg shadow-sm text-sm font-semibold text-white bg-police-600 hover:bg-police-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-police-500 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Authenticating Credentials...' : 'Sign In to Official Console'}
                {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
              </button>
            </div>
          </form>

          {/* Quick Demo Role Switcher for Hackathon Judges & Evaluators */}
          <div className="mt-6 pt-5 border-t border-slate-700/80">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5 text-center">
              Evaluator Quick-Fill Role Switcher
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillCredentials(acc.email)}
                  className={`text-left p-2 rounded-lg border text-xs transition-colors ${
                    email === acc.email
                      ? 'bg-police-700/50 border-police-500 text-white'
                      : 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <p className="font-semibold text-blue-300 truncate">{acc.role}</p>
                  <p className="text-[10px] text-slate-400 truncate">{acc.email}</p>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-2">
              Default password for all demo evaluation roles: <code className="text-slate-400 font-mono">Police@2026</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
