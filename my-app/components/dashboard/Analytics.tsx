'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SentimentData {
  name: string;
  value: number;
}

interface ChannelData {
  name: string;
  count: number;
}

interface AnalyticsProps {
  sentimentData: SentimentData[];
  channelData: ChannelData[];
}

const SENTIMENT_COLORS: Record<string, string> = {
  POSITIVE: '#10B981',
  NEGATIVE: '#EF4444',
  NEUTRAL: '#F59E0B',
  MIXED: '#8B5CF6',
};

export default function Analytics({ sentimentData, channelData }: AnalyticsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
      {/* Pie Chart */}
      <div className="p-5 bg-white rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Sentiment Breakdown</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
              >
                {sentimentData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={SENTIMENT_COLORS[entry.name.toUpperCase()] || '#9CA3AF'}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="p-5 bg-white rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Feedbacks by Channel</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={channelData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}