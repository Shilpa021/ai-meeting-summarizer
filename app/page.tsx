"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

type SummaryResult = {
  summary: string;
  key_points: string[];
  action_items: string[];
};

export function parseSummaryText(text: string): SummaryResult {
  try {
    // 🟢 Step 1 — Try direct JSON parse
    const parsed = JSON.parse(text);

    return {
      summary: parsed.summary || "No summary available.",
      key_points: Array.isArray(parsed.key_points)
        ? parsed.key_points
        : ["No key points found."],
      action_items: Array.isArray(parsed.action_items)
        ? parsed.action_items
        : ["No explicit action items detected."],
    };
  } catch {
    // 🔴 Step 2 — Handle messy LLM output (extra text, markdown, etc.)
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        return {
          summary: parsed.summary || "No summary available.",
          key_points: Array.isArray(parsed.key_points)
            ? parsed.key_points
            : ["No key points found."],
          action_items: Array.isArray(parsed.action_items)
            ? parsed.action_items
            : ["No explicit action items detected."],
        };
      }
    } catch {
      // ignore
    }
  }

  // 🟡 Step 3 — Fallback (like your local function)
  return fallbackParser(text);
}

function fallbackParser(text: string): SummaryResult {
  const sections = {
    summary: "",
    key_points: [] as string[],
    action_items: [] as string[],
  };

  const summaryMatch = text.match(/Summary:\s*([\s\S]*?)\n\s*\n/i);
  const keyPointsMatch = text.match(/Key Points:\s*([\s\S]*?)\n\s*\n/i);
  const actionItemsMatch = text.match(/Action Items:\s*([\s\S]*)/i);

  if (summaryMatch) {
    sections.summary = summaryMatch[1].trim();
  }

  if (keyPointsMatch) {
    sections.key_points = keyPointsMatch[1]
      .split("\n")
      .map((line) => line.replace(/^-\s*/, "").trim())
      .filter(Boolean);
  }

  if (actionItemsMatch) {
    sections.action_items = actionItemsMatch[1]
      .split("\n")
      .map((line) => line.replace(/^-\s*/, "").trim())
      .filter(Boolean);
  }

  return {
    summary: sections.summary || "No summary available.",
    key_points:
      sections.key_points.length > 0
        ? sections.key_points
        : ["No key points found."],
    action_items:
      sections.action_items.length > 0
        ? sections.action_items
        : ["No explicit action items detected."],
  };
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setStatus("Transcribing audio...");

    const formData = new FormData();
    formData.append("file", file);

    const res1 = await fetch("/api/vercelaiTranscribe", {
      method: "POST",
      body: formData,
    });

    const data1 = await res1.json();

    setStatus("Generating summary...");

    const res2 = await fetch("/api/grok_summarize", {
      method: "POST",
      body: JSON.stringify({ transcript: data1?.transcript?.text || data1.error }),
    });

    const data2 = await res2.json();
    if (!res2.ok || typeof data2?.result !== "string") {
      setResult(null);
      setStatus(data2?.error || "Failed to summarize");
      setLoading(false);
      return;
    }

    setResult(parseSummaryText(data2.result));
    setLoading(false);
    setStatus("");
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            AI Meeting Summarizer
          </h1>
          <p className="text-gray-500 text-sm">
            Upload audio and get structured insights instantly
          </p>
        </div>

        {/* Upload Card */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
          <CardContent className="p-6 space-y-5">

            {/* File Upload */}
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer hover:border-gray-400 transition">
              <span className="text-sm text-gray-500">
                {file ? file.name : "Click to upload audio file"}
              </span>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>

            {/* Button */}
            <Button
              onClick={handleUpload}
              disabled={loading}
              className="w-full text-base py-5"
            >
              {loading ? status || "Processing..." : "Upload & Summarize"}
            </Button>

          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >

            {/* Summary */}
            <Card className="hover:shadow-md transition">
              <CardContent className="p-5 space-y-2">
                <h2 className="font-semibold text-lg">Summary</h2>
                <p className="text-gray-700 leading-relaxed">
                  {result.summary}
                </p>
              </CardContent>
            </Card>

            {/* Key Points */}
            <Card className="hover:shadow-md transition">
              <CardContent className="p-5 space-y-2">
                <h2 className="font-semibold text-lg">Key Points</h2>
                <ul className="list-disc ml-5 space-y-1 text-gray-700">
                  {result.key_points.map((p: string, i: number) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Action Items */}
            <Card className="hover:shadow-md transition">
              <CardContent className="p-5 space-y-2">
                <h2 className="font-semibold text-lg">Action Items</h2>
                <ul className="list-disc ml-5 space-y-1 text-gray-700">
                  {result.action_items.map((a: string, i: number) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Copy Button */}
            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={() =>
                  navigator.clipboard.writeText(result.summary || "")
                }
              >
                Copy Summary
              </Button>
            </div>

          </motion.div>
        )}
      </div>
    </main>
  );

}