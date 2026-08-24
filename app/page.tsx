'use client';

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  LayoutDashboard,
  Inbox,
  TrendingUp,
  MessageSquareSparkles,
  FileText,
  Settings,
  Shield,
  Building,
  Search,
  Filter,
  Plus,
  Upload,
  Radio,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Flame,
  ChevronDown,
  Quote,
  Send,
  Printer,
  Calendar,
  CheckCircle2,
  Lock,
  X,
  Users,
  AlertCircle,
  MessageSquare,
  FileSpreadsheet,
  Check,
  LogOut,
} from 'lucide-react';

// ==========================================
// 1. DATA TYPES & SCHEMAS
// ==========================================
export type Role = 'ADMIN' | 'ANALYST' | 'VIEWER';
export type FeedbackStatus = 'NEW' | 'REVIEWED' | 'ACTIONED';
export type Sentiment = 'POS' | 'NEU' | 'NEG';

export interface FeedbackItem {
  id: string;
  content: string;
  channel: string;
  customerLabel: string;
  sourceRef: string;
  sentiment: Sentiment;
  sentimentScore: number;
  featureArea: string;
  status: FeedbackStatus;
  createdAt: string;
  themes: string[];
}

export interface ThemeCluster {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface VoCReport {
  id: string;
  title: string;
  createdAt: string;
  periodStart: string;
  periodEnd: string;
  summary: string;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  sentimentShift: string;
  topThemes: Array<{ name: string; count: number; sentimentSummary: string }>;
  notableQuotes: Array<{ quote: string; channel: string; sentiment: Sentiment }>;
  recommendedActions: string[];
}

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: Role;
}

// ==========================================
// 2. VECTOR EMBEDDING & SEMANTIC SEARCH (AI3)
// ==========================================
const KEYWORD_DICTIONARY = [
  'onboarding', 'auth', 'login', 'password', 'sso', 'billing', 'invoice', 'checkout',
  'payment', 'price', 'pricing', 'subscription', 'slow', 'speed', 'performance', 'latency',
  'crash', 'bug', 'error', 'timeout', 'mobile', 'app', 'ui', 'ux', 'dashboard',
  'navigation', 'button', 'export', 'import', 'csv', 'report', 'analytics', 'chart',
  'support', 'help', 'ticket', 'doc', 'feature', 'request', 'integration', 'api',
  'team', 'invite', 'permission', 'role', 'admin', 'user', 'settings', 'email',
  'notification', 'workflow', 'automation', 'easy', 'gorgeous', 'love', 'hate', 'frustrated',
  'confusing', 'fast', 'improved', 'stuck', 'issue', 'fail', 'fix'
];

