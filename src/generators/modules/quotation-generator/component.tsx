"use client";

import React, { useState, useMemo } from "react";
import { Plus, Trash2, Printer, Download, FileText, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";
import {
  QuotationLineItem,
  QuotationMilestone,
  QuotationData,
  calculateQuotationTotals,
  formatPrice,
  formatQuotationMarkdown,
} from "./engine";

export default function QuotationGenerator() {
  const [quotationNumber, setQuotationNumber] = useState("EST-2026-042");
  const [title, setTitle] = useState("Full-Stack Platform Engineering & UI Redesign");
  const [issueDate, setIssueDate] = useState("2026-10-08");
  const [validUntil, setValidUntil] = useState("2026-11-08");
  const [currencySymbol, setCurrencySymbol] = useState("$");

  React.useEffect(() => {
    setIssueDate(new Date().toISOString().split("T")[0]);
    setValidUntil(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);
  }, []);

  // Provider
  const [providerName, setProviderName] = useState("Sarah Jenkins");
  const [providerEmail, setProviderEmail] = useState("sarah@forgekit.dev");
  const [providerCompany, setProviderCompany] = useState("ForgeKit Labs Studio");
  const [providerAddress, setProviderAddress] = useState("100 Innovation Way, San Francisco, CA");

  // Client
  const [clientName, setClientName] = useState("David Vance");
  const [clientEmail, setClientEmail] = useState("david@horizonscale.io");
  const [clientCompany, setClientCompany] = useState("Horizon Scale Inc.");
  const [clientAddress, setClientAddress] = useState("450 Market Street, New York, NY");

  const [scopeSummary, setScopeSummary] = useState(
    "Design and implement responsive Next.js application, Postgres data pipeline, and secure user authentication flow with automated CI/CD deployment."
  );

  // Line items
  const [items, setItems] = useState<QuotationLineItem[]>([
    { id: "1", deliverable: "Product Architecture & System Specifications", units: 20, rate: 120 },
    { id: "2", deliverable: "Interactive Design System & Component Library", units: 35, rate: 110 },
    { id: "3", deliverable: "Core API Engineering & Database Schema", units: 45, rate: 125 },
    { id: "4", deliverable: "QA Testing & Staging Environment Deployment", units: 15, rate: 100 },
  ]);

  // Milestones
  const [milestones, setMilestones] = useState<QuotationMilestone[]>([
    { id: "1", name: "Project Kickoff Deposit", percentage: 40 },
    { id: "2", name: "Beta Release & Demo", percentage: 40 },
    { id: "3", name: "Final Acceptance & Code Handover", percentage: 20 },
  ]);

  const [taxPercent, setTaxPercent] = useState(8.5);
  const [discountAmount, setDiscountAmount] = useState(250);
  const [terms, setTerms] = useState(
    "Estimate valid for 30 days. Work begins upon receipt of initial deposit. Revisions beyond scope billed at standard hourly rates."
  );

  const [activeTab, setActiveTab] = useState<"sheet" | "markdown">("sheet");

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), deliverable: "New Deliverable", units: 10, rate: 100 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, updates: Partial<QuotationLineItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const addMilestone = () => {
    setMilestones((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "Milestone", percentage: 10 },
    ]);
  };

  const removeMilestone = (id: string) => {
    if (milestones.length <= 1) return;
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const updateMilestone = (id: string, updates: Partial<QuotationMilestone>) => {
    setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  // Calculations
  const totals = useMemo(() => {
    return calculateQuotationTotals(items, taxPercent, discountAmount, milestones);
  }, [items, taxPercent, discountAmount, milestones]);

  const quoteData: QuotationData = useMemo(() => ({
    quotationNumber,
    title,
    issueDate,
    validUntil,
    currencySymbol,
    provider: { name: providerName, email: providerEmail, company: providerCompany, address: providerAddress },
    client: { name: clientName, email: clientEmail, company: clientCompany, address: clientAddress },
    scopeSummary,
    items,
    milestones,
    taxPercent,
    discountAmount,
    terms,
  }), [quotationNumber, title, issueDate, validUntil, currencySymbol, providerName, providerEmail, providerCompany, providerAddress, clientName, clientEmail, clientCompany, clientAddress, scopeSummary, items, milestones, taxPercent, discountAmount, terms]);

  const markdownQuote = useMemo(() => {
    return formatQuotationMarkdown(quoteData, totals);
  }, [quoteData, totals]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMd = () => {
    downloadFile(markdownQuote, `${quotationNumber.toLowerCase()}-quote.md`, "text/markdown");
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 print:hidden">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Currency:
          </label>
          <select
            value={currencySymbol}
            onChange={(e) => setCurrencySymbol(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
          >
            <option value="$">USD ($)</option>
            <option value="Rp ">IDR (Rp)</option>
            <option value="€">EUR (€)</option>
            <option value="£">GBP (£)</option>
            <option value="S$">SGD (S$)</option>
            <option value="¥">JPY / CNY (¥)</option>
          </select>

          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg ml-2">
            <button
              onClick={() => setActiveTab("sheet")}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                activeTab === "sheet"
                  ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              Proposal Sheet
            </button>
            <button
              onClick={() => setActiveTab("markdown")}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                activeTab === "markdown"
                  ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              Markdown View
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CopyButton text={markdownQuote} label="Copy Markdown Proposal" size="sm" variant="secondary" />
          <button
            type="button"
            onClick={handleDownloadMd}
            title="Download .md document"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>.md</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {activeTab === "sheet" ? (
        /* Printable Proposal Document */
        <div className="p-8 md:p-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm space-y-8 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                PROJECT ESTIMATE & QUOTATION
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Project Title"
                className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 w-full bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-zinc-500"
              />
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-zinc-400">Quote Reference:</span>
                <input
                  type="text"
                  value={quotationNumber}
                  onChange={(e) => setQuotationNumber(e.target.value)}
                  className="text-xs font-mono font-bold px-1.5 py-0.5 rounded border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-zinc-500 bg-transparent text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-zinc-400 block mb-0.5 text-[11px]">Date Issued</span>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="font-medium bg-transparent text-zinc-800 dark:text-zinc-200"
                />
              </div>
              <div>
                <span className="text-zinc-400 block mb-0.5 text-[11px]">Valid Until</span>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="font-medium bg-transparent text-zinc-800 dark:text-zinc-200"
                />
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
            <div className="space-y-1.5">
              <span className="font-semibold text-zinc-400 uppercase tracking-wider block text-[10px]">
                Prepared By (Provider):
              </span>
              <input
                type="text"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                className="font-bold text-sm text-zinc-900 dark:text-zinc-100 w-full bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-blue-500"
              />
              <input
                type="text"
                value={providerCompany}
                onChange={(e) => setProviderCompany(e.target.value)}
                placeholder="Company"
                className="text-zinc-600 dark:text-zinc-400 w-full bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-blue-500"
              />
              <input
                type="email"
                value={providerEmail}
                onChange={(e) => setProviderEmail(e.target.value)}
                className="text-zinc-500 w-full bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-blue-500"
              />
              <input
                type="text"
                value={providerAddress}
                onChange={(e) => setProviderAddress(e.target.value)}
                className="text-zinc-500 w-full bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <span className="font-semibold text-zinc-400 uppercase tracking-wider block text-[10px]">
                Prepared For (Client):
              </span>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="font-bold text-sm text-zinc-900 dark:text-zinc-100 w-full bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-blue-500"
              />
              <input
                type="text"
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
                placeholder="Client Organization"
                className="text-zinc-600 dark:text-zinc-400 w-full bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-blue-500"
              />
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="text-zinc-500 w-full bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-blue-500"
              />
              <input
                type="text"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                className="text-zinc-500 w-full bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Scope Statement */}
          <div className="space-y-1.5">
            <span className="font-semibold text-zinc-400 uppercase tracking-wider block text-[10px]">
              Scope of Work Summary:
            </span>
            <textarea
              rows={2}
              value={scopeSummary}
              onChange={(e) => setScopeSummary(e.target.value)}
              className="w-full text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800"
            />
          </div>

          {/* Deliverables Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5">Deliverable Description</th>
                  <th className="py-2.5 w-24 text-center">Units / Hrs</th>
                  <th className="py-2.5 w-28 text-right">Unit Rate</th>
                  <th className="py-2.5 w-28 text-right">Amount</th>
                  <th className="py-2.5 w-10 print:hidden"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const lineTotal = totals.lineTotals[idx]?.amount ?? item.units * item.rate;
                  return (
                    <tr key={item.id} className="border-b border-zinc-100 dark:border-zinc-900">
                      <td className="py-3">
                        <input
                          type="text"
                          value={item.deliverable}
                          onChange={(e) => updateItem(item.id, { deliverable: e.target.value })}
                          className="w-full bg-transparent text-zinc-800 dark:text-zinc-200 font-medium"
                        />
                      </td>
                      <td className="py-3 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.units}
                          onChange={(e) => updateItem(item.id, { units: Number(e.target.value) })}
                          className="w-16 text-center bg-transparent border border-zinc-200 dark:border-zinc-800 rounded py-0.5 text-zinc-800 dark:text-zinc-200"
                        />
                      </td>
                      <td className="py-3 text-right">
                        <input
                          type="number"
                          min="0"
                          step="5"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, { rate: Number(e.target.value) })}
                          className="w-20 text-right bg-transparent border border-zinc-200 dark:border-zinc-800 rounded py-0.5 text-zinc-800 dark:text-zinc-200"
                        />
                      </td>
                      <td className="py-3 text-right font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatPrice(lineTotal, currencySymbol)}
                      </td>
                      <td className="py-3 text-center print:hidden">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length <= 1}
                          className="p-1 text-zinc-400 hover:text-rose-500 disabled:opacity-20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <button
              type="button"
              onClick={addItem}
              className="mt-3 flex items-center gap-1.5 text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:underline print:hidden cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Deliverable</span>
            </button>
          </div>

          {/* Milestone Schedule */}
          <div className="space-y-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Milestone Payment Schedule</span>
              </span>
              <button
                type="button"
                onClick={addMilestone}
                className="text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:underline print:hidden cursor-pointer"
              >
                + Add Milestone
              </button>
            </div>

            <div className="space-y-2">
              {milestones.map((m, idx) => {
                const alloc = totals.milestoneAllocations[idx]?.amount ?? 0;
                return (
                  <div key={m.id} className="flex items-center gap-2 text-xs">
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => updateMilestone(m.id, { name: e.target.value })}
                      className="flex-1 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={m.percentage}
                        onChange={(e) => updateMilestone(m.id, { percentage: Number(e.target.value) })}
                        className="w-14 text-center py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-mono"
                      />
                      <span className="text-zinc-500">%</span>
                    </div>
                    <span className="font-mono text-zinc-700 dark:text-zinc-300 w-28 text-right font-medium">
                      {formatPrice(alloc, currencySymbol)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMilestone(m.id)}
                      disabled={milestones.length <= 1}
                      className="p-1 text-zinc-400 hover:text-rose-500 disabled:opacity-20 print:hidden"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals & Terms */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="w-full sm:w-1/2 space-y-2">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Terms & Acceptance Conditions:
              </span>
              <textarea
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full text-xs text-zinc-600 dark:text-zinc-400 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2"
              />
            </div>

            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between py-1 text-zinc-600 dark:text-zinc-400">
                <span>Deliverables Subtotal:</span>
                <span className="font-mono font-medium">{formatPrice(totals.subtotal, currencySymbol)}</span>
              </div>

              <div className="flex justify-between items-center py-1 text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-1">
                  <span>Tax (%):</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Number(e.target.value))}
                    className="w-14 text-center py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs"
                  />
                </div>
                <span className="font-mono">{formatPrice(totals.taxAmount, currencySymbol)}</span>
              </div>

              <div className="flex justify-between items-center py-1 text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-1">
                  <span>Discount:</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    className="w-16 text-right py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs"
                  />
                </div>
                <span className="font-mono text-rose-500">-{formatPrice(totals.discountAmount, currencySymbol)}</span>
              </div>

              <div className="flex justify-between py-2 border-t-2 border-zinc-900 dark:border-zinc-100 font-bold text-sm text-zinc-900 dark:text-zinc-100">
                <span>Total Project Estimate:</span>
                <span className="font-mono text-base">{formatPrice(totals.total, currencySymbol)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Markdown Preview */
        <div className="max-w-4xl mx-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-6 overflow-hidden">
          <pre className="font-mono text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
            {markdownQuote}
          </pre>
        </div>
      )}
    </div>
  );
}
