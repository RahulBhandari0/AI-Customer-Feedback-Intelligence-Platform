'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, Show, SignInButton } from '@clerk/nextjs';

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Feedback Inbox', href: '/feedback' },
    { label: 'Submit Feedback', href: '/feedback/new' },
    { label: 'Bulk CSV Import', href: '/feedback/import' },
    { label: 'Analytics Dashboard', href: '/dashboard' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-white group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              LOOP Feedback
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              AI Powered
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Show when="signed-in">
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-block text-xs text-slate-400">
                Workspace Active
              </span>
              <UserButton />
            </div>
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-all shadow-md shadow-blue-600/20">
                Sign In
              </button>
            </SignInButton>
          </Show>
        </div>
      </div>
    </header>
  );
}
