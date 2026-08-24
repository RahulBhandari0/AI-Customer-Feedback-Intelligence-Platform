'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Inbox,
  TrendingUp,
  MessageSquareSparkles,
  FileText,
  Settings,
  LogOut,
  Building,
  Shield,
  Sparkles,
} from 'lucide-react';
import React from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading LOOP Workspace...</span>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    router.push('/login');
    return null;
  }

  const userRole = (session?.user as any)?.role || 'VIEWER';
  const workspaceName = (session?.user as any)?.workspaceName || 'Acme Corp';
  const userName = session?.user?.name || session?.user?.email || 'User';

  const navItems = [
    { name: 'Analytics Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Feedback Inbox', href: '/inbox', icon: Inbox },
    { name: 'Theme Trends', href: '/trends', icon: TrendingUp },
    { name: 'Ask LOOP (AI Q&A)', href: '/ask', icon: MessageSquareSparkles },
    { name: 'Voice-of-Customer Reports', href: '/reports', icon: FileText },
    { name: 'Workspace & RBAC', href: '/settings', icon: Settings },
  ];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'ANALYST':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Branding & Tenant Switcher Badge */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">LOOP</h1>
                <p className="text-[10px] text-slate-400 tracking-wide uppercase">Feedback Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
              <Building className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="truncate flex-1">
                <div className="font-semibold text-slate-200 truncate">{workspaceName}</div>
                <div className="text-[10px] text-slate-400">Multi-tenant Isolated</div>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Badge & Logout */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800 mb-2">
            <div className="truncate flex-1 pr-2">
              <div className="text-xs font-semibold text-slate-200 truncate">{userName}</div>
              <div className="text-[10px] text-slate-500 truncate">{session?.user?.email}</div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase shrink-0 flex items-center gap-1 ${getRoleBadgeColor(
                userRole
              )}`}
            >
              <Shield className="w-2.5 h-2.5" />
              {userRole}
            </span>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

