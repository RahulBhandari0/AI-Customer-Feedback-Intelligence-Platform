"use client";

import React, { useState, useEffect } from "react";
import { Loader2, MessageSquare } from "lucide-react";

type FeedbackItem = {
  id: string;
  content: string;
  sentiment: string;
  source: string;
  createdAt?: string | Date;
};

export default function FeedbackInbox() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const res = await fetch("/api/feedback");
        const data = await res.json();
        if (Array.isArray(data)) setFeedbacks(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedbacks();
  }, []);

  // Filter Logic
  const filteredFeedbacks = feedbacks.filter((item) => {
    if (filter === "ALL") return true;
    return item.sentiment === filter;
  });

  const categories = ["ALL", "POSITIVE", "NEUTRAL", "NEGATIVE"];

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <MessageSquare className="w-5 h-5 text-indigo-500" /> Feedback Inbox
        </h3>
        <p className="text-xs text-slate-500">
          Total {filteredFeedbacks.length} feedbacks available hain.
        </p>
      </div>

      {/* Filter Buttons UI */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              filter === cat
                ? "bg-blue-600 text-white shadow"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Feedbacks List */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading feedbacks...
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <p className="text-sm text-slate-500 py-4">Koi feedback nahi mila.</p>
      ) : (
        <div className="space-y-3">
          {filteredFeedbacks.map((item) => (
            <div
              key={item.id}
              className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg flex justify-between items-center bg-slate-50 dark:bg-slate-800/50"
            >
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {item.content}
                </p>
                <span className="text-xs text-slate-400">{item.source}</span>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded font-bold ${
                  item.sentiment === "POSITIVE"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : item.sentiment === "NEGATIVE"
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {item.sentiment}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}