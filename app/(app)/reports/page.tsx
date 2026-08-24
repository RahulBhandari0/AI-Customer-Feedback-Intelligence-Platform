'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FileText, Sparkles, Printer, Calendar, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';

export default function ReportsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'VIEWER';
  const isReadOnly = userRole === 'VIEWER';

  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [days, setDays] = useState('30');
  const [generating, setGenerating] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      const list = data.reports || [];
      setReports(list);
      if (list.length > 0 && !selectedReport) {
        setSelectedReport(list[0]);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async () => {
    if (isReadOnly) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      });
      const data = await res.json();
      if (res.ok && data.report) {
        setReports((prev) => [data.report, ...prev]);
        setSelectedReport(data.report);
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const parsedContent = selectedReport ? JSON.parse(selectedReport.contentJson) : null;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Voice-of-Customer (VoC) Executive Reports
          </h1>
          <p className="text-slate-400 text-xs mt-1">Pre-computed metrics and AI executive narratives summarized for leadership forwarding.</p>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-3">
            <select
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="7">Past 7 Days Digest</option>
              <option value="30">Past 30 Days Monthly</option>
              <option value="90">Past 90 Days Quarter</option>
            </select>

            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Generating Narrative...' : 'Generate New Report'}</span>
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">Loading VoC executive report archive...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Report Archive Selector */}
          <div className="glass-panel p-4 space-y-3 print:hidden">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Saved Reports Archive</h3>
            <div className="space-y-1">
              {reports.map((rep) => (
                <button
                  key={rep.id}
                  onClick={() => setSelectedReport(rep)}
                  className={`w-full text-left p-3 rounded-lg text-xs transition flex items-center justify-between ${
                    selectedReport?.id === rep.id
                      ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 font-semibold'
                      : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="truncate font-semibold text-slate-200">{rep.title}</div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(rep.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Executive Report Render Area */}
          <div className="lg:col-span-3">
            {selectedReport && parsedContent ? (
              <div className="glass-panel p-8 space-y-8 bg-slate-900/90 border-slate-700/80 shadow-2xl print:bg-white print:text-black print:p-0 print:border-none print:shadow-none">
                {/* Executive Report Title Header */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-6 print:border-black">
                  <div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 uppercase tracking-wider print:hidden">
                      Executive Voice-of-Customer Digest
                    </span>
                    <h2 className="text-2xl font-black text-white mt-2 print:text-black">{selectedReport.title}</h2>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-3 print:text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        Period: {new Date(selectedReport.periodStart).toLocaleDateString()} – {new Date(selectedReport.periodEnd).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>Generated by: {selectedReport.generatedBy?.name || 'AI System'}</span>
                    </div>
                  </div>

                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs print:hidden"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Export PDF / Print</span>
                  </button>
                </div>

                {/* 1. Executive Summary */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider print:text-black">1. Executive Summary</h3>
                  <p className="text-sm text-slate-200 leading-relaxed font-sans print:text-black">{parsedContent.summary}</p>
                </div>

                {/* 2. Sentiment Shift & Key Breakdown Stats */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider print:text-black">2. Sentiment Metrics & Shift</h3>
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-3 gap-4 text-center print:border-gray-300 print:bg-gray-50">
                    <div>
                      <div className="text-xs font-semibold text-emerald-400">Positive</div>
                      <div className="text-xl font-bold text-white print:text-black">{parsedContent.sentimentBreakdown?.positive || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-400">Neutral</div>
                      <div className="text-xl font-bold text-white print:text-black">{parsedContent.sentimentBreakdown?.neutral || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-red-400">Negative</div>
                      <div className="text-xl font-bold text-white print:text-black">{parsedContent.sentimentBreakdown?.negative || 0}</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 italic print:text-black">"{parsedContent.sentimentShift}"</p>
                </div>

                {/* 3. Top Themes & Sentiment Summaries */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider print:text-black">3. Key Theme Clusters</h3>
                  <div className="space-y-2">
                    {parsedContent.topThemes?.map((t: any, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs flex justify-between items-center print:border-gray-200">
                        <div>
                          <span className="font-bold text-slate-200 print:text-black">{t.name}</span>
                          <p className="text-[11px] text-slate-400 mt-0.5 print:text-gray-700">{t.sentimentSummary}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 font-bold text-xs shrink-0 print:bg-gray-100 print:text-black">
                          {t.count} items
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Notable Verbatim Quotes */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider print:text-black">4. Representative Customer Verbatims</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {parsedContent.notableQuotes?.map((q: any, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1 print:border-gray-200">
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>{q.channel}</span>
                          <span className="font-bold text-slate-400">{q.sentiment}</span>
                        </div>
                        <p className="text-slate-300 italic font-sans print:text-black">"{q.quote}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Recommended Actions */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider print:text-black">5. Recommended Leadership Actions</h3>
                  <div className="space-y-2">
                    {parsedContent.recommendedActions?.map((act: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 print:text-black">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel p-16 text-center text-slate-500 text-sm">
                No report selected. Click "Generate New Report" to create a Voice-of-Customer digest.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

