'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { MessageSquare, AlertCircle, TrendingUp, Sparkles, Filter, RefreshCw } from 'lucide-react';

const SENTIMENT_COLORS = {
  POS: '#10b981',
  NEU: '#64748b',
  NEG: '#ef4444',
};

export default function DashboardPage() {
  const [days, setDays] = useState('30');
  const [channelFilter, setChannelFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ limit: '500', days });
      if (channelFilter) query.append('channel', channelFilter);

      const [resFeedback, resThemes] = await Promise.all([
        fetch(`/api/feedback?${query.toString()}`),
        fetch('/api/themes'),
      ]);

      const feedbackJson = await resFeedback.json();
      const themesJson = await resThemes.json();

      const items = feedbackJson.items || [];
      const total = feedbackJson.pagination?.total || items.length;

      // Stats
      const negCount = items.filter((i: any) => i.sentiment === 'NEG').length;
      const posCount = items.filter((i: any) => i.sentiment === 'POS').length;
      const neuCount = items.filter((i: any) => i.sentiment === 'NEU').length;
      const percentNeg = total > 0 ? Math.round((negCount / total) * 100) : 0;

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const newThisWeek = items.filter((i: any) => new Date(i.createdAt) >= sevenDaysAgo).length;

      // Volume over time (grouped by date)
      const volumeMap: Record<string, { date: string; Total: number; Negative: number }> = {};
      items.forEach((item: any) => {
        const dateStr = new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!volumeMap[dateStr]) {
          volumeMap[dateStr] = { date: dateStr, Total: 0, Negative: 0 };
        }
        volumeMap[dateStr].Total += 1;
        if (item.sentiment === 'NEG') volumeMap[dateStr].Negative += 1;
      });
      const volumeChart = Object.values(volumeMap).reverse();

      // Sentiment distribution
      const sentimentChart = [
        { name: 'Positive', value: posCount, color: SENTIMENT_COLORS.POS },
        { name: 'Neutral', value: neuCount, color: SENTIMENT_COLORS.NEU },
        { name: 'Negative', value: negCount, color: SENTIMENT_COLORS.NEG },
      ];

      // Top themes chart
      const topThemesChart = (themesJson.themes || []).slice(0, 5).map((t: any) => ({
        name: t.name.length > 20 ? t.name.slice(0, 18) + '...' : t.name,
        count: t.count,
        color: t.color || '#3b82f6',
      }));

      setData({
        total,
        percentNeg,
        newThisWeek,
        topThemeName: themesJson.themes?.[0]?.name || 'N/A',
        volumeChart,
        sentimentChart,
        topThemesChart,
        channels: Array.from(new Set(items.map((i: any) => i.channel))),
      });
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [days, channelFilter]);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Feedback Intelligence Dashboard
          </h1>
          <p className="text-slate-400 text-xs mt-1">Real-time sentiment breakdown, volume trends, and top themes across multi-channel customer feedback.</p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
            <select
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="bg-transparent text-slate-200 py-1 pr-3 focus:outline-none cursor-pointer"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>

          <button
            onClick={fetchDashboardData}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Computing analytics metrics...
        </div>
      ) : data ? (
        <>
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="glass-card">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Total Feedback Ingested</span>
                <MessageSquare className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-white">{data.total}</div>
              <div className="text-[10px] text-slate-500 mt-1">Multi-channel entries</div>
            </div>

            <div className="glass-card">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Negative Sentiment %</span>
                <AlertCircle className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-2xl font-black text-red-400">{data.percentNeg}%</div>
              <div className="text-[10px] text-slate-500 mt-1">Requires triage & product attention</div>
            </div>

            <div className="glass-card">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>New This Week</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">+{data.newThisWeek}</div>
              <div className="text-[10px] text-slate-500 mt-1">Ingested past 7 days</div>
            </div>

            <div className="glass-card">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Top Spiking Theme</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-sm font-bold text-purple-300 truncate">{data.topThemeName}</div>
              <div className="text-[10px] text-slate-500 mt-1">Highest volume cluster</div>
            </div>
          </div>

          {/* Charts Row 1: Volume Over Time & Sentiment Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Volume Over Time Area Chart */}
            <div className="lg:col-span-2 glass-panel p-6">
              <h3 className="text-sm font-bold text-white mb-4">Feedback Volume & Spike Trends</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.volumeChart}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="Total" stroke="#6366f1" fillOpacity={1} fill="url(#colorTotal)" />
                    <Area type="monotone" dataKey="Negative" stroke="#ef4444" fillOpacity={1} fill="url(#colorNeg)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sentiment Breakdown Pie Chart */}
            <div className="glass-panel p-6 flex flex-col justify-between">
              <h3 className="text-sm font-bold text-white mb-2">Sentiment Breakdown</h3>
              <div className="h-52 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.sentimentChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {data.sentimentChart.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
                <div>
                  <div className="text-xs font-semibold text-emerald-400">Positive</div>
                  <div className="text-sm font-bold text-white">{data.sentimentChart[0].value}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400">Neutral</div>
                  <div className="text-sm font-bold text-white">{data.sentimentChart[1].value}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-red-400">Negative</div>
                  <div className="text-sm font-bold text-white">{data.sentimentChart[2].value}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Top Themes Distribution */}
          <div className="glass-panel p-6">
            <h3 className="text-sm font-bold text-white mb-4">Top Feedback Themes</h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topThemesChart} layout="vertical">
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={150} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {data.topThemesChart.map((entry: any, index: number) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

