"use client";

import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";

interface FeedbackInboxProps {
  workspaceId?: string;
}

export default function FeedbackInbox({ workspaceId }: FeedbackInboxProps) {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);

  const categories = ["ALL", "POSITIVE", "NEUTRAL", "NEGATIVE"];

  useEffect(() => {
    if (!workspaceId || workspaceId === "undefined") {
      setFeedbacks([]);
      return;
    }

    const fetchFeedbacks = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/feedback?workspaceId=${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          setFeedbacks(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error fetching feedback:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [workspaceId]);

  const filteredFeedbacks = feedbacks.filter((item) => {
    if (filter === "ALL") return true;
    return item.sentiment === filter;
  });

  return (
    <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Feedback Inbox
        </h3>
        <p className="text-xs text-slate-500">
          Total <span className="font-semibold">{filteredFeedbacks.length}</span> feedbacks
        </p>
      </div>

      {/* Filter Buttons UI */}
      <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              filter === cat
                ? "bg-blue-600 text-white shadow"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Feedbacks List */}
      <div className="space-y-3 min-h-[200px]">
        {loading ? (
          <p className="text-sm text-slate-500 italic text-center py-8">Loading feedbacks...</p>
        ) : filteredFeedbacks.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No Feedback found.</p>
        ) : (
          filteredFeedbacks.map((item) => (
            <div key={item.id} className="p-3 border rounded-lg bg-background hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-sm font-semibold">{item.title || item.content}</h4>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  item.sentiment === "POSITIVE" ? "bg-green-100 text-green-700" :
                  item.sentiment === "NEGATIVE" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                }`}>
                  {item.sentiment || "NEUTRAL"}
                </span>
              </div>
              {item.description && <p className="text-xs text-slate-600 dark:text-slate-400">{item.description}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}