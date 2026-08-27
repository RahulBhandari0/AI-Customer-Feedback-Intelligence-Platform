'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { analyzeFeedbackWithAI } from '@/lib/ai';

interface ParsedRow {
  content: string;
  source: string;
  customerName?: string;
  customerEmail?: string;
  predictedSentiment?: string;
  predictedCategory?: string;
}

export default function BulkImportPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

        if (lines.length <= 1) {
          setError('CSV file is empty or missing headers');
          setLoading(false);
          return;
        }

        // Header detection
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
        const contentIndex = headers.findIndex((h) => h.includes('content') || h.includes('feedback') || h.includes('text') || h.includes('message'));
        const sourceIndex = headers.findIndex((h) => h.includes('source') || h.includes('channel'));
        const nameIndex = headers.findIndex((h) => h.includes('name') || h.includes('customer'));
        const emailIndex = headers.findIndex((h) => h.includes('email'));

        if (contentIndex === -1) {
          setError('CSV must contain a column header named "content" or "feedback"');
          setLoading(false);
          return;
        }

        const parsedRows: ParsedRow[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          // Basic comma parsing accounting for quotes
          const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, '').trim());

          const content = cols[contentIndex];
          if (!content) continue;

          const source = sourceIndex !== -1 && cols[sourceIndex] ? cols[sourceIndex] : 'CSV Upload';
          const customerName = nameIndex !== -1 ? cols[nameIndex] : '';
          const customerEmail = emailIndex !== -1 ? cols[emailIndex] : '';

          const ai = analyzeFeedbackWithAI(content);

          parsedRows.push({
            content,
            source,
            customerName,
            customerEmail,
            predictedSentiment: ai.sentiment,
            predictedCategory: ai.category,
          });
        }

        setRows(parsedRows);
      } catch (err) {
        console.error(err);
        setError('Failed to parse CSV file format');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleImportAll = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    setError('');
    let imported = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: row.content,
            source: row.source,
            customerName: row.customerName,
            customerEmail: row.customerEmail,
          }),
        });
        imported += 1;
        setProgress(Math.round(((i + 1) / rows.length) * 100));
      } catch (err) {
        console.error(err);
      }
    }

    setImporting(false);
    setSuccessCount(imported);
    setTimeout(() => {
      router.push('/feedback');
    }, 1500);
  };

  const downloadSampleCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,content,source,customer_name,customer_email\n' +
      '"The analytics loading is 10x faster now. Great job team!","Twitter","Sam Altman","sam@openai.com"\n' +
      '"Getting 403 forbidden error on member invite link.","Support Ticket","David Miller","dmiller@work.io"\n' +
      '"Please add dark mode and webhook triggers.","Discord","Alex Kim","alex.kim@dev.net"\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sample_customer_feedback.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <Link href="/feedback" className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 mb-2">
            ← Back to Feedback Inbox
          </Link>
          <h1 className="text-3xl font-bold text-white tracking-tight">Bulk CSV Ingestion</h1>
          <p className="text-sm text-slate-400 mt-1">
            Import hundreds of customer feedback entries at once with automatic AI sentiment scoring and categorization.
          </p>
        </div>

        <button
          onClick={downloadSampleCSV}
          className="self-start md:self-auto px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
        >
          Download Sample CSV
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Upload Box */}
      <div className="p-8 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 hover:border-slate-700 text-center transition-all mb-8">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          id="csvFileInput"
          className="hidden"
        />
        <label htmlFor="csvFileInput" className="cursor-pointer block">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-3 border border-blue-500/20">
            📁
          </div>
          <span className="text-sm font-semibold text-white block">
            Click to upload your CSV file
          </span>
          <span className="text-xs text-slate-400 block mt-1">
            Expected columns: content, source, customer_name, customer_email
          </span>
        </label>
      </div>

      {/* Live Preview of Parsed Rows */}
      {loading && <p className="text-center text-slate-400 py-6">Parsing CSV & Running AI Previews...</p>}

      {rows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-200">
              Parsed {rows.length} Feedback Rows Ready for Import
            </span>
            <button
              onClick={handleImportAll}
              disabled={importing}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/25 transition-all"
            >
              {importing ? `Importing (${progress}%)...` : `Import All ${rows.length} Items`}
            </button>
          </div>

          {importing && (
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-500 h-2 transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
          )}

          {successCount !== null && (
            <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
              Successfully imported {successCount} feedbacks! Redirecting to inbox...
            </div>
          )}

          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Content</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">AI Sentiment</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Customer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                {rows.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="p-3 max-w-xs truncate">{row.content}</td>
                    <td className="p-3 text-slate-400">{row.source}</td>
                    <td className="p-3 font-semibold text-blue-400">{row.predictedSentiment}</td>
                    <td className="p-3 text-slate-300">{row.predictedCategory}</td>
                    <td className="p-3 text-slate-400">{row.customerEmail || row.customerName || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 10 && (
              <p className="p-2.5 text-center text-xs text-slate-500 bg-slate-950">
                + {rows.length - 10} more rows ready to import
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
