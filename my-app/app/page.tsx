import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Background Glow Decorations */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/20 via-indigo-500/15 to-purple-600/10 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 relative z-10">
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            AI-Powered Customer Feedback Intelligence Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Turn multi-channel customer voice into{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
              actionable intelligence
            </span>
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed">
            Ingest feedback from Email, Twitter, Discord, Support Tickets, and Surveys. Automatically score sentiment, extract key topics, and prioritize critical product fixes.
          </p>

          {/* Call to Actions */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/feedback"
              className="px-6 py-3.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xl shadow-blue-600/30 transition-all hover:scale-105"
            >
              Open Feedback Inbox →
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3.5 text-sm font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all"
            >
              View Analytics Dashboard
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24">
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-lg border border-blue-500/20">
              ⚡
            </div>
            <h2 className="text-lg font-bold text-white">Instant AI Classification</h2>
            <p className="text-sm text-slate-400">
              Automated sentiment analysis, confidence scoring, category grouping, and urgency detection for every feedback entry.
            </p>
            <Link href="/feedback/new" className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-block pt-1">
              Try Ingestion Form →
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg border border-indigo-500/20">
              📥
            </div>
            <h2 className="text-lg font-bold text-white">Multi-Channel & CSV Bulk Import</h2>
            <p className="text-sm text-slate-400">
              Connect feedback across Email, Discord, Twitter, Support Tickets, and import large datasets with our smart CSV parser.
            </p>
            <Link href="/feedback/import" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-block pt-1">
              Import CSV Data →
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-lg border border-purple-500/20">
              📊
            </div>
            <h2 className="text-lg font-bold text-white">Executive Insights & Trends</h2>
            <p className="text-sm text-slate-400">
              Visual dashboards detailing positive sentiment percentages, category distribution, and critical issues requiring action.
            </p>
            <Link href="/dashboard" className="text-xs font-semibold text-purple-400 hover:text-purple-300 inline-block pt-1">
              Explore Analytics →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}