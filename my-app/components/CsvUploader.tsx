"use client";

import { useState } from "react";
import Papa from "papaparse";

interface CsvUploaderProps {
  workspaceId: string;
  onUploadSuccess?: () => void;
}

export default function CsvUploader({ workspaceId, onUploadSuccess }: CsvUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await fetch("/api/feedback/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              feedbacks: results.data,
              workspaceId,
            }),
          });

          const data = await res.json();

          if (res.ok) {
            setMessage({
              text: `Successfully imported ${data.count} feedback records!`,
              type: "success",
            });
            if (onUploadSuccess) onUploadSuccess();
          } else {
            setMessage({
              text: data.error || "Failed to upload CSV.",
              type: "error",
            });
          }
        } catch (err) {
          console.error(err);
          setMessage({ text: "An unexpected error occurred.", type: "error" });
        } finally {
          setLoading(false);
        }
      },
      error: () => {
        setMessage({ text: "Failed to parse CSV file.", type: "error" });
        setLoading(false);
      },
    });
  };

  return (
    <div className="p-5 border rounded-xl bg-white shadow-sm space-y-4 max-w-lg">
      <div>
        <h3 className="font-semibold text-gray-900 text-lg">Bulk Import via CSV</h3>
        <p className="text-sm text-gray-500">
          Upload a CSV file containing <code className="bg-gray-100 px-1 rounded">title</code> and{" "}
          <code className="bg-gray-100 px-1 rounded">description</code> columns.
        </p>
      </div>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        disabled={loading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer disabled:opacity-50"
      />

      {loading && <p className="text-sm text-blue-600 font-medium animate-pulse">Processing CSV & Syncing Database...</p>}

      {message && (
        <p className={`text-sm font-medium p-2.5 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}