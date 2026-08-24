'use client';

import { useState, useEffect } from 'react';
import { Flame, ArrowUpRight, MessageSquare, ChevronRight, X, Sparkles } from 'lucide-react';

export default function TrendsPage() {
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Drill-down Modal State
  const [selectedTheme, setSelectedTheme] = useState<any>(null);
  const [drillDownItems, setDrillDownItems] = useState<any[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);

  const fetchThemes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/themes');
      const data = await res.json();
      setThemes(data.themes || []);
    } catch (err) {
      console.error('Failed to fetch themes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  const openDrillDown = async (theme: any) => {
    setSelectedTheme(theme);
    setDrillLoading(true);
    try {
      const res = await fetch(`/api/themes?themeId=${theme.id}`);
      const data = await res.json();
      setDrillDownItems(data.items || []);
    } catch (err) {
      console.error('Failed to fetch theme items:', err);
    } finally {
      setDrillLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          Theme Clustering & Emerging Trends
        </h1>
        <p className="text-slate-400 text-xs mt-1">AI-driven feedback grouping, week-over-week volume spike detection, and granular item drill-down.</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">Clustering workspace feedback themes...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((theme) => (
            <div
              key={theme.id}
              onClick={() => openDrillDown(theme)}
              className="glass-panel p-6 cursor-pointer hover:border-indigo-500/50 transition flex flex-col justify-between group"
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: theme.color || '#3b82f6' }}
                  />
                  {theme.isSpiking && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1 animate-pulse">
                      <Flame className="w-3 h-3 fill-red-400" />
                      SPIKING (+{theme.delta > 0 ? theme.delta : 1} vs prev period)
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition mb-1">
                  {theme.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                  {theme.description || 'Auto-generated theme cluster from customer feedback.'}
                </p>
              </div>

              <div>
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-center text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500">Total Items</div>
                    <div className="font-bold text-white">{theme.count}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-emerald-400">Positive</div>
                    <div className="font-bold text-slate-200">{theme.sentiments?.positive || 0}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-red-400">Negative</div>
                    <div className="font-bold text-slate-200">{theme.sentiments?.negative || 0}</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-indigo-400 font-semibold pt-2">
                  <span>Drill down items</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drill-down Modal */}
      {selectedTheme && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel w-full max-w-3xl max-h-[85vh] flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Theme Drill-Down</div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedTheme.color }} />
                  {selectedTheme.name}
                </h3>
              </div>
              <button onClick={() => setSelectedTheme(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Scroll */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {drillLoading ? (
                <div className="py-12 text-center text-slate-500 text-sm">Fetching underlying feedback entries...</div>
              ) : drillDownItems.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">No items found for this theme.</div>
              ) : (
                drillDownItems.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">{item.channel}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.sentiment === 'POS'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : item.sentiment === 'NEG'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                            : 'bg-slate-500/10 text-slate-400'
                        }`}
                      >
                        {item.sentiment} ({item.sentimentScore})
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed">{item.content}</p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>{item.customerLabel || 'Anonymous Customer'}</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

