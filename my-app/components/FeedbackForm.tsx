"use client";

import { useState } from "react";

export default function FeedbackForm({
  workspaceId,
  userRole,
  onFeedbackAdded,
}: {
  workspaceId: string;
  userRole: "ADMIN" | "MEMBER";
  onFeedbackAdded: () => void;
}) {
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
        body: JSON.stringify({ title, description, workspaceId }),
      });

      if (res.ok) {
        setTitle("");
        setDescription("");
        onFeedbackAdded();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg space-y-4 bg-white shadow-sm">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg text-gray-800">Add New Feedback</h3>
        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded font-semibold">
          Role: {userRole}
        </span>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full mt-1 p-2 border rounded-md text-sm"
          placeholder="e.g. UI performance issue"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full mt-1 p-2 border rounded-md text-sm"
          placeholder="Detailed feedback..."
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Feedback"}
      </button>
    </form>
  );
}