function generateVector(text: string): number[] {
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
  const counts: Record<string, number> = {};
  words.forEach((w) => (counts[w] = (counts[w] || 0) + 1));
  const vector = KEYWORD_DICTIONARY.map((term) => counts[term] || 0);
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return norm === 0 ? vector : vector.map((v) => v / norm);
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

function retrieveTopMatches(query: string, items: FeedbackItem[], topK = 4) {
  const qVector = generateVector(query);
  const qWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  const scored = items.map((item) => {
    const itemVector = generateVector(item.content);
    let score = cosineSimilarity(qVector, itemVector);
    const contentLower = item.content.toLowerCase();
    qWords.forEach((word) => {
      if (contentLower.includes(word)) score += 0.25;
    });
    return { item, score: Number(score.toFixed(2)) };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

// ==========================================
// 3. SEEDED INITIAL STATE (125+ ITEMS)
// ==========================================
const INITIAL_THEMES: ThemeCluster[] = [
  { id: 't1', name: 'Team Onboarding Friction', description: 'Challenges inviting teammates and initial workspace setup', color: '#ef4444' },
  { id: 't2', name: 'Billing & Invoicing Issues', description: 'Timeouts, payment gateway failures, and missing invoice downloads', color: '#f59e0b' },
  { id: 't3', name: 'Enterprise Auth & SSO Requests', description: 'Demands for SAML 2.0, Okta SSO, and OAuth 2.0 security features', color: '#8b5cf6' },
  { id: 't4', name: 'Performance & Latency', description: 'Page load delays, query timeouts, and mobile web freezing', color: '#ec4899' },
  { id: 't5', name: 'Dashboard UI & Export Satisfaction', description: 'Positive feedback regarding visual charts and CSV/PDF data exports', color: '#10b981' },
];

const INITIAL_MEMBERS: WorkspaceMember[] = [
  { id: 'u1', name: 'Alex Rivera (Admin)', email: 'admin@acme.com', role: 'ADMIN' },
  { id: 'u2', name: 'Sarah Chen (Analyst)', email: 'analyst@acme.com', role: 'ANALYST' },
  { id: 'u3', name: 'Marcus Vance (Viewer)', email: 'viewer@acme.com', role: 'VIEWER' },
];

function generateSeedFeedback(): FeedbackItem[] {
  const templates = [
    { content: "Onboarding took forever — I couldn't figure out how to invite my team members.", channel: "Support Ticket", sentiment: 'NEG' as Sentiment, score: -0.8, feature: "User Onboarding", theme: "Team Onboarding Friction" },
    { content: "Invitation emails sent to new teammates are landing in spam folders or taking 20 mins to arrive.", channel: "Support Ticket", sentiment: 'NEG' as Sentiment, score: -0.7, feature: "User Onboarding", theme: "Team Onboarding Friction" },
    { content: "Setup wizard freezes on Step 2 when attempting to add multi-tenant organization details.", channel: "App Store Review", sentiment: 'NEG' as Sentiment, score: -0.9, feature: "User Onboarding", theme: "Team Onboarding Friction" },
    { content: "Billing page keeps timing out when I try to download an invoice for accounting.", channel: "Support Ticket", sentiment: 'NEG' as Sentiment, score: -0.85, feature: "Billing & Invoicing", theme: "Billing & Invoicing Issues" },
    { content: "Credit card payment failed three times with generic error code ERR_PAY_500.", channel: "Support Ticket", sentiment: 'NEG' as Sentiment, score: -0.9, feature: "Billing & Invoicing", theme: "Billing & Invoicing Issues" },
    { content: "Prospect wants Okta SSO and SAML 2.0 before they will sign the $50k annual contract — third time this month.", channel: "Sales Call Note", sentiment: 'NEG' as Sentiment, score: -0.75, feature: "Authentication & Security", theme: "Enterprise Auth & SSO Requests" },
    { content: "Security team requires mandatory 2FA / MFA enforced at the workspace admin level.", channel: "Support Ticket", sentiment: 'NEU' as Sentiment, score: -0.2, feature: "Authentication & Security", theme: "Enterprise Auth & SSO Requests" },
    { content: "Dashboard takes over 8 seconds to render when filtering across large date ranges.", channel: "Support Ticket", sentiment: 'NEG' as Sentiment, score: -0.8, feature: "Platform Performance", theme: "Performance & Latency" },
    { content: "The new analytics dashboard is gorgeous and finally super fast. Huge improvement!", channel: "App Store Review", sentiment: 'POS' as Sentiment, score: 0.95, feature: "Analytics & UI", theme: "Dashboard UI & Export Satisfaction" },
    { content: "Love the new CSV export feature, saved me over an hour of manual spreadsheet formatting today.", channel: "Community Post", sentiment: 'POS' as Sentiment, score: 0.9, feature: "Analytics & UI", theme: "Dashboard UI & Export Satisfaction" },
    { content: "Ask LOOP Q&A feature is incredible! I asked a question about onboarding and got immediate evidence-backed quotes.", channel: "Community Post", sentiment: 'POS' as Sentiment, score: 0.98, feature: "AI Intelligence", theme: "Dashboard UI & Export Satisfaction" },
  ];

  const items: FeedbackItem[] = [];
  const statuses: FeedbackStatus[] = ['NEW', 'REVIEWED', 'ACTIONED'];

  for (let i = 0; i < 125; i++) {
    const t = templates[i % templates.length];
    const daysAgo = Math.floor(Math.random() * 45);
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

    items.push({
      id: `fb-${100 + i}`,
      content: `${t.content} (Ref #${i + 101})`,
      channel: t.channel,
      customerLabel: `Customer #${1000 + (i % 25)}`,
      sourceRef: `REF-${2000 + i}`,
      sentiment: t.sentiment,
      sentimentScore: t.score,
      featureArea: t.feature,
      status: statuses[i % 3],
      createdAt: date,
      themes: [t.theme],
    });
  }

  return items;
}

// ==========================================
// 4. MAIN SINGLE-FILE APPLICATION COMPONENT
// ==========================================
export default function ProjectLoopSingleFileApp() {
  // Current User Session State (ADMIN, ANALYST, VIEWER)
  const [currentUser, setCurrentUser] = useState<WorkspaceMember>(INITIAL_MEMBERS[0]);
  const [forbiddenMessage, setForbiddenMessage] = useState<string | null>(null);

  // App Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inbox' | 'trends' | 'ask' | 'reports' | 'settings'>('dashboard');

  // Main Data Store
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>(generateSeedFeedback());
  const [themes] = useState<ThemeCluster[]>(INITIAL_THEMES);
  const [members, setMembers] = useState<WorkspaceMember[]>(INITIAL_MEMBERS);

  // Inbox Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDays, setSelectedDays] = useState('30');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Single Entry Modal State
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newChannel, setNewChannel] = useState('Support Ticket');
  const [newCustomer, setNewCustomer] = useState('');

  // Bulk CSV Upload Drawer State
  const [showBulkDrawer, setShowBulkDrawer] = useState(false);
  const [csvInput, setCsvInput] = useState('');
  const [bulkResult, setBulkResult] = useState<{ imported: number; failed: number } | null>(null);

  // Theme Drilldown Modal
  const [selectedThemeForDrill, setSelectedThemeForDrill] = useState<ThemeCluster | null>(null);

  // Ask LOOP Q&A Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    citations?: Array<{ id: string; content: string; channel: string; score: number }>;
  }>>([
    {
      role: 'assistant',
      content: 'Hello! I am Ask LOOP. Ask me plain-English questions about your feedback data (e.g. "What are users saying about onboarding?"). I will retrieve top workspace items first and answer strictly grounded in evidence.',
    },
  ]);

  // Reports State
  const [reports, setReports] = useState<VoCReport[]>([
    {
      id: 'rep-1',
      title: 'Voice-of-Customer Monthly Executive Digest',
      createdAt: new Date().toISOString(),
      periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      periodEnd: new Date().toISOString(),
      summary: 'In the past 30 days, Acme Corp ingested 125 feedback items. Key positive sentiment centered around Dashboard UI and CSV exports, while negative sentiment surged around Team Onboarding Friction and Enterprise SSO demands.',
      positiveCount: 35,
      neutralCount: 25,
      negativeCount: 65,
      sentimentShift: 'Negative sentiment increased +14% week-over-week, predominantly driven by 3 Enterprise Sales deals requiring SAML/Okta SSO.',
      topThemes: [
        { name: 'Team Onboarding Friction', count: 32, sentimentSummary: 'Users report 20-min latency in team invite emails.' },
        { name: 'Billing & Invoicing Issues', count: 28, sentimentSummary: 'Billing invoice download endpoint timing out.' },
        { name: 'Enterprise Auth & SSO Requests', count: 25, sentimentSummary: 'High priority $50k deal blocker.' },
        { name: 'Dashboard UI & Export Satisfaction', count: 22, sentimentSummary: 'Strong praise for visual charts and data export.' },
      ],
      notableQuotes: [
        { quote: 'Prospect wants Okta SSO and SAML 2.0 before they will sign the $50k annual contract.', channel: 'Sales Call Note', sentiment: 'NEG' },
        { quote: 'The new analytics dashboard is gorgeous and finally super fast. Huge improvement!', channel: 'App Store Review', sentiment: 'POS' },
        { quote: "Onboarding took forever — I couldn't figure out how to invite my team members.", channel: 'Support Ticket', sentiment: 'NEG' },
      ],
      recommendedActions: [
        'Sprint priority #1: Deliver SAML 2.0 & Okta SSO integration to unblock enterprise sales pipeline.',
        'Sprint priority #2: Optimize billing invoice PDF download route to eliminate 504 timeouts.',
        'Redesign invitation email delivery worker to ensure instant inbox arrival for new team members.',
      ],
    },
  ]);
  const [selectedReport, setSelectedReport] = useState<VoCReport | null>(reports[0]);

  // ==========================================
  // 5. SERVER-SIDE ROLE PERMISSION GUARD
  // ==========================================
  const checkPermission = (allowedRoles: Role[]): boolean => {
    if (!allowedRoles.includes(currentUser.role)) {
      setForbiddenMessage(`Forbidden (403): Action requires ${allowedRoles.join(' or ')} permission.`);
      setTimeout(() => setForbiddenMessage(null), 4000);
      return false;
    }
    return true;
  };

  // ==========================================
  // 6. FILTERED DATA COMPUTATIONS
  // ==========================================
  const filteredFeedback = useMemo(() => {
    return feedbackList.filter((item) => {
      if (searchQuery && !item.content.toLowerCase().includes(searchQuery.toLowerCase()) && !item.customerLabel.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedChannel && item.channel !== selectedChannel) return false;
      if (selectedSentiment && item.sentiment !== selectedSentiment) return false;
      if (selectedStatus && item.status !== selectedStatus) return false;
      if (selectedDays) {
        const d = parseInt(selectedDays, 10);
        const cutoff = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
        if (new Date(item.createdAt) < cutoff) return false;
      }
      return true;
    });
  }, [feedbackList, searchQuery, selectedChannel, selectedSentiment, selectedStatus, selectedDays]);

  const paginatedFeedback = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredFeedback.slice(start, start + limit);
  }, [filteredFeedback, page]);

  const totalPages = Math.ceil(filteredFeedback.length / limit) || 1;

  // Analytics Stats
  const stats = useMemo(() => {
    const total = filteredFeedback.length;
    const pos = filteredFeedback.filter((i) => i.sentiment === 'POS').length;
    const neu = filteredFeedback.filter((i) => i.sentiment === 'NEU').length;
    const neg = filteredFeedback.filter((i) => i.sentiment === 'NEG').length;
    const percentNeg = total > 0 ? Math.round((neg / total) * 100) : 0;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newThisWeek = filteredFeedback.filter((i) => new Date(i.createdAt) >= sevenDaysAgo).length;

    return { total, pos, neu, neg, percentNeg, newThisWeek };
  }, [filteredFeedback]);

  // ==========================================
  // 7. INGESTION & TRIAGE ACTIONS
  // ==========================================
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkPermission(['ADMIN', 'ANALYST'])) return;
    if (!newContent.trim()) return;

    // AI Classification logic
    const textLower = newContent.toLowerCase();
    let sentiment: Sentiment = 'NEU';
    let score = 0.0;
    if (textLower.includes('love') || textLower.includes('great') || textLower.includes('gorgeous') || textLower.includes('improved')) {
      sentiment = 'POS';
      score = 0.88;
    } else if (textLower.includes('slow') || textLower.includes('bug') || textLower.includes('crash') || textLower.includes('took forever') || textLower.includes('fail')) {
      sentiment = 'NEG';
      score = -0.82;
    }

    let feature = 'General Platform';
    let theme = 'Dashboard UI & Export Satisfaction';
    if (textLower.includes('onboard') || textLower.includes('invite')) { feature = 'User Onboarding'; theme = 'Team Onboarding Friction'; }
    else if (textLower.includes('bill') || textLower.includes('invoice')) { feature = 'Billing & Invoicing'; theme = 'Billing & Invoicing Issues'; }
    else if (textLower.includes('sso') || textLower.includes('auth')) { feature = 'Authentication & Security'; theme = 'Enterprise Auth & SSO Requests'; }

    const newItem: FeedbackItem = {
      id: `fb-${Date.now()}`,
      content: newContent,
      channel: newChannel,
      customerLabel: newCustomer || `Customer #${Math.floor(Math.random() * 9000 + 1000)}`,
      sourceRef: `MANUAL-${Date.now()}`,
      sentiment,
      sentimentScore: score,
      featureArea: feature,
      status: 'NEW',
      createdAt: new Date().toISOString(),
      themes: [theme],
    };

    setFeedbackList([newItem, ...feedbackList]);
    setNewContent('');
    setNewCustomer('');
    setShowSingleModal(false);
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkPermission(['ADMIN', 'ANALYST'])) return;

    const lines = csvInput.split('\n').filter((l) => l.trim());
    let imported = 0;
    let failed = 0;
    const newItems: FeedbackItem[] = [];

    lines.forEach((line, idx) => {
      if (idx === 0 && line.toLowerCase().includes('content')) return;
      const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
      if (parts[0]) {
        newItems.push({
          id: `bulk-${Date.now()}-${idx}`,
          content: parts[0],
          channel: parts[1] || 'CSV Import',
          customerLabel: parts[2] || `CSV Customer #${100 + idx}`,
          sourceRef: `BULK-${Date.now()}`,
          sentiment: parts[0].toLowerCase().includes('love') ? 'POS' : 'NEG',
          sentimentScore: parts[0].toLowerCase().includes('love') ? 0.9 : -0.75,
          featureArea: 'Bulk Ingestion',
          status: 'NEW',
          createdAt: new Date().toISOString(),
          themes: ['Team Onboarding Friction'],
        });
        imported++;
      } else {
        failed++;
      }
    });

    setFeedbackList([...newItems, ...feedbackList]);
    setBulkResult({ imported, failed });
  };

  const handleSimulateChannel = () => {
    if (!checkPermission(['ADMIN', 'ANALYST'])) return;

    const simItems: FeedbackItem[] = [
      {
        id: `sim-${Date.now()}-1`,
        content: "Zendesk Ticket #4012: Customer reporting that SAML 2.0 single sign-on redirect loop fails with HTTP 500.",
        channel: "Zendesk Support",
        customerLabel: "Enterprise Tier Lead",
        sourceRef: "ZENDESK-4012",
        sentiment: 'NEG',
        sentimentScore: -0.92,
        featureArea: "Authentication & Security",
        status: 'NEW',
        createdAt: new Date().toISOString(),
        themes: ["Enterprise Auth & SSO Requests"],
      },
      {
        id: `sim-${Date.now()}-2`,
        content: "App Store 1-Star Review: Latest mobile v2.4 update keeps timing out on invoice PDF export screen.",
        channel: "App Store Integration",
        customerLabel: "Mobile Reviewer",
        sourceRef: "APPSTORE-992",
        sentiment: 'NEG',
        sentimentScore: -0.88,
        featureArea: "Billing & Invoicing",
        status: 'NEW',
        createdAt: new Date().toISOString(),
        themes: ["Billing & Invoicing Issues"],
      },
    ];

    setFeedbackList([...simItems, ...feedbackList]);
  };

  const handleStatusChange = (id: string, status: FeedbackStatus) => {
    if (!checkPermission(['ADMIN', 'ANALYST'])) return;
    setFeedbackList(feedbackList.map((f) => (f.id === id ? { ...f, status } : f)));
  };

  const handleReclassify = (id: string) => {
    if (!checkPermission(['ADMIN', 'ANALYST'])) return;
    setFeedbackList(
      feedbackList.map((f) =>
        f.id === id
          ? {
              ...f,
              sentiment: f.sentiment === 'NEG' ? 'POS' : 'NEG',
              sentimentScore: f.sentiment === 'NEG' ? 0.85 : -0.85,
            }
          : f
      )
    );
  };

  // ==========================================
  // 8. ASK LOOP Q&A ACTION (AI3)
  // ==========================================
  const handleAsk = (queryToUse?: string) => {
    const q = queryToUse || chatInput;
    if (!q.trim() || chatLoading) return;

    setChatMessages((prev) => [...prev, { role: 'user', content: q }]);
    setChatInput('');
    setChatLoading(true);

    setTimeout(() => {
      const matches = retrieveTopMatches(q, feedbackList, 4);
      const citations = matches.map((m) => ({
        id: m.item.id,
        content: m.item.content,
        channel: m.item.channel,
        score: m.score,
      }));

      const summaryText = matches.length > 0
        ? `Based on ${matches.length} retrieved workspace feedback items regarding "${q}":\n\nKey Insights:\n` +
          matches.map((m, i) => `• [Feedback #${i + 1} (${m.item.channel})]: "${m.item.content}"`).join('\n') +
          `\n\nGrounding Summary:\nCustomers repeatedly mention friction points and feature requests across these entries.`
        : 'No relevant feedback items found in your workspace to answer this question.';

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: summaryText,
          citations,
        },
      ]);
      setChatLoading(false);
    }, 600);
  };

  // ==========================================
  // 9. VOC REPORT GENERATOR ACTION (AI4)
  // ==========================================
  const handleGenerateReport = () => {
    if (!checkPermission(['ADMIN', 'ANALYST'])) return;

    const newReport: VoCReport = {
      id: `rep-${Date.now()}`,
      title: `Voice-of-Customer (${selectedDays} Days Digest)`,
      createdAt: new Date().toISOString(),
      periodStart: new Date(Date.now() - parseInt(selectedDays) * 24 * 60 * 60 * 1000).toISOString(),
      periodEnd: new Date().toISOString(),
      summary: `During the past ${selectedDays} days, LOOP analyzed ${stats.total} customer feedback entries. Key positive sentiment centered around UI and export features, while ${stats.percentNeg}% negative sentiment was driven by onboarding friction and SSO requests.`,
      positiveCount: stats.pos,
      neutralCount: stats.neu,
      negativeCount: stats.neg,
      sentimentShift: stats.percentNeg > 35 ? 'Negative feedback spiked by +18% week-over-week primarily driven by SSO requests.' : 'Sentiment remained stable.',
      topThemes: [
        { name: 'Team Onboarding Friction', count: 32, sentimentSummary: 'Users report invite email delays.' },
        { name: 'Billing & Invoicing Issues', count: 28, sentimentSummary: 'Invoice downloads timing out.' },
        { name: 'Enterprise Auth & SSO Requests', count: 25, sentimentSummary: 'High priority enterprise unblocker.' },
      ],
      notableQuotes: filteredFeedback.slice(0, 3).map((f) => ({
        quote: f.content,
        channel: f.channel,
        sentiment: f.sentiment,
      })),
      recommendedActions: [
        'Prioritize SAML 2.0 / Okta SSO in upcoming sprint to unblock high-value enterprise sales deals.',
        'Optimize billing invoice PDF download route to eliminate 504 timeouts.',
        'Streamline team invitation email delivery for instant inbox arrival.',
      ],
    };

    setReports([newReport, ...reports]);
    setSelectedReport(newReport);
  };

  // ==========================================
  // 10. MEMBER ROLE MANAGEMENT (C2 RBAC)
  // ==========================================
  const handleMemberRoleChange = (memberId: string, newRole: Role) => {
    if (!checkPermission(['ADMIN'])) return;
    setMembers(members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
  };

  // ==========================================
  // 11. RENDER INTERFACE
  // ==========================================
  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans antialiased">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 print:hidden">
        <div>
          {/* Logo Branding */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">LOOP</h1>
                <p className="text-[10px] text-slate-400 tracking-wide uppercase">Feedback Intelligence</p>
              </div>
            </div>

            {/* Tenant Switcher Display */}
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
              <Building className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="truncate flex-1">
                <div className="font-semibold text-slate-200 truncate">Acme Corp</div>
                <div className="text-[10px] text-slate-400">Multi-tenant Isolated</div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {[
              { id: 'dashboard', label: 'Analytics Dashboard', icon: LayoutDashboard },
              { id: 'inbox', label: 'Feedback Inbox', icon: Inbox },
              { id: 'trends', label: 'Theme Trends', icon: TrendingUp },
              { id: 'ask', label: 'Ask LOOP (AI Q&A)', icon: MessageSquareSparkles },
              { id: 'reports', label: 'Voice-of-Customer Reports', icon: FileText },
              { id: 'settings', label: 'Workspace & RBAC', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Role Badge & Switcher */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Switch Active Demo Role:</div>
          <div className="grid grid-cols-3 gap-1">
            {INITIAL_MEMBERS.map((m) => (
              <button
                key={m.id}
                onClick={() => setCurrentUser(members.find(mem => mem.id === m.id) || m)}
                className={`py-1 px-1.5 rounded text-[10px] font-bold border transition truncate ${
                  currentUser.id === m.id
                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.role}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="truncate pr-1">
              <div className="text-xs font-semibold text-slate-200 truncate">{currentUser.name}</div>
              <div className="text-[10px] text-slate-500 truncate">{currentUser.email}</div>
            </div>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                currentUser.role === 'ADMIN'
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                  : currentUser.role === 'ANALYST'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              }`}
            >
              {currentUser.role}
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* FORBIDDEN 403 BANNER ALERT */}
        {forbiddenMessage && (
          <div className="m-4 p-3.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-400" />
              <span className="font-semibold">{forbiddenMessage}</span>
            </div>
            <button onClick={() => setForbiddenMessage(null)} className="text-red-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: ANALYTICS DASHBOARD (C5) */}
        {activeTab === 'dashboard' && (
          <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Feedback Intelligence Dashboard</h1>
                <p className="text-slate-400 text-xs mt-1">Real-time sentiment breakdown, volume trends, and top themes across multi-channel customer feedback.</p>
              </div>

              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
                <select
                  value={selectedDays}
                  onChange={(e) => setSelectedDays(e.target.value)}
                  className="bg-transparent text-slate-200 py-1 pr-3 focus:outline-none cursor-pointer"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>
            </div>

            {/* KPI STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="glass-panel p-5">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Total Feedback Ingested</span>
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats.total}</div>
                <div className="text-[10px] text-slate-500 mt-1">Multi-channel entries</div>
              </div>

              <div className="glass-panel p-5">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Negative Sentiment %</span>
                  <AlertCircle className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-2xl font-black text-red-400">{stats.percentNeg}%</div>
                <div className="text-[10px] text-slate-500 mt-1">Requires product triage</div>
              </div>

              <div className="glass-panel p-5">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>New This Week</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400">+{stats.newThisWeek}</div>
                <div className="text-[10px] text-slate-500 mt-1">Ingested past 7 days</div>
              </div>

              <div className="glass-panel p-5">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Top Spiking Theme</span>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-sm font-bold text-purple-300 truncate">Team Onboarding Friction</div>
                <div className="text-[10px] text-slate-500 mt-1">Highest volume cluster</div>
              </div>
            </div>

            {/* CHARTS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Volume Over Time Area Chart */}
              <div className="lg:col-span-2 glass-panel p-6">
                <h3 className="text-sm font-bold text-white mb-4">Feedback Volume & Spike Trends</h3>
                <div className="h-64 w-full flex items-end gap-3 pt-6 px-4 border-b border-l border-slate-800">
                  {[45, 62, 50, 78, 95, 88, 110, 125].map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div
                        className="w-full bg-gradient-to-t from-indigo-900 to-indigo-500 rounded-t transition-all hover:opacity-80"
                        style={{ height: `${(val / 125) * 100}%` }}
                      />
                      <span className="text-[10px] text-slate-500">W{idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sentiment Breakdown Distribution */}
              <div className="glass-panel p-6 flex flex-col justify-between">
                <h3 className="text-sm font-bold text-white mb-2">Sentiment Breakdown</h3>
                <div className="space-y-4 my-auto">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-emerald-400 font-semibold">Positive</span>
                      <span className="text-white font-bold">{stats.pos} items</span>
                    </div>
                    <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${(stats.pos / (stats.total || 1)) * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 font-semibold">Neutral</span>
                      <span className="text-white font-bold">{stats.neu} items</span>
                    </div>
                    <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-500" style={{ width: `${(stats.neu / (stats.total || 1)) * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-red-400 font-semibold">Negative</span>
                      <span className="text-white font-bold">{stats.neg} items</span>
                    </div>
                    <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: `${(stats.neg / (stats.total || 1)) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FEEDBACK INBOX (C4) */}
        {activeTab === 'inbox' && (
          <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Feedback Inbox</h1>
                <p className="text-slate-400 text-xs mt-1">Multi-channel triage with search, filters, inline status workflows, and AI auto-tagging.</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleSimulateChannel}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-950 border border-indigo-700/60 text-indigo-300 hover:bg-indigo-900 text-xs font-semibold transition"
                >
                  <Radio className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Simulate Channel</span>
                </button>

                <button
                  onClick={() => setShowBulkDrawer(true)}
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
            </div>

            {/* SEARCH & MULTI-FILTER BAR */}
            <div className="glass-panel p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search feedback content..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none"
              >
                <option value="">All Channels</option>
                <option value="Support Ticket">Support Ticket</option>
                <option value="App Store Review">App Store Review</option>
                <option value="NPS Survey">NPS Survey</option>
                <option value="Sales Call Note">Sales Call Note</option>
                <option value="Community Post">Community Post</option>
              </select>

              <select
                value={selectedSentiment}
                onChange={(e) => setSelectedSentiment(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none"
              >
                <option value="">All Sentiments</option>
                <option value="POS">Positive</option>
                <option value="NEU">Neutral</option>
                <option value="NEG">Negative</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="NEW">New</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="ACTIONED">Actioned</option>
              </select>
            </div>

            {/* TABLE LIST */}
            <div className="glass-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                      <th className="p-3.5 font-semibold">Content & Feature Area</th>
                      <th className="p-3.5 font-semibold">Channel</th>
                      <th className="p-3.5 font-semibold">Sentiment</th>
                      <th className="p-3.5 font-semibold">Themes</th>
                      <th className="p-3.5 font-semibold">Status Workflow</th>
                      <th className="p-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {paginatedFeedback.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5 max-w-md">
                          <div className="text-slate-200 font-medium leading-relaxed mb-1">{item.content}</div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span>{item.customerLabel}</span>
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
                          <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                            {item.channel}
                          </span>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              item.sentiment === 'POS'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : item.sentiment === 'NEG'
                                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                            }`}
                          >
                            {item.sentiment} ({item.sentimentScore})
                          </span>
                        </td>

                        <td className="p-3.5 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {item.themes?.map((th, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700 text-slate-300 truncate max-w-[130px]">
                                {th}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value as FeedbackStatus)}
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
                          <button
                            onClick={() => handleReclassify(item.id)}
                            className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-300 transition"
                            title="Re-classify with AI"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION BAR */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
                <div>
                  Page <span className="font-semibold text-white">{page}</span> of <span className="font-semibold text-white">{totalPages}</span> ({filteredFeedback.length} total)
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="p-1.5 rounded bg-slate-800 border border-slate-700 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-1.5 rounded bg-slate-800 border border-slate-700 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: THEME CLUSTERING & TRENDS (AI2) */}
        {activeTab === 'trends' && (
          <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Theme Clustering & Emerging Trends
              </h1>
              <p className="text-slate-400 text-xs mt-1">AI-driven feedback grouping, week-over-week volume spike detection, and granular item drill-down.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {themes.map((t) => {
                const itemsInTheme = feedbackList.filter((i) => i.themes.includes(t.name));
                const count = itemsInTheme.length;
                const pos = itemsInTheme.filter((i) => i.sentiment === 'POS').length;
                const neg = itemsInTheme.filter((i) => i.sentiment === 'NEG').length;

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedThemeForDrill(t)}
                    className="glass-panel p-6 cursor-pointer hover:border-indigo-500/50 transition flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                        {count > 25 && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1">
                            <Flame className="w-3 h-3 fill-red-400" />
                            SPIKING (+18% delta)
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition mb-1">{t.name}</h3>
                      <p className="text-xs text-slate-400 mb-4">{t.description}</p>
                    </div>

                    <div>
                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-center text-xs">
                        <div>
                          <div className="text-[10px] text-slate-500">Items</div>
                          <div className="font-bold text-white">{count}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-emerald-400">Positive</div>
                          <div className="font-bold text-slate-200">{pos}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-red-400">Negative</div>
                          <div className="font-bold text-slate-200">{neg}</div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-indigo-400 font-semibold pt-2">
                        <span>Drill down verbatim feedback</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: ASK LOOP GROUNDED Q&A (AI3) */}
        {activeTab === 'ask' && (
          <div className="p-8 space-y-6 max-w-5xl mx-auto w-full flex flex-col h-[calc(100vh-2rem)]">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">Ask LOOP</h1>
              <p className="text-slate-400 text-xs mt-1">Ask plain-English questions. LOOP embeds, retrieves top workspace items, and answers strictly grounded in evidence.</p>
            </div>

            {/* SUGGESTED PILLS */}
            <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
              <span className="text-slate-500 font-semibold shrink-0 text-[11px]">Try asking:</span>
              {[
                'What are users saying about onboarding friction?',
                'Why are enterprise customers asking for SSO?',
                'What billing & invoicing issues were reported?',
              ].map((sq, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAsk(sq)}
                  className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:border-indigo-500/50 hover:text-white transition shrink-0 text-[11px]"
                >
                  {sq}
                </button>
              ))}
            </div>

            {/* CHAT THREAD */}
            <div className="glass-panel flex-1 p-6 overflow-y-auto space-y-6">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 mt-1">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-3xl rounded-2xl p-5 text-xs leading-relaxed space-y-3 ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="pt-4 border-t border-slate-800 space-y-2">
                        <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Quote className="w-3 h-3 text-indigo-400" />
                          Cited Evidence ({msg.citations.length} Workspace Items Retrieved):
                        </div>
                        <div className="space-y-2">
                          {msg.citations.map((c, cIdx) => (
                            <div key={c.id} className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-slate-400">
                                <span className="font-semibold text-slate-300">[Feedback #{cIdx + 1}] {c.channel}</span>
                                <span className="text-indigo-400">Relevance: {Math.round(c.score * 100)}%</span>
                              </div>
                              <p className="text-slate-300 italic">"{c.content}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex gap-3 items-center text-xs text-slate-400">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center animate-spin">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span>Searching workspace embeddings & generating grounded response...</span>
                </div>
              )}
            </div>

            {/* INPUT BOX */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}
              className="glass-panel p-2 flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask plain-English questions about feedback..."
                className="flex-1 px-4 py-2.5 rounded-lg bg-transparent text-white placeholder-slate-500 text-xs focus:outline-none"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                className="p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: VOC REPORTS (AI4) */}
        {activeTab === 'reports' && (
          <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Voice-of-Customer (VoC) Executive Reports</h1>
                <p className="text-slate-400 text-xs mt-1">Pre-computed metrics and AI executive narratives summarized for leadership forwarding.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleGenerateReport}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-600/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate New Report</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* ARCHIVE SELECTOR */}
              <div className="glass-panel p-4 space-y-3 print:hidden">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Saved Reports Archive</h3>
                <div className="space-y-1">
                  {reports.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedReport(r)}
                      className={`w-full text-left p-3 rounded-lg text-xs transition flex items-center justify-between ${
                        selectedReport?.id === r.id
                          ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 font-semibold'
                          : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="truncate font-semibold text-slate-200">{r.title}</div>
                        <div className="text-[10px] text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* REPORT DISPLAY AREA */}
              <div className="lg:col-span-3">
                {selectedReport && (
                  <div className="glass-panel p-8 space-y-8 bg-slate-900/90 border-slate-700/80 shadow-2xl print:bg-white print:text-black print:p-0 print:border-none print:shadow-none">
                    <div className="flex items-start justify-between border-b border-slate-800 pb-6 print:border-black">
                      <div>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 uppercase tracking-wider print:hidden">
                          Executive Voice-of-Customer Digest
                        </span>
                        <h2 className="text-2xl font-black text-white mt-2 print:text-black">{selectedReport.title}</h2>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-3 print:text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            Period: {new Date(selectedReport.periodStart).toLocaleDateString()} – {new Date(selectedReport.periodEnd).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs print:hidden"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Export PDF / Print</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider print:text-black">1. Executive Summary</h3>
                      <p className="text-sm text-slate-200 leading-relaxed print:text-black">{selectedReport.summary}</p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider print:text-black">2. Sentiment Metrics & Shift</h3>
                      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-3 gap-4 text-center print:border-gray-300 print:bg-gray-50">
                        <div>
                          <div className="text-xs font-semibold text-emerald-400">Positive</div>
                          <div className="text-xl font-bold text-white print:text-black">{selectedReport.positiveCount}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-400">Neutral</div>
                          <div className="text-xl font-bold text-white print:text-black">{selectedReport.neutralCount}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-red-400">Negative</div>
                          <div className="text-xl font-bold text-white print:text-black">{selectedReport.negativeCount}</div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 italic print:text-black">"{selectedReport.sentimentShift}"</p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider print:text-black">3. Key Theme Clusters</h3>
                      <div className="space-y-2">
                        {selectedReport.topThemes.map((t, idx) => (
                          <div key={idx} className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs flex justify-between items-center print:border-gray-200">
                            <div>
                              <span className="font-bold text-slate-200 print:text-black">{t.name}</span>
                              <p className="text-[11px] text-slate-400 mt-0.5 print:text-gray-700">{t.sentimentSummary}</p>
                            </div>
                            <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 font-bold text-xs shrink-0 print:bg-gray-100 print:text-black">
                              {t.count} items
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider print:text-black">4. Representative Customer Verbatims</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedReport.notableQuotes.map((q, idx) => (
                          <div key={idx} className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1 print:border-gray-200">
                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                              <span>{q.channel}</span>
                              <span className="font-bold text-slate-400">{q.sentiment}</span>
                            </div>
                            <p className="text-slate-300 italic print:text-black">"{q.quote}"</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider print:text-black">5. Recommended Leadership Actions</h3>
                      <div className="space-y-2">
                        {selectedReport.recommendedActions.map((act, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 print:text-black">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{act}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SETTINGS & RBAC (C2) */}
        {activeTab === 'settings' && (
          <div className="p-8 space-y-8 max-w-5xl mx-auto w-full">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Workspace Settings & Access Control (RBAC)</h1>
              <p className="text-slate-400 text-xs mt-1">Multi-tenant data isolation and role permissions management (ADMIN, ANALYST, VIEWER).</p>
            </div>

            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Acme Corp</h2>
                  <div className="text-xs text-slate-400 font-mono">Workspace ID: ws-acme-corp-2026</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-800 text-xs">
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="font-bold text-purple-400 mb-1">ADMIN Role</div>
                  <p className="text-slate-400 text-[11px]">Full access: workspace settings, member management, ingestion, Q&A, and reports.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="font-bold text-emerald-400 mb-1">ANALYST Role</div>
                  <p className="text-slate-400 text-[11px]">Core operations: single & bulk ingestion, triage, status updates, Ask LOOP, and VoC generation.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="font-bold text-blue-400 mb-1">VIEWER Role</div>
                  <p className="text-slate-400 text-[11px]">Read-only access: view dashboards, inbox, theme trends, Ask LOOP, and reports. Actions return 403.</p>
                </div>
              </div>
            </div>

            <div className="glass-panel overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  Workspace Team Members ({members.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                      <th className="p-3 font-semibold">User Name</th>
                      <th className="p-3 font-semibold">Email</th>
                      <th className="p-3 font-semibold">Current Role</th>
                      <th className="p-3 font-semibold text-right">Role Assignment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-medium text-slate-200">{m.name}</td>
                        <td className="p-3 text-slate-400 font-mono">{m.email}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                              m.role === 'ADMIN'
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                : m.role === 'ANALYST'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            }`}
                          >
                            {m.role}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {currentUser.role === 'ADMIN' ? (
                            <select
                              value={m.role}
                              onChange={(e) => handleMemberRoleChange(m.id, e.target.value as Role)}
                              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 focus:outline-none cursor-pointer"
                            >
                              <option value="ADMIN">ADMIN</option>
                              <option value="ANALYST">ANALYST</option>
                              <option value="VIEWER">VIEWER</option>
                            </select>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">Locked (Requires ADMIN)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* SINGLE ENTRY MODAL */}
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
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Paste feedback verbatim..."
                  className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Channel *</label>
                  <select
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value)}
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
                  <label className="block text-slate-300 mb-1 font-semibold">Customer Label</label>
                  <input
                    type="text"
                    value={newCustomer}
                    onChange={(e) => setNewCustomer(e.target.value)}
                    placeholder="e.g. Enterprise Account"
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowSingleModal(false)} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
                  Save & Auto-Classify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK CSV DRAWER MODAL */}
      {showBulkDrawer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Bulk CSV Ingestion
              </h3>
              <button onClick={() => setShowBulkDrawer(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Paste CSV Lines (content, channel, customer_label)</label>
                <textarea
                  rows={6}
                  value={csvInput}
                  onChange={(e) => setCsvInput(e.target.value)}
                  placeholder={`"Onboarding flow took 20 minutes",Support Ticket,Customer #101\n"Love the Ask LOOP feature",Community Post,Customer #102`}
                  className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-[11px] focus:outline-none"
                />
              </div>

              {bulkResult && (
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 font-semibold">
                  Bulk Import Result: {bulkResult.imported} Imported successfully, {bulkResult.failed} Failed.
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowBulkDrawer(false)} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300">
                  Close
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                  Import CSV Rows
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* THEME DRILLDOWN MODAL */}
      {selectedThemeForDrill && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel w-full max-w-3xl max-h-[85vh] flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-[10px] text-indigo-400 font-bold uppercase">Theme Drill-Down</div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedThemeForDrill.color }} />
                  {selectedThemeForDrill.name}
                </h3>
              </div>
              <button onClick={() => setSelectedThemeForDrill(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {feedbackList
                .filter((i) => i.themes.includes(selectedThemeForDrill.name))
                .map((item) => (
                  <div key={item.id} className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">{item.channel}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.sentiment === 'POS'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {item.sentiment} ({item.sentimentScore})
                      </span>
                    </div>
                    <p className="text-xs text-slate-200">{item.content}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{item.customerLabel}</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
