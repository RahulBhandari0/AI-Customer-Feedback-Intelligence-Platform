'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface FeedbackItem {
  id: string;
  content: string;
  source: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative' | null;
  sentimentScore: number | null;
  category: string | null;
  urgency: 'High' | 'Medium' | 'Low' | null;
  status: 'NEW' | 'REVIEWED' | 'ACTIONED' | null;
  customerName: string | null;
  customerEmail: string | null;
  summary: string | null;
  tags: string[];
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Stats {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  highUrgency: number;
  positiveRatio: number;
}

export default function FeedbackInboxPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [stats, setStats] = useState<Stats>({
    total: 0,
    positive: 0,
    neutral: 0,
    negative: 0,
    highUrgency: 0,
    positiveRatio: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [reclassifyingId, setReclassifyingId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (sentimentFilter !== 'ALL') params.append('sentiment', sentimentFilter);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (sourceFilter !== 'ALL') params.append('source', sourceFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (dateRangeFilter !== 'ALL') params.append('dateRange', dateRangeFilter);
      params.append('page', page.toString());
      params.append('limit', '10');

      const res = await fetch(`/api/feedback?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setFeedbacks(data.feedbacks);
        if (data.pagination) setPagination(data.pagination);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load feedback:', err);
    } finally {
      setLoading(false);
    }
  }, [search, sentimentFilter, categoryFilter, sourceFilter, statusFilter, dateRangeFilter, page]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  // Reset page to 1 when filters change
  const handleFilterChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setPage(1);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setFeedbacks((prev) =>
          prev.map((f) => (f.id === id ? { ...f, status: newStatus as FeedbackItem['status'] } : f))
        );
        if (selectedFeedback && selectedFeedback.id === id) {
          setSelectedFeedback((prev) => (prev ? { ...prev, status: newStatus as FeedbackItem['status'] } : null));
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleReclassify = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setReclassifyingId(id);
    try {
      const res = await fetch('/api/feedback/reclassify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success && data.feedback) {
        setFeedbacks((prev) =>
          prev.map((f) => (f.id === id ? { ...f, ...data.feedback } : f))
        );
        if (selectedFeedback && selectedFeedback.id === id) {
          setSelectedFeedback((prev) => (prev ? { ...prev, ...data.feedback } : null));
        }
      }
    } catch (err) {
      console.error('Error reclassifying:', err);
    } finally {
      setReclassifyingId(null);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this feedback item?')) return;
    try {
      const res = await fetch(`/api/feedback?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFeedbacks((prev) => prev.filter((f) => f.id !== id));
        if (selectedFeedback?.id === id) setSelectedFeedback(null);
      }
    } catch (err) {
      console.error('Error deleting feedback:', err);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/feedback/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchFeedbacks();
      }
    } catch (err) {
      console.error('Error seeding data:', err);
    } finally {
      setSeeding(false);
    }
  };

  const getSentimentBadge = (sentiment: string | null) => {
    switch (sentiment) {
      case 'Positive':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Negative':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  const getUrgencyBadge = (urgency: string | null) => {
    switch (urgency) {
      case 'High':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
      case 'Medium':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-700/40 text-slate-400 border-slate-600/30';
    }
  };

  const getChannelBadge = (source: string) => {
    return source;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Feedback Inbox</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Live Stream
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time multi-channel customer intelligence, automated AI sentiment & categorization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedData}
            disabled={seeding}
            className="px-3.5 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>{seeding ? 'Seeding...' : 'Seed Sample Data'}</span>
          </button>
          <Link
            href="/feedback/new"
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2"
          >
            <span>+ Submit Feedback</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Feedback</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Positive Ratio</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.positiveRatio}%</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">High Urgency</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{stats.highUrgency}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Negative Reviews</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{stats.negative}</p>
        </div>
      </div>

      {/* Search & Multi-filter Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/90 mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="w-full md:w-72 relative">
          <input
            type="text"
            placeholder="Search feedback text, email, summary..."
            value={search}
            onChange={(e) => handleFilterChange(setSearch, e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <svg className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Sentiment Filter */}
          <select
            value={sentimentFilter}
            onChange={(e) => handleFilterChange(setSentimentFilter, e.target.value)}
            aria-label="Filter by sentiment"
            className="px-3 py-2 text-xs font-medium bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Sentiments</option>
            <option value="Positive">Positive (POS)</option>
            <option value="Neutral">Neutral (NEU)</option>
            <option value="Negative">Negative (NEG)</option>
          </select>

          {/* Category/Theme Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => handleFilterChange(setCategoryFilter, e.target.value)}
            aria-label="Filter by category"
            className="px-3 py-2 text-xs font-medium bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Themes</option>
            <option value="Performance">Performance</option>
            <option value="Bug">Bug</option>
            <option value="Feature Request">Feature Request</option>
            <option value="UI/UX">UI/UX</option>
            <option value="Billing">Billing</option>
            <option value="Support">Support</option>
          </select>

          {/* Channel Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => handleFilterChange(setSourceFilter, e.target.value)}
            aria-label="Filter by channel"
            className="px-3 py-2 text-xs font-medium bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Channels</option>
            <option value="Email">Email</option>
            <option value="Twitter">Twitter / X</option>
            <option value="Discord">Discord</option>
            <option value="Support Ticket">Support Ticket</option>
            <option value="Survey">Survey</option>
            <option value="App Store">App Store</option>
          </select>

          {/* Status Workflow Filter (NEW -> REVIEWED -> ACTIONED) */}
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
            aria-label="Filter by workflow status"
            className="px-3 py-2 text-xs font-medium bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="ACTIONED">Actioned</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={dateRangeFilter}
            onChange={(e) => handleFilterChange(setDateRangeFilter, e.target.value)}
            aria-label="Filter by date range"
            className="px-3 py-2 text-xs font-medium bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Feedback Feed */}
      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading customer feedback items...</div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
          <p className="text-slate-400 font-medium">No feedback items found matching your filters.</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={handleSeedData}
              className="px-4 py-2 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20"
            >
              Seed Sample Feedback Data
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/90 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
              onClick={() => setSelectedFeedback(item)}
            >
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {item.source}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${getSentimentBadge(item.sentiment)}`}>
                    {item.sentiment || 'Neutral'} {item.sentimentScore !== null ? `(${item.sentimentScore > 0 ? '+' : ''}${item.sentimentScore})` : ''}
                  </span>
                  {item.category && (
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {item.category}
                    </span>
                  )}
                  {item.urgency && item.urgency !== 'Low' && (
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${getUrgencyBadge(item.urgency)}`}>
                      {item.urgency} Urgency
                    </span>
                  )}
                  <span className="text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-sm text-slate-200 line-clamp-2">{item.content}</p>

                {item.summary && (
                  <p className="text-xs text-slate-400 italic">
                    AI Summary: &ldquo;{item.summary}&rdquo;
                  </p>
                )}

                {item.customerEmail && (
                  <p className="text-xs text-slate-500">
                    From: {item.customerName || 'Customer'} ({item.customerEmail})
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5 self-end md:self-center" onClick={(e) => e.stopPropagation()}>
                {/* Manual Re-classify Button (Zidio Brief AI1.4) */}
                <button
                  onClick={(e) => handleReclassify(item.id, e)}
                  disabled={reclassifyingId === item.id}
                  title="Re-run AI classification"
                  className="px-2.5 py-1.5 text-xs font-medium text-blue-300 bg-blue-950/60 hover:bg-blue-900/60 border border-blue-700/50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <span>{reclassifyingId === item.id ? 'Classifying...' : 'Re-classify'}</span>
                </button>

                {/* Inline Status Selector (Zidio Brief C4.4: NEW -> REVIEWED -> ACTIONED) */}
                <select
                  value={item.status || 'NEW'}
                  onChange={(e) => handleStatusChange(item.id, e.target.value)}
                  aria-label="Update feedback status"
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none transition-colors ${
                    item.status === 'ACTIONED'
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50'
                      : item.status === 'REVIEWED'
                      ? 'bg-amber-950/60 text-amber-300 border-amber-700/50'
                      : 'bg-blue-950/60 text-blue-300 border-blue-700/50'
                  }`}
                >
                  <option value="NEW">New</option>
                  <option value="REVIEWED">Reviewed</option>
                  <option value="ACTIONED">Actioned</option>
                </select>

                <button
                  onClick={(e) => handleDelete(item.id, e)}
                  title="Delete Feedback"
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {/* Server-Side Pagination Bar (Zidio Brief C4.1) */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-800 text-xs text-slate-400">
            <span>
              Showing {feedbacks.length} of {pagination.total} feedback items (Page {pagination.page} of {pagination.totalPages})
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
              >
                ← Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold px-2.5 py-1 rounded bg-slate-800 text-slate-300">
                  {selectedFeedback.source}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded border ${getSentimentBadge(selectedFeedback.sentiment)}`}>
                  {selectedFeedback.sentiment} ({selectedFeedback.sentimentScore})
                </span>
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Raw Feedback Content</h3>
              <p className="text-sm text-slate-100 bg-slate-950 p-4 rounded-xl border border-slate-800/80 whitespace-pre-wrap">
                {selectedFeedback.content}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/60 text-xs">
              <div>
                <span className="text-slate-400">Theme / Category:</span>
                <span className="ml-2 font-medium text-slate-200">{selectedFeedback.category || 'General'}</span>
              </div>
              <div>
                <span className="text-slate-400">Urgency:</span>
                <span className="ml-2 font-medium text-slate-200">{selectedFeedback.urgency || 'Low'}</span>
              </div>
              <div>
                <span className="text-slate-400">Customer:</span>
                <span className="ml-2 font-medium text-slate-200">{selectedFeedback.customerName || 'Anonymous'}</span>
              </div>
              <div>
                <span className="text-slate-400">Email:</span>
                <span className="ml-2 font-medium text-slate-200">{selectedFeedback.customerEmail || 'N/A'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400">AI Summary:</span>
                <p className="mt-1 font-medium text-slate-300 italic">{selectedFeedback.summary || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleReclassify(selectedFeedback.id)}
                  disabled={reclassifyingId === selectedFeedback.id}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-300 bg-blue-950/70 border border-blue-700/60 rounded-lg hover:bg-blue-900/60 flex items-center gap-1.5"
                >
                  {reclassifyingId === selectedFeedback.id ? 'Re-classifying...' : 'Re-classify with AI'}
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Status:</span>
                  <select
                    value={selectedFeedback.status || 'NEW'}
                    onChange={(e) => handleStatusChange(selectedFeedback.id, e.target.value)}
                    aria-label="Change status in modal"
                    className="text-xs font-semibold px-2.5 py-1.5 rounded bg-slate-800 text-slate-200 border border-slate-700"
                  >
                    <option value="NEW">New</option>
                    <option value="REVIEWED">Reviewed</option>
                    <option value="ACTIONED">Actioned</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => setSelectedFeedback(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
