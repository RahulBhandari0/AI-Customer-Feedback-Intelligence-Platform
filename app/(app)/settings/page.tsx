'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Shield, Building, Users, Lock, Check, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'VIEWER';
  const workspaceName = (session?.user as any)?.workspaceName || 'Acme Corp';
  const workspaceId = (session?.user as any)?.workspaceId || '';
  const isAdmin = userRole === 'ADMIN';

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/workspace/members');
      const data = await res.json();
      setMembers(data.members || []);
    } catch (err) {
      console.error('Failed to fetch workspace members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/workspace/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Forbidden action');
      } else {
        setSuccess(`Updated role to ${newRole}`);
        setMembers((prev) =>
          prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m))
        );
      }
    } catch (err: any) {
      setError('Server error changing role');
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          Workspace Settings & Access Control (RBAC)
        </h1>
        <p className="text-slate-400 text-xs mt-1">Multi-tenant data isolation and role permissions management (ADMIN, ANALYST, VIEWER).</p>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Workspace Details Card */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{workspaceName}</h2>
            <div className="text-xs text-slate-400 font-mono">Workspace ID: {workspaceId}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-800 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="font-bold text-purple-400 mb-1">ADMIN Role</div>
            <p className="text-slate-400 text-[11px]">Full access: workspace settings, member management, ingestion, Q&A, and reports.</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="font-bold text-emerald-400 mb-1">ANALYST Role</div>
            <p className="text-slate-400 text-[11px]">Core operations: single & bulk ingestion, triage, status updates, Ask LOOP, and VoC generation.</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="font-bold text-blue-400 mb-1">VIEWER Role</div>
            <p className="text-slate-400 text-[11px]">Read-only access: view dashboards, inbox, theme trends, Ask LOOP, and reports. Actions return 403.</p>
          </div>
        </div>
      </div>

      {/* Members & Permissions Table */}
      <div className="glass-panel overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            Workspace Team Members ({members.length})
          </h3>
          {!isAdmin && (
            <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Only ADMINs can modify member roles
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Loading workspace members...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                  <th className="p-3 font-semibold">User Name</th>
                  <th className="p-3 font-semibold">Email</th>
                  <th className="p-3 font-semibold">Current Role</th>
                  <th className="p-3 font-semibold text-right">Role Assignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-medium text-slate-200">{member.name}</td>
                    <td className="p-3 text-slate-400 font-mono">{member.email}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                          member.role === 'ADMIN'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                            : member.role === 'ANALYST'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {isAdmin ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 focus:outline-none cursor-pointer"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="ANALYST">ANALYST</option>
                          <option value="VIEWER">VIEWER</option>
                        </select>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">Locked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

