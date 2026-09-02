"use client";

import { Sparkles, TrendingUp, AlertTriangle } from "lucide-react";

export default function AiInsightsCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111827]/80 p-6 backdrop-blur-xl shadow-2xl">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400 animate-pulse" />
          <h3 className="text-lg font-semibold text-white">AI Cluster Insights</h3>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
          Claude 3.5 Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
          <p className="text-xs text-slate-400">Top Pain Point</p>
          <p className="text-base font-medium text-slate-200 mt-1">Dashboard Load Delay</p>
          <span className="inline-flex items-center text-xs text-red-400 gap-1 mt-2">
            <AlertTriangle className="h-3 w-3" /> High Urgency
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
          <p className="text-xs text-slate-400">Emerging Trend</p>
          <p className="text-base font-medium text-slate-200 mt-1">CSV Bulk Exporter</p>
          <span className="inline-flex items-center text-xs text-emerald-400 gap-1 mt-2">
            <TrendingUp className="h-3 w-3" /> +34% Request Volume
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
          <p className="text-xs text-slate-400">Sentiment Score</p>
          <p className="text-xl font-bold text-white mt-1">78.4%</p>
          <p className="text-xs text-emerald-400 mt-1">Overall Positive</p>
        </div>
      </div>
    </div>
  );
}