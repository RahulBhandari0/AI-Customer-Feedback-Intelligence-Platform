"use client";

import { useEffect, useState } from "react";
import WorkspaceSwitcher from "@/components/WorkspaceSwitcher";
import FeedbackForm from "@/components/FeedbackForm";

interface Workspace {
  id: string;
  name: string;
  role: "ADMIN" | "MEMBER";
}

interface Feedback {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);

  // Selected workspace ke feedbacks fetch karein
  const fetchFeedbacks = async (workspaceId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/feedback?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data);
      }
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchFeedbacks(currentWorkspace.id);
    }
  }, [currentWorkspace]);

  // ADMIN only: Delete Feedback
  const handleDelete = async (feedbackId: string) => {
    if (!currentWorkspace) return;

    try {
      const res = await fetch("/api/feedback", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackId,
          workspaceId: currentWorkspace.id,
        }),
      });

      if (res.ok) {
        fetchFeedbacks(currentWorkspace.id);
      } else {
        const data = await res.json();
        alert(data.error || "Permission Denied");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Top Header & Workspace Switcher */}
      <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-lg">
        <h1 className="text-2xl font-bold">Feedback Dashboard</h1>
        <WorkspaceSwitcher onSelectWorkspace={(ws) => setCurrentWorkspace(ws)} />
      </div>

      {currentWorkspace ? (
        <div className="space-y-8">
          {/* Feedback Add Form */}
          <FeedbackForm
            workspaceId={currentWorkspace.id}
            userRole={currentWorkspace.role}
            onFeedbackAdded={() => fetchFeedbacks(currentWorkspace.id)}
          />

          {/* Feedback List Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-xl text-gray-800">Workspace Feedbacks</h3>
            
            {loading ? (
              <p className="text-gray-500">Loading feedbacks...</p>
            ) : feedbacks.length === 0 ? (
              <p className="text-gray-500">No feedbacks found in this workspace.</p>
            ) : (
              <div className="grid gap-4">
                {feedbacks.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg bg-white shadow-sm flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-lg text-gray-900">{item.title}</h4>
                      <p className="text-gray-600 mt-1">{item.description}</p>
                    </div>

                    {/* RBAC UI Rule: Only show Delete button to ADMIN */}
                    {currentWorkspace.role === "ADMIN" && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-gray-500">Loading workspace...</p>
      )}
    </div>
  );
}