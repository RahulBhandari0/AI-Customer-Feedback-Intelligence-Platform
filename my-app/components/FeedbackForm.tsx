"use client";

import React, { useState } from "react";

export default function FeedbackForm({ onFeedbackAdded }: { onFeedbackAdded?: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });

      if (res.ok) {
        alert("Feedback Submitted Successfully!");
        setTitle("");
        setDescription("");
        if (onFeedbackAdded) onFeedbackAdded();
        window.location.reload(); // Instantly refresh page to fetch new feedback
      } else {
        const errorData = await res.json();
        alert("Server Error: " + JSON.stringify(errorData));
      }
    } catch (err: any) {
      alert("Fetch Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
      <h3 className="text-lg font-bold">Add New Feedback</h3>
      
      <div>
        <label className="block text-xs font-semibold mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. UI performance issue"
          required
          className="w-full px-3 py-2 text-sm rounded border border-slate-300 dark:border-slate-700 bg-transparent"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detailed feedback..."
          rows={3}
          required
          className="w-full px-3 py-2 text-sm rounded border border-slate-300 dark:border-slate-700 bg-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Feedback"}
      </button>
    </form>
  );
}