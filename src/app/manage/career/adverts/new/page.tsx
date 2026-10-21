"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { CMSLayout } from "@/components/CMSLayout";
import {
  ArrowLeft,
  Upload,
  FileText,
  File,
  Image,
  Clipboard,
  X,
  CheckCircle2,
  AlertCircle,
  Bot,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function NewAdvertPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"text" | "file">("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrNeeded, setOcrNeeded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextSubmit = async () => {
    if (!text.trim()) {
      setError("Please paste job advert text");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/career/adverts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to import advert");
      }

      // Navigate to advert detail page
      router.push(`/manage/career/adverts/${data.advert.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import advert");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSubmit = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setSubmitting(true);
    setError(null);
    setOcrNeeded(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/career/adverts", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.needsOCR) {
          setOcrNeeded(true);
          throw new Error(data.error);
        }
        throw new Error(data.error || "Failed to import file");
      }

      router.push(`/manage/career/adverts/${data.advert.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import file");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const ext = droppedFile.name.toLowerCase().split('.').pop();
      if (['pdf', 'png', 'jpg', 'jpeg', 'webp', 'txt'].includes(ext || '')) {
        setFile(droppedFile);
        setMode("file");
      } else {
        setError("Unsupported file type. Use PDF, PNG, JPG, WEBP, or TXT.");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setMode("file");
      setError(null);
    }
  };

  const supportedTypes = ["PDF", "PNG", "JPG", "WEBP", "TXT"];

  return (
    <CMSLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/manage/career/adverts" className="p-2 rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">Import Job Advert</h1>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">Paste text or upload a file to create a vacancy record</p>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setMode("text")}
            className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm border-b-2 transition-colors ${
              mode === "text"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Clipboard className="w-4 h-4" />
            <span>Paste Text</span>
          </button>
          <button
            onClick={() => setMode("file")}
            className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm border-b-2 transition-colors ${
              mode === "file"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-red-700 dark:text-red-400 text-sm">Import Failed</div>
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</div>
              {ocrNeeded && (
                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-700 dark:text-amber-400">
                  <strong>OCR requires AI configuration.</strong> Image files need an AI provider configured in Settings to extract text.
                  Alternatively, paste the text manually in the "Paste Text" tab.
                </div>
              )}
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content based on mode */}
        {mode === "text" ? (
          <div className="space-y-4">
            <div className="bg-surface-container-lowest border border-border rounded-xl p-6 space-y-4">
              <label htmlFor="advert-text" className="block text-sm font-semibold text-on-surface">
                Paste Job Advertisement Text
              </label>
              <textarea
                id="advert-text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Paste the complete job advertisement here including title, employer, requirements, responsibilities, and application instructions…"
                rows={16}
                className="w-full px-4 py-3 rounded-lg border border-border bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-y"
                required
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant font-mono">
                  {text.length} characters
                </span>
                <button
                  onClick={handleTextSubmit}
                  disabled={submitting || !text.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded bg-primary text-white text-sm font-semibold hover:bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analysing…</span>
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4" />
                      <span>Import & Analyse</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Bot className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-700 dark:text-blue-400">
                  <strong>AI-Enhanced Analysis</strong>
                  <p className="mt-1">Text will be automatically analysed to extract structured requirements. If AI is configured in Settings, analysis will be enhanced with machine learning.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragging
                  ? "border-primary bg-primary/5"
                  : file
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-border hover:border-primary/50 bg-surface-container-lowest"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />

              {file ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto">
                    {file.name.toLowerCase().endsWith('.pdf') ? (
                      <File className="w-8 h-8 text-emerald-600" />
                    ) : file.name.match(/\.(png|jpg|jpeg|webp)$/) ? (
                      <Image className="w-8 h-8 text-emerald-600" />
                    ) : (
                      <FileText className="w-8 h-8 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-on-surface">{file.name}</p>
                    <p className="text-xs text-on-surface-variant font-mono mt-1">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setFile(null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-xs font-mono text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                    <button
                      onClick={handleFileSubmit}
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-primary text-white text-sm font-semibold hover:bg-tertiary transition-colors disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Processing…</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Upload & Analyse</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-on-surface">Drop file here or click to browse</p>
                    <p className="text-xs text-on-surface-variant font-mono mt-1">
                      Supported: {supportedTypes.join(", ")} · Max 10 MB
                    </p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded border border-primary text-primary text-sm font-semibold hover:bg-primary/5 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Browse Files</span>
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700 dark:text-amber-400">
                  <strong>File Type Support</strong>
                  <p className="mt-1">
                    <strong>PDF</strong> - Extracts text from searchable PDFs directly.<br/>
                    <strong>Images (PNG/JPG/WEBP)</strong> - Requires AI OCR provider configured in Settings.<br/>
                    <strong>TXT</strong> - Plain text extraction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel */}
        <div className="flex justify-end pt-4 border-t border-border">
          <Link
            href="/manage/career/adverts"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded border border-border text-sm font-mono text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </Link>
        </div>
      </div>
    </CMSLayout>
  );
}