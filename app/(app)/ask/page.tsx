'use client';

import { useState } from 'react';
import { MessageSquareSparkles, Send, Sparkles, Quote, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citedFeedback?: Array<{
    id: string;
    content: string;
    channel: string;
    sentiment: 'POS' | 'NEU' | 'NEG';
    relevanceScore: number;
  }>;
}

export default function AskPage() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am Ask LOOP. Ask me plain-English questions about your customer feedback (e.g. "What are users saying about onboarding?", "Why are customers asking for SSO?", "What billing issues were reported?"). I will retrieve the exact feedback items first and answer strictly grounded in your workspace data.',
    },
  ]);

  const sampleQuestions = [
    'What are users saying about onboarding friction?',
    'Why are enterprise customers asking for SSO?',
    'What billing & invoicing issues were reported?',
    'What positive feedback did we receive about charts and exports?',
  ];

  const handleAsk = async (queryToUse?: string) => {
    const q = queryToUse || question;
    if (!q.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await fetch('/api/insights/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to retrieve grounded answer');
      }

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.answer,
        citedFeedback: data.citedFeedback || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${err.message || 'An error occurred while answering your question.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto w-full flex flex-col h-[calc(100vh-2rem)]">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Ask LOOP</h1>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-indigo-400" />
            Strictly Grounded Retrieval Q&A
          </span>
        </div>
        <p className="text-slate-400 text-xs mt-1">Ask plain-English questions. LOOP embeds, retrieves top-K relevant workspace items, and answers strictly from evidence.</p>
      </div>

      {/* Suggested Questions Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-semibold shrink-0 text-[11px]">Try asking:</span>
        {sampleQuestions.map((sq, idx) => (
          <button
            key={idx}
            onClick={() => handleAsk(sq)}
            className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:border-indigo-500/50 hover:text-white transition shrink-0 text-[11px]"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Chat Conversation Thread */}
      <div className="glass-panel flex-1 p-6 overflow-y-auto space-y-6">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
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
              <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

              {/* Cited Feedback Evidence Box */}
              {msg.citedFeedback && msg.citedFeedback.length > 0 && (
                <div className="pt-4 border-t border-slate-800/80 space-y-2">
                  <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Quote className="w-3 h-3 text-indigo-400" />
                    Cited Grounded Evidence ({msg.citedFeedback.length} Feedback Items Retrieved):
                  </div>

                  <div className="space-y-2">
                    {msg.citedFeedback.map((item, cIdx) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-semibold text-slate-300">[Feedback #{cIdx + 1}] {item.channel}</span>
                          <span className="text-indigo-400">Relevance: {Math.round(item.relevanceScore * 100)}%</span>
                        </div>
                        <p className="text-slate-300 italic">"{item.content}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center text-xs text-slate-400">
            <div className="w-7 h-7 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center animate-spin">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>Performing vector similarity search & generating grounded answer...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="glass-panel p-2 flex items-center gap-2"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask plain-English questions about customer feedback..."
          className="flex-1 px-4 py-2.5 rounded-lg bg-transparent text-white placeholder-slate-500 text-xs focus:outline-none"
        />
        <button
          type="submit"
          disabled={!question.trim() || loading}
          className="p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

