"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Download,
  Terminal,
  RefreshCw,
  FileText,
  Check,
  ArrowRight,
  Upload,
  FolderArchive,
  Loader2,
  Trash2,
  File,
  Code,
} from "lucide-react";
import confetti from "canvas-confetti";
import JSZip from "jszip";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile, formatFileSize } from "@/lib/utils";
import {
  RenameRuleOptions,
  batchRenameFiles,
  generateShellScript,
  generateMappingCsv,
} from "./engine";

const SAMPLE_FILES = `DSC_0042.JPG
DSC_0043.JPG
Screenshot 2026-10-08 at 14.22.01.png
Company Pitch Deck (Final Draft v3).pdf
Product Hero Banner [High-Res].webp
DSC_0044.JPG`;

export default function BulkFilenameBuilderGenerator() {
  const [mode, setMode] = useState<"files" | "text">("files");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [inputFiles, setInputFiles] = useState(SAMPLE_FILES);
  const [isZipping, setIsZipping] = useState(false);
  const [showAdvancedScripts, setShowAdvancedScripts] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Transformation rules
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [casing, setCasing] = useState<RenameRuleOptions["casing"]>("kebab-case");
  const [slugify, setSlugify] = useState(true);
  const [numbering, setNumbering] = useState(true);
  const [numberingStart, setNumberingStart] = useState(1);
  const [numberingDigits, setNumberingDigits] = useState(3);
  const [numberingPosition, setNumberingPosition] = useState<"prefix" | "suffix">("suffix");
  const [changeExtension, setChangeExtension] = useState("");

  const filenamesList = useMemo(() => {
    if (mode === "files" && uploadedFiles.length > 0) {
      return uploadedFiles.map((f) => f.name);
    }
    return inputFiles
      .split("\n")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
  }, [mode, uploadedFiles, inputFiles]);

  const options: RenameRuleOptions = useMemo(
    () => ({
      prefix: prefix || undefined,
      suffix: suffix || undefined,
      findText: findText || undefined,
      replaceText: replaceText || undefined,
      casing,
      slugify,
      numbering,
      numberingStart,
      numberingDigits,
      numberingPosition,
      changeExtension: changeExtension || undefined,
    }),
    [
      prefix,
      suffix,
      findText,
      replaceText,
      casing,
      slugify,
      numbering,
      numberingStart,
      numberingDigits,
      numberingPosition,
      changeExtension,
    ]
  );

  const mappings = useMemo(() => {
    return batchRenameFiles(filenamesList, options);
  }, [filenamesList, options]);

  const newNamesText = useMemo(() => {
    return mappings.map((m) => m.newName).join("\n");
  }, [mappings]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setUploadedFiles(filesArray);
      setMode("files");
      confetti({ particleCount: 20, spread: 45, origin: { y: 0.8 } });
    }
  };

  const handleClearFiles = () => {
    setUploadedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownloadZip = async () => {
    if (uploadedFiles.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const mapping = mappings[i];
        const targetName = mapping ? mapping.newName : file.name;
        zip.file(targetName, file);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `renamed-files-${Date.now().toString().slice(-4)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    } catch (err) {
      console.error("ZIP creation failed", err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadSh = () => {
    const script = generateShellScript(mappings, "sh");
    downloadFile(script, "rename.sh", "text/x-sh");
    confetti({ particleCount: 20, spread: 40, origin: { y: 0.8 } });
  };

  const handleDownloadBat = () => {
    const script = generateShellScript(mappings, "bat");
    downloadFile(script, "rename.bat", "application/x-bat");
    confetti({ particleCount: 20, spread: 40, origin: { y: 0.8 } });
  };

  const handleDownloadCsv = () => {
    const csv = generateMappingCsv(mappings);
    downloadFile(csv, "filename-mapping.csv", "text/csv");
    confetti({ particleCount: 20, spread: 40, origin: { y: 0.8 } });
  };

  return (
    <div className="space-y-6">
      {/* File Upload & Source Selector */}
      <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-850">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
              Input Source
            </span>
            <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-900 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setMode("files")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  mode === "files"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                Upload Real Files ({uploadedFiles.length})
              </button>
              <button
                type="button"
                onClick={() => setMode("text")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  mode === "text"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                Text List Mode
              </button>
            </div>
          </div>

          {mode === "files" && uploadedFiles.length > 0 && (
            <button
              type="button"
              onClick={handleClearFiles}
              className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Files</span>
            </button>
          )}

          {mode === "text" && (
            <button
              type="button"
              onClick={() => setInputFiles(SAMPLE_FILES)}
              className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Sample List</span>
            </button>
          )}
        </div>

        {mode === "files" ? (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="bulk-file-input"
            />
            <label
              htmlFor="bulk-file-input"
              className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {uploadedFiles.length > 0
                  ? `${uploadedFiles.length} files selected — Click to add or replace`
                  : "Drop files here or click to browse"}
              </div>
              <p className="text-xs text-zinc-500 max-w-md">
                Select photos, documents, or assets from your computer. Files are processed 100% locally in your browser.
              </p>
            </label>
          </div>
        ) : (
          <div>
            <textarea
              rows={5}
              value={inputFiles}
              onChange={(e) => setInputFiles(e.target.value)}
              placeholder="Paste filenames here (one per line)..."
              className="w-full p-3 font-mono text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-800 dark:text-zinc-200 leading-relaxed focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            />
          </div>
        )}
      </div>

      {/* Configuration & Rules Panel */}
      <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/50 space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
          Renaming Rules
        </span>

        {/* Rule Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 text-[11px] mb-1 font-medium">Add Prefix</label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g. vacation_"
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-mono"
            />
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 text-[11px] mb-1 font-medium">Add Suffix</label>
            <input
              type="text"
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
              placeholder="e.g. _web"
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-mono"
            />
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 text-[11px] mb-1 font-medium">Find Text</label>
            <input
              type="text"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              placeholder="Text to replace..."
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-mono"
            />
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 text-[11px] mb-1 font-medium">Replace With</label>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replacement..."
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-mono"
            />
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 text-[11px] mb-1 font-medium">Casing Normalization</label>
            <select
              value={casing}
              onChange={(e) => setCasing(e.target.value as RenameRuleOptions["casing"])}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
            >
              <option value="preserve">Preserve Original Casing</option>
              <option value="lowercase">lowercase</option>
              <option value="uppercase">UPPERCASE</option>
              <option value="kebab-case">kebab-case (web friendly)</option>
              <option value="snake_case">snake_case (code friendly)</option>
            </select>
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 text-[11px] mb-1 font-medium">Change Extension</label>
            <input
              type="text"
              value={changeExtension}
              onChange={(e) => setChangeExtension(e.target.value)}
              placeholder="e.g. webp (or leave blank)"
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-mono"
            />
          </div>

          <div className="flex items-center gap-3 pt-6">
            <label className="flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={slugify}
                onChange={(e) => setSlugify(e.target.checked)}
                className="rounded accent-zinc-900 dark:accent-zinc-100 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-500 w-4 h-4"
              />
              <span className="font-medium">Clean Spaces & Symbols</span>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <label className="flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={numbering}
                onChange={(e) => setNumbering(e.target.checked)}
                className="rounded accent-zinc-900 dark:accent-zinc-100 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-500 w-4 h-4"
              />
              <span className="font-medium">Number Sequence (001, 002)</span>
            </label>
          </div>
        </div>

        {/* Numbering Extra Controls */}
        {numbering && (
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span>Start Index:</span>
              <input
                type="number"
                min="0"
                value={numberingStart}
                onChange={(e) => setNumberingStart(Number(e.target.value))}
                className="w-14 text-center px-1.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-mono"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span>Padding Digits:</span>
              <input
                type="number"
                min="1"
                max="6"
                value={numberingDigits}
                onChange={(e) => setNumberingDigits(Number(e.target.value))}
                className="w-12 text-center px-1.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-mono"
              />
              <span className="text-zinc-400">(e.g. 001)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Position:</span>
              <select
                value={numberingPosition}
                onChange={(e) => setNumberingPosition(e.target.value as "prefix" | "suffix")}
                className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
              >
                <option value="suffix">End of Name (photo_001)</option>
                <option value="prefix">Start of Name (001_photo)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Primary Action Bar & Comparison */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Previewing {mappings.length} Files</span>
              {mode === "files" && uploadedFiles.length > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Ready to ZIP
                </span>
              )}
            </h3>
            <p className="text-xs text-zinc-500">
              {mode === "files" && uploadedFiles.length > 0
                ? "Click download below to get your renamed files packed in a single ZIP."
                : "Copy renamed names or download CSV mapping below."}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {mode === "files" && uploadedFiles.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={isZipping}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white disabled:opacity-50 text-white dark:text-zinc-950 shadow-xs cursor-pointer transition-colors"
              >
                {isZipping ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Packing ZIP...</span>
                  </>
                ) : (
                  <>
                    <FolderArchive className="w-4 h-4" />
                    <span>Download Renamed ZIP</span>
                  </>
                )}
              </button>
            )}

            <CopyButton text={newNamesText} label="Copy Names" size="sm" variant="secondary" />

            <button
              type="button"
              onClick={handleDownloadCsv}
              title="Download CSV mapping"
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 transition-colors"
            >
              CSV Map
            </button>

            <button
              type="button"
              onClick={() => setShowAdvancedScripts(!showAdvancedScripts)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 flex items-center gap-1 transition-colors"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Scripts</span>
            </button>
          </div>
        </div>

        {/* Optional Advanced Scripts Tray */}
        {showAdvancedScripts && (
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/40 text-xs flex items-center justify-between gap-4 animate-in fade-in">
            <div className="text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">CLI Scripts: </span>
              POSIX-escaped shell scripts for renaming existing files in your local terminal.
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadSh}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>rename.sh (Bash)</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadBat}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200"
              >
                rename.bat (Windows)
              </button>
            </div>
          </div>
        )}

        {/* Live Comparison Table */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-x-auto max-h-[420px] shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 sticky top-0 font-semibold text-zinc-500 text-[10px] uppercase">
                <th className="px-3 py-2.5 w-10 text-center">#</th>
                <th className="px-3 py-2.5">Original Filename</th>
                {mode === "files" && uploadedFiles.length > 0 && (
                  <th className="px-3 py-2.5 w-24">Size</th>
                )}
                <th className="px-2 py-2.5 w-8 text-center"></th>
                <th className="px-3 py-2.5">New Target Filename</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((m, idx) => {
                const fileObj = mode === "files" ? uploadedFiles[idx] : null;
                return (
                  <tr
                    key={idx}
                    className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 font-mono text-[11px]"
                  >
                    <td className="px-3 py-2.5 text-center text-zinc-400 text-[10px]">{idx + 1}</td>
                    <td
                      className="px-3 py-2.5 text-zinc-500 dark:text-zinc-400 truncate max-w-[220px]"
                      title={m.oldName}
                    >
                      {m.oldName}
                    </td>
                    {mode === "files" && uploadedFiles.length > 0 && (
                      <td className="px-3 py-2.5 text-zinc-400 text-[10px]">
                        {fileObj ? formatFileSize(fileObj.size) : "-"}
                      </td>
                    )}
                    <td className="px-2 py-2.5 text-center text-zinc-300">
                      <ArrowRight className="w-3.5 h-3.5 inline text-zinc-400" />
                    </td>
                    <td
                      className="px-3 py-2.5 font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[260px]"
                      title={m.newName}
                    >
                      {m.newName}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
