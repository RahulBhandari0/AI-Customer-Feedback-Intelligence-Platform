import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative overflow-hidden bg-[#F8F9FA] dark:bg-[#0b0f19] transition-colors min-h-[calc(100vh-4rem)]">
      {/* Subtle Ambient Background Gradient */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-[#2D68FF]/15 via-[#8B5CF6]/10 to-indigo-500/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative z-10">
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Top pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-xs text-xs font-bold text-[#1A1F36] dark:text-slate-200">
            <span className="w-2 h-2 rounded-full bg-[#1A1F36] dark:bg-blue-400" />
            AI-Powered Customer Feedback Intelligence Platform
          </div>

          {/* Large headline with strong, legible gradient from #2D68FF to #8B5CF6 */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-[#2D68FF] to-[#8B5CF6] bg-clip-text text-transparent pb-1">
            Turn multi-channel customer voice into actionable intelligence
          </h1>

          {/* Paragraph in solid high-legibility dark navy */}
          <p className="text-base sm:text-lg font-medium text-[#1A1F36] dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Ingest feedback from Email, Twitter, Discord, Support Tickets, and Surveys. Automatically score sentiment, extract key topics, and prioritize critical product fixes.
          </p>

          {/* Call to Actions */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/feedback"
              className="px-6 py-3.5 text-sm font-semibold text-white bg-[#2D68FF] hover:bg-blue-600 rounded-xl shadow-md shadow-[#2D68FF]/25 hover:shadow-lg transition-all hover:scale-105"
            >
              Open Feedback Inbox →
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3.5 text-sm font-semibold text-white bg-[#1A1F36] hover:bg-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-700/50 rounded-xl shadow-md transition-all hover:scale-105"
            >
              View Analytics Dashboard
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D68FF]/40 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-[#2D68FF] flex items-center justify-center font-bold border border-blue-200 dark:border-blue-500/20 shadow-xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#1A1F36] dark:text-white">Instant AI Classification</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Automated sentiment analysis, confidence scoring, category grouping, and urgency detection for every feedback entry.
            </p>
            <Link href="/feedback/new" className="text-xs font-semibold text-[#2D68FF] hover:underline inline-block pt-1">
              Try Ingestion Form →
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D68FF]/40 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold border border-indigo-200 dark:border-indigo-500/20 shadow-xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#1A1F36] dark:text-white">Multi-Channel & CSV Bulk Import</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Connect feedback across Email, Discord, Twitter, Support Tickets, and import large datasets with our smart CSV parser.
            </p>
            <Link href="/feedback/import" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-block pt-1">
              Import CSV Data →
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D68FF]/40 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-[#8B5CF6] flex items-center justify-center font-bold border border-purple-200 dark:border-purple-500/20 shadow-xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#1A1F36] dark:text-white">Executive Insights & Trends</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Visual dashboards detailing positive sentiment percentages, category distribution, and critical issues requiring action.
            </p>
            <Link href="/dashboard" className="text-xs font-semibold text-[#8B5CF6] hover:underline inline-block pt-1">
              Explore Analytics →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}