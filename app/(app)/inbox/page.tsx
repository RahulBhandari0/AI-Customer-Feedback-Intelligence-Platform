'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Search,
  Plus,
  Upload,
  Radio,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export default function InboxPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'VIEWER';
  const isReadOnly = userRole === 'VIEWER';

  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [status, setStatus] = useState('');
  const [days, setDays] = useState('');

  // Modals / Drawers
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Single Ingestion Form
  const [singleContent, setSingleContent] = useState('');
  const [singleChannel, setSingleChannel] = useState('Support Ticket');
  const [singleCustomerLabel, setSingleCustomerLabel] = useState('');
  const [singleSubmitting, setSingleSubmitting] = useState(false);

  // Bulk CSV Form
  const [csvText, setCsvText] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkSummary, setBulkSummary] = useState<any>(null);

  // Channel Simulation state
  const [simulating, setSimulating] = useState(false);

  const fetchInbox = async (page = pagination.page) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) query.append('search', search);
      if (channel) query.append('channel', channel);
      if (sentiment) query.append('sentiment', sentiment);
      if (status) query.append('status', status);
      if (days) query.append('days', days);

      const res = await fetch(`/api/feedback?${query.toString()}`);
      const data = await res.json();
      setItems(data.items || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to fetch inbox:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox(1);
  }, [search, channel, sentiment, status, days]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (isReadOnly) return;
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleReclassify = async (id: string) => {
    if (isReadOnly) return;
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reclassify: true }),
      });
      const data = await res.json();
      if (res.ok && data.item) {
        setItems((prev) => prev.map((item) => (item.id === id ? data.item : item)));
      }
    } catch (err) {
      console.error('Failed to reclassify item:', err);
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: singleContent,
          channel: singleChannel,
          customerLabel: singleCustomerLabel,
        }),
      });
      if (res.ok) {
        setShowSingleModal(false);
        setSingleContent('');
        setSingleCustomerLabel('');
        fetchInbox(1);
      }
    } catch (err) {
      console.error('Failed to add feedback:', err);
    } finally {
      setSingleSubmitting(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkSubmitting(true);
    setBulkSummary(null);

    try {
      // Parse CSV text into JSON objects
      const lines = csvText.split('\n').filter((l) => l.trim().length > 0);
      const rows = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // skip header if present
        if (i === 0 && line.toLowerCase().includes('content')) continue;
        const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
        if (parts[0]) {
          rows.push({
            content: parts[0],
            channel: parts[1] || 'CSV Upload',
            customerLabel: parts[2] || undefined,
          });
        }
      }

      const res = await fetch('/api/feedback/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows),
      });

      const data = await res.json();
      setBulkSummary(data.summary);
      if (res.ok) {
        fetchInbox(1);
      }
    } catch (err) {
      console.error('Bulk submission error:', err);
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleSimulateChannel = async () => {
    if (isReadOnly) return;
    setSimulating(true);
    try {
      const res = await fetch('/api/feedback/simulate', { method: 'POST' });
      if (res.ok) {
        fetchInbox(1);
      }
    } catch (err) {
      console.error('Failed to simulate channel:', err);
    } finally {
      setSimulating(false);
    }
  };

  const getSentimentBadge = (sent: string) => {
    switch (sent) {
      case 'POS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">POS</span>;
      case 'NEG':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">NEG</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30">NEU</span>;
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Inbox Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Feedback Inbox</h1>
          <p className="text-slate-400 text-xs mt-1">Multi-channel triage with full-text search, filters, inline status workflows, and AI auto-tagging.</p>
        </div>

        {/* Action Triggers (Ingestion) */}
        {!isReadOnly && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSimulateChannel}
              disabled={simulating}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-950 border border-indigo-700/60 text-indigo-300 hover:bg-indigo-900 text-xs font-semibold transition disabled:opacity-50"
              title="Simulate multi-channel integration feedback"
            >
              <Radio className={`w-3.5 h-3.5 text-indigo-400 ${simulating ? 'animate-pulse' : ''}`} />
              <span>{simulating ? 'Simulating...' : 'Simulate Channel'}</span>
            </button>

            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 text-xs font-medium transition"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Bulk CSV</span>
            </button>

            <button
              onClick={() => setShowSingleModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Feedback</span>
            </button>
          </div>
        )}
      </div>

      {/* Search & Multi-Filter Bar */}
      <div className="glass-panel p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search feedback content..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Channel Filter */}
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="bg-slate-900 border border-slate-700/80 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
        >
          <option value="">All Channels</option>
          <option value="Support Ticket">Support Ticket</option>
          <option value="App Store Review">App Store Review</option>
          <option value="NPS Survey">NPS Survey</option>
          <option value="Sales Call Note">Sales Call Note</option>
          <option value="Community Post">Community Post</option>
        </select>

        {/* Sentiment Filter */}
        <select
          value={sentiment}
          onChange={(e) => setSentiment(e.target.value)}
          className="bg-slate-900 border border-slate-700/80 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
        >
          <option value="">All Sentiments</option>
          <option value="POS">Positive</option>
          <option value="NEU">Neutral</option>
          <option value="NEG">Negative</option>
        </select>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-slate-900 border border-slate-700/80 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="REVIEWED">Reviewed</option>
          <option value="ACTIONED">Actioned</option>
        </select>
      </div>

      {/* Feedback Table / List */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">Loading workspace inbox...</div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            No feedback entries match your search filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                  <th className="p-3.5 font-semibold">Feedback Content & Features</th>
                  <th className="p-3.5 font-semibold">Channel</th>
                  <th className="p-3.5 font-semibold">Sentiment</th>
                  <th className="p-3.5 font-semibold">Themes</th>
                  <th className="p-3.5 font-semibold">Status Workflow</th>
                  <th className="p-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 max-w-md">
                      <div className="text-slate-200 font-medium leading-relaxed mb-1">{item.content}</div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span>{item.customerLabel || 'Anonymous Customer'}</span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        {item.featureArea && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">{item.featureArea}</span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <span className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                        {item.channel}
                      </span>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {getSentimentBadge(item.sentiment)}
                        <span className="text-[10px] text-slate-500">({item.sentimentScore})</span>
                      </div>
                    </td>

                    <td className="p-3.5 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {item.themes?.map((t: any) => (
                          <span
                            key={t.theme.id}
                            className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700/70 text-slate-300 truncate max-w-[130px]"
                            title={t.theme.name}
                          >
                            {t.theme.name}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <select
                        value={item.status}
                        disabled={isReadOnly}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className={`text-xs font-semibold rounded px-2.5 py-1 focus:outline-none border cursor-pointer ${
                          item.status === 'NEW'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : item.status === 'REVIEWED'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        <option value="NEW">NEW</option>
                        <option value="REVIEWED">REVIEWED</option>
                        <option value="ACTIONED">ACTIONED</option>
                      </select>
                    </td>

                    <td className="p-3.5 whitespace-nowrap text-right">
                      {!isReadOnly && (
                        <button
                          onClick={() => handleReclassify(item.id)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-300 hover:border-indigo-500/40 transition"
                          title="Re-classify with AI"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing Page <span className="font-semibold text-white">{pagination.page}</span> of{' '}
            <span className="font-semibold text-white">{pagination.totalPages}</span> ({pagination.total} total items)
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchInbox(pagination.page - 1)}
              className="p-1.5 rounded bg-slate-800 border border-slate-700 disabled:opacity-40 hover:bg-slate-700 text-slate-200 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchInbox(pagination.page + 1)}
              className="p-1.5 rounded bg-slate-800 border border-slate-700 disabled:opacity-40 hover:bg-slate-700 text-slate-200 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Single Entry Modal */}
      {showSingleModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Add Single Feedback Entry
              </h3>
              <button onClick={() => setShowSingleModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSingleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Feedback Content *</label>
                <textarea
                  required
                  rows={4}
                  value={singleContent}
                  onChange={(e) => setSingleContent(e.target.value)}
                  placeholder="Paste feedback verbatim..."
                  className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Channel *</label>
                  <select
                    value={singleChannel}
                    onChange={(e) => setSingleChannel(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none"
                  >
                    <option value="Support Ticket">Support Ticket</option>
                    <option value="App Store Review">App Store Review</option>
                    <option value="NPS Survey">NPS Survey</option>
                    <option value="Sales Call Note">Sales Call Note</option>
                    <option value="Community Post">Community Post</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Customer Label (Optional)</label>
                  <input
                    type="text"
                    value={singleCustomerLabel}
                    onChange={(e) => setSingleCustomerLabel(e.target.value)}
                    placeholder="e.g. Enterprise Client A"
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSingleModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={singleSubmitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2"
                >
                  {singleSubmitting ? 'Classifying with AI...' : 'Save & Auto-Classify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Bulk CSV / Text Ingestion
              </h3>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Paste CSV Lines (Format: content, channel, customer_label)</label>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`"Onboarding flow was confusing",Support Ticket,Customer #101\n"Love the new analytics export",App Store Review,Customer #102`}
                  className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-[11px] focus:outline-none"
                />
              </div>

              {bulkSummary && (
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="font-semibold text-emerald-400">
                    Import Summary: {bulkSummary.importedCount} Imported successfully, {bulkSummary.failedCount} Failed
                  </div>
                  {bulkSummary.errors?.length > 0 && (
                    <div className="text-[10px] text-red-400 max-h-20 overflow-y-auto">
                      {bulkSummary.errors.map((e: string, idx: number) => (
                        <div key={idx}>• {e}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={bulkSubmitting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2"
                >
                  {bulkSubmitting ? 'Processing Rows...' : 'Run Bulk Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

