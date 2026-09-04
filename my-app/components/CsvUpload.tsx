"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";

interface CsvUploadProps {
  workspaceId?: string;
}

export default function CsvUpload({ workspaceId }: CsvUploadProps) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeWorkspaceId = workspaceId || "cmtbcxvci0000ex7dtmteat";

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const parsedData = results.data;

          if (parsedData.length === 0) {
            alert("CSV file is empty!");
            setLoading(false);
            return;
          }

          const res = await fetch("/api/feedback/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              feedbacks: parsedData,
              workspaceId: activeWorkspaceId,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            alert(`Success! Imported ${data.count} feedbacks.`);
            window.location.reload();
          } else {
            const error = await res.json();
            alert(`Upload failed: ${error.message}`);
          }
        } catch (err) {
          console.error(err);
          alert("Something went wrong while uploading CSV.");
        } finally {
          setLoading(false);
        }
      },
      error: (error) => {
        console.error(error);
        alert("Failed to parse CSV file.");
        setLoading(false);
      },
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
      <h3 className="text-md font-bold text-gray-900">Bulk Import via CSV</h3>
      <p className="text-xs text-gray-500">
        Upload a .csv file containing columns: <code>title</code>, <code>description</code>
      </p>

      <div className="flex items-center gap-3 pt-2">
        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={handleFileUpload}
          disabled={loading}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 px-4 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Processing..." : "Choose CSV File"}
        </button>

        {fileName && <span className="text-xs font-mono text-gray-600">{fileName}</span>}
      </div>
    </div>
  );
}