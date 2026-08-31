"use client";

import { useEffect, useState } from "react";
import WorkspaceSwitcher from "@/components/WorkspaceSwitcher";
import FeedbackForm from "@/components/FeedbackForm";
import CsvUploader from "@/components/CsvUploader";
import Analytics from "@/components/dashboard/Analytics";

interface Workspace {
  id: string;
  name: string;
  role: "ADMIN" | "MEMBER";
}

interface SentimentData {
  name: string;
  value: number;
}

interface ChannelData {
  name: string;
  count: number;
}

interface AnalyticsData {
  totalCount: number;
  sentimentData: SentimentData[];
  channelData: ChannelData[];
}

export default function Dashboard() {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);

  // Analytics States
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalCount: 0,
    sentimentData: [],
    channelData: [],
  });
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(true);

  // Analytics Data Fetching
  const fetchAnalytics = async (workspaceId?: string) => {
    try {
      setLoadingAnalytics(true);
      const url = workspaceId
        ? `/api/analytics?workspaceId=${workspaceId}`
        : "/api/analytics";

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchAnalytics(currentWorkspace.id);
    } else {
      fetchAnalytics();
    }
  }, [currentWorkspace]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Analytics & Feedback Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Total Feedbacks:{" "}
            <span className="font-semibold text-blue-600">
              {analyticsData.totalCount}
            </span>
          </p>
        </div>
        <WorkspaceSwitcher onWorkspaceChange={(ws) => setCurrentWorkspace(ws)} />
      </div>

      {/* Analytics Charts Section */}
      {loadingAnalytics ? (
        <div className="p-8 text-center text-gray-500 bg-white rounded-lg border">
          Loading Analytics Charts...
        </div>
      ) : (
        <Analytics
          sentimentData={analyticsData.sentimentData}
          channelData={analyticsData.channelData}
        />
      )}

      {/* Forms & Uploaders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FeedbackForm workspaceId={currentWorkspace?.id} />
        <CsvUploader workspaceId={currentWorkspace?.id} />
      </div>
    </div>
  );
}