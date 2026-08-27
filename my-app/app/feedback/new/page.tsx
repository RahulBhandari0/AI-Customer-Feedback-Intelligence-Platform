'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { analyzeFeedbackWithAI } from '@/lib/ai';

export default function NewFeedbackPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [source, setSource] = useState('Web Form');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Live client-side preview using AI analysis helper
  const liveAnalysis = content.trim() ? analyzeFeedbackWithAI(content) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please provide feedback content');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          source,
          customerName,
          customerEmail,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/feedback');
      } else {
        setError(data.error || 'Failed to submit feedback');
      }
    } catch (err) {
      console.error(err);
      setError('Network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const loadSample = (type: 'praise' | 'bug' | 'billing') => {
    if (type === 'praise') {
      setContent('The new AI summary report generator saved our team 4 hours this week! Clean design and lightning fast.');
      setSource('Twitter');
      setCustomerName('Jordan Taylor');
      setCustomerEmail('jordan@cloudscale.io');
    } else if (type === 'bug') {
      setContent('The PDF report download crashes with a 500 error when the date filter is set to past 90 days. Urgent blocker for our quarterly review.');
      setSource('Support Ticket');
      setCustomerName('Morgan Lee');
      setCustomerEmail('m.lee@enterprise.com');
    } else {
      setContent('We were billed twice on our annual renewal invoice. Need an immediate refund for the extra $1,200 charge.');
      setSource('Email');
      setCustomerName('Samantha Reed');
      setCustomerEmail('sreed@venture.co');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <Link href="/feedback" className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 mb-2">
          ← Back to Feedback Inbox
        </Link>
        <h1 className="text-3xl font-bold text-white tracking-tight">Ingest Customer Feedback</h1>
        <p className="text-sm text-slate-400 mt-1">
          Submit feedback from any source. Our AI model will automatically analyze sentiment, categorize the feedback, and determine urgency.
        </p>
      </div>

      {/* Quick Sample Helpers */}
      <div className="p-3.5 mb-6 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center gap-2.5">
        <span className="text-xs font-medium text-slate-400">Quick Test Samples:</span>
        <button
          type="button"
          onClick={() => loadSample('praise')}
          className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
        >
          Positive Praise
        </button>
        <button
          type="button"
          onClick={() => loadSample('bug')}
          className="text-xs px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
        >
          Urgent Bug Report
        </button>
        <button
          type="button"
          onClick={() => loadSample('billing')}
          className="text-xs px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
        >
          Billing Issue
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Feedback Content *
              </label>
              <textarea
                required
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste verbatim customer feedback, email, review or support ticket text..."
                className="w-full p-3.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Channel Source
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Web Form">Web Form</option>
                  <option value="Email">Email</option>
                  <option value="Twitter">Twitter / X</option>
                  <option value="Discord">Discord</option>
                  <option value="Support Ticket">Support Ticket</option>
                  <option value="Survey">Customer Survey</option>
                  <option value="App Store">App Store / Play Store</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full p-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Customer Email (Optional)
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@domain.com"
                className="w-full p-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Link
                href="/feedback"
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 rounded-lg"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
              >
                {submitting ? 'Submitting & Analyzing...' : 'Submit with AI Analysis'}
              </button>
            </div>
          </form>
        </div>

        {/* Live AI Intelligence Preview Panel */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-blue-500/20 shadow-lg shadow-blue-900/10">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Live AI Intelligence Preview</h3>
            </div>

            {liveAnalysis ? (
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Detected Sentiment</span>
                  <span
                    className={`inline-block font-semibold px-2.5 py-1 rounded-md border ${
                      liveAnalysis.sentiment === 'Positive'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : liveAnalysis.sentiment === 'Negative'
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {liveAnalysis.sentiment} ({liveAnalysis.sentimentScore > 0 ? '+' : ''}{liveAnalysis.sentimentScore})
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Predicted Category</span>
                  <span className="inline-block font-medium px-2.5 py-1 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    {liveAnalysis.category}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Urgency Level</span>
                  <span
                    className={`inline-block font-medium px-2.5 py-1 rounded-md border ${
                      liveAnalysis.urgency === 'High'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {liveAnalysis.urgency}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Extracted Summary</span>
                  <p className="text-slate-300 italic bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    &ldquo;{liveAnalysis.summary}&rdquo;
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">
                Start typing feedback to see real-time AI classification, sentiment scoring, and topic extraction.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
