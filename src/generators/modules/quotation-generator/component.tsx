"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, Printer, Download, FileText, Check, Eye, Edit3, ShieldAlert } from "lucide-react";
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
  validateMilestones,
} from "./engine";

export type QuotationTemplate = "minimalist" | "corporate" | "creative";

export default function QuotationGenerator() {
  const [template, setTemplate] = useState<QuotationTemplate>("minimalist");
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "markdown">("edit");

  const [quotationNumber, setQuotationNumber] = useState("QUO-2026-088");
  const [title, setTitle] = useState("Pengembangan Web Platform & Mobile App E-Commerce");
  const [issueDate, setIssueDate] = useState("2026-10-08");
  const [validUntil, setValidUntil] = useState("2026-11-08");
  const [currencySymbol, setCurrencySymbol] = useState("Rp ");

  useEffect(() => {
    setIssueDate(new Date().toISOString().split("T")[0]);
    setValidUntil(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);
  }, []);

  // Provider
  const [providerName, setProviderName] = useState("ForgeKit Digital Studio");
  const [providerEmail, setProviderEmail] = useState("partnership@forgekit.dev");
  const [providerCompany, setProviderCompany] = useState("ForgeKit Interactive Ltd");
  const [providerAddress, setProviderAddress] = useState("Jl. Jenderal Sudirman No. 45, Jakarta Selatan");

  // Client
  const [clientName, setClientName] = useState("Budi Pratama");
  const [clientEmail, setClientEmail] = useState("budi@pratamacorp.id");
  const [clientCompany, setClientCompany] = useState("PT Pratama Retail Indonesia");
  const [clientAddress, setClientAddress] = useState("Menara Astra Lt. 24, Jakarta Pusat");

  // Scope & Terms
  const [scopeSummary, setScopeSummary] = useState(
    "Pengembangan solusi e-commerce end-to-end mencakup arsitektur cloud serverless, integrasi payment gateway Midtrans/Xendit, dashboard inventory admin, dan aplikasi responsif."
  );
  const [terms, setTerms] = useState(
    "1. Penawaran berlaku 30 hari sejak tanggal penerbitan.\n2. Termasuk garansi bug 60 hari setelah go-live.\n3. Hak cipta source code diserahkan penuh kepada klien setelah pelunasan."
  );

  // Line items
  const [items, setItems] = useState<QuotationLineItem[]>([
    { id: "1", deliverable: "UI/UX Research, High-Fidelity Wireframes & Design System", units: 1, rate: 15000000 },
    { id: "2", deliverable: "Frontend Storefront & Shopping Cart (Next.js & Tailwind)", units: 1, rate: 32000000 },
    { id: "3", deliverable: "Backend API, Auth & Integrasi Payment Gateway", units: 1, rate: 25000000 },
    { id: "4", deliverable: "Admin CMS Dashboard & Cloud Deployment (AWS)", units: 1, rate: 18000000 },
  ]);

  // Payment Milestones
  const [milestones, setMilestones] = useState<QuotationMilestone[]>([
    { id: "1", name: "Down Payment (Kick-off Proyek)", percentage: 30 },
    { id: "2", name: "Persetujuan UI/UX & Prototipe Interaktif", percentage: 20 },
    { id: "3", name: "Beta Testing & UAT (User Acceptance Test)", percentage: 30 },
    { id: "4", name: "Peluncuran Publik / Go-Live & Serah Terima", percentage: 20 },
  ]);

  const [taxPercent, setTaxPercent] = useState(11);
  const [discountAmount, setDiscountAmount] = useState(5000000);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), deliverable: "Deliverable / Fitur Tambahan", units: 1, rate: 5000000 },
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
      { id: Date.now().toString(), name: "Termin Baru", percentage: 10 },
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

  const quoteData: QuotationData = useMemo(
    () => ({
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
    }),
    [
      quotationNumber,
      title,
      issueDate,
      validUntil,
      currencySymbol,
      providerName,
      providerEmail,
      providerCompany,
      providerAddress,
      clientName,
      clientEmail,
      clientCompany,
      clientAddress,
      scopeSummary,
      items,
      milestones,
      taxPercent,
      discountAmount,
      terms,
    ]
  );

  const markdownQuote = useMemo(() => {
    return formatQuotationMarkdown(quoteData, totals);
  }, [quoteData, totals]);

  const milestoneValidation = useMemo(() => {
    return validateMilestones(milestones);
  }, [milestones]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMd = () => {
    downloadFile(markdownQuote, `${quotationNumber.toLowerCase()}-quote.md`, "text/markdown");
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
  };

  return (
    <div className="space-y-6">
      {/* Top Interactive Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70 print:hidden">
        {/* Left side: Currency & Template Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Mata Uang:</span>
            <select
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer"
            >
              <option value="Rp ">IDR (Rp)</option>
              <option value="$">USD ($)</option>
              <option value="€">EUR (€)</option>
              <option value="£">GBP (£)</option>
              <option value="S$">SGD (S$)</option>
              <option value="¥">JPY (¥)</option>
            </select>
          </div>

          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />

          {/* Template Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Template:</span>
            <div className="flex items-center gap-1 bg-zinc-200/80 dark:bg-zinc-800 p-0.5 rounded-lg text-xs">
              {[
                { id: "minimalist", label: "Minimalist" },
                { id: "corporate", label: "Corporate" },
                { id: "creative", label: "Creative" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplate(t.id as QuotationTemplate)}
                  className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
                    template === t.id
                      ? "bg-white dark:bg-zinc-950 text-sky-500 font-bold shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right side: View Mode & Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-zinc-200/80 dark:bg-zinc-800 p-0.5 rounded-lg text-xs mr-2">
            <button
              type="button"
              onClick={() => setViewMode("edit")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-all cursor-pointer ${
                viewMode === "edit"
                  ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Form</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-all cursor-pointer ${
                viewMode === "preview"
                  ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Cetak</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("markdown")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-all cursor-pointer ${
                viewMode === "markdown"
                  ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Markdown</span>
            </button>
          </div>

          <CopyButton text={markdownQuote} label="Salin MD" size="sm" variant="secondary" />

          <button
            type="button"
            onClick={handleDownloadMd}
            title="Download file Markdown"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.md</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            title="Cetak langsung atau simpan menjadi file PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* MARKDOWN VIEW */}
      {viewMode === "markdown" && (
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 text-zinc-100 max-w-4xl mx-auto font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
          {markdownQuote}
        </div>
      )}

      {/* DOCUMENT SHEET (Always shown for preview & edit, and in print) */}
      <div
        id="quotation-document-sheet"
        className={`w-full max-w-4xl mx-auto bg-white text-zinc-950 shadow-md rounded-xl transition-all print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full print:rounded-none ${
          viewMode === "markdown" ? "hidden print:block" : "block"
        } ${
          template === "minimalist"
            ? "border border-zinc-200 p-8 md:p-12 space-y-8"
            : template === "corporate"
            ? "border border-zinc-300 overflow-hidden"
            : "border border-zinc-200 p-8 md:p-12 space-y-8 relative"
        }`}
      >
        {/* ============================================================== */}
        {/* TEMPLATE 1: MODERN MINIMALIST */}
        {/* ============================================================== */}
        {template === "minimalist" && (
          <div className="space-y-8">
            {/* Header: Brand & Meta */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-zinc-200">
              <div className="space-y-1 max-w-sm">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block">
                  PENAWARAN HARGA & PROPOSAL
                </span>
                {viewMode === "edit" ? (
                  <>
                    <input
                      type="text"
                      value={providerName}
                      onChange={(e) => setProviderName(e.target.value)}
                      placeholder="Nama Penyedia Jasa / Studio"
                      className="text-lg font-bold text-zinc-900 w-full bg-transparent border-b border-zinc-200 focus:border-sky-500 outline-none pb-0.5 print:hidden"
                    />
                    <span className="hidden print:block text-lg font-bold text-zinc-900">{providerName}</span>
                    <input
                      type="text"
                      value={providerAddress}
                      onChange={(e) => setProviderAddress(e.target.value)}
                      placeholder="Alamat"
                      className="text-xs text-zinc-500 w-full bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-sky-500 outline-none print:hidden"
                    />
                    <span className="hidden print:block text-xs text-zinc-500">{providerAddress}</span>
                    <input
                      type="email"
                      value={providerEmail}
                      onChange={(e) => setProviderEmail(e.target.value)}
                      placeholder="Email"
                      className="text-xs text-zinc-500 w-full bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-sky-500 outline-none print:hidden"
                    />
                    <span className="hidden print:block text-xs text-zinc-500">{providerEmail}</span>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-bold text-zinc-900">{providerName}</h2>
                    <p className="text-xs text-zinc-500">{providerAddress}</p>
                    <p className="text-xs text-zinc-500">{providerEmail}</p>
                  </>
                )}
              </div>

              <div className="text-left sm:text-right space-y-1">
                <h1 className="text-2xl font-black tracking-tight text-zinc-900 uppercase">QUOTATION</h1>
                <div className="flex sm:justify-end items-center gap-1.5 text-xs text-zinc-600">
                  <span className="text-zinc-400">No:</span>
                  {viewMode === "edit" ? (
                    <>
                      <input
                        type="text"
                        value={quotationNumber}
                        onChange={(e) => setQuotationNumber(e.target.value)}
                        className="font-mono font-bold text-zinc-900 bg-transparent border-b border-zinc-200 focus:border-sky-500 text-left sm:text-right w-36 outline-none print:hidden"
                      />
                      <span className="hidden print:inline font-mono font-bold text-zinc-900">{quotationNumber}</span>
                    </>
                  ) : (
                    <span className="font-mono font-bold text-zinc-900">{quotationNumber}</span>
                  )}
                </div>
                <div className="text-xs text-zinc-500 flex sm:justify-end items-center gap-3 pt-1">
                  <div>
                    <span className="text-zinc-400 mr-1">Tgl:</span>
                    <span className="font-medium text-zinc-800">{issueDate}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 mr-1">Berlaku s/d:</span>
                    <span className="font-medium text-zinc-800">{validUntil}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Title & Client Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-1.5">
                <span className="font-bold text-zinc-400 uppercase tracking-wider block text-[10px]">
                  Judul Proyek / Pengadaan:
                </span>
                {viewMode === "edit" ? (
                  <>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Judul Proyek"
                      className="font-bold text-sm text-zinc-900 w-full bg-transparent border-b border-zinc-200 focus:border-sky-500 outline-none pb-0.5 print:hidden"
                    />
                    <p className="hidden print:block font-bold text-sm text-zinc-900">{title}</p>
                  </>
                ) : (
                  <p className="font-bold text-sm text-zinc-900">{title}</p>
                )}
                {viewMode === "edit" ? (
                  <>
                    <textarea
                      rows={2}
                      value={scopeSummary}
                      onChange={(e) => setScopeSummary(e.target.value)}
                      placeholder="Ringkasan Ruang Lingkup"
                      className="text-xs text-zinc-600 w-full bg-transparent border border-zinc-200 rounded p-1.5 outline-none print:hidden"
                    />
                    <p className="hidden print:block text-xs text-zinc-600 leading-relaxed">{scopeSummary}</p>
                  </>
                ) : (
                  <p className="text-xs text-zinc-600 leading-relaxed">{scopeSummary}</p>
                )}
              </div>

              <div className="space-y-1 text-xs sm:text-right">
                <span className="font-bold text-zinc-400 uppercase tracking-wider block text-[10px]">
                  Disiapkan Untuk (Klien):
                </span>
                <p className="font-bold text-sm text-zinc-900">{clientName}</p>
                <p className="text-zinc-600 font-medium">{clientCompany}</p>
                <p className="text-zinc-500">{clientEmail}</p>
                <p className="text-zinc-500">{clientAddress}</p>
              </div>
            </div>

            {/* Deliverables Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-zinc-900 text-zinc-600 font-bold uppercase text-[10px]">
                    <th className="py-2.5">Deliverable / Rincian Layanan</th>
                    <th className="py-2.5 w-16 text-center">Qty</th>
                    <th className="py-2.5 w-28 text-right">Tarif Satuan</th>
                    <th className="py-2.5 w-32 text-right">Jumlah</th>
                    <th className="py-2.5 w-10 print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {items.map((item, idx) => {
                    const lineTotal = totals.lineTotals[idx]?.amount ?? item.units * item.rate;
                    return (
                      <tr key={item.id}>
                        <td className="py-3">
                          {viewMode === "edit" ? (
                            <>
                              <input
                                type="text"
                                value={item.deliverable}
                                onChange={(e) => updateItem(item.id, { deliverable: e.target.value })}
                                className="w-full bg-transparent text-zinc-900 font-medium outline-none focus:bg-zinc-50 px-1 py-0.5 rounded print:hidden"
                              />
                              <span className="hidden print:block text-zinc-900 font-medium">{item.deliverable}</span>
                            </>
                          ) : (
                            <span className="text-zinc-900 font-medium">{item.deliverable}</span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          {viewMode === "edit" ? (
                            <>
                              <input
                                type="number"
                                min="1"
                                value={item.units}
                                onChange={(e) => updateItem(item.id, { units: Number(e.target.value) })}
                                className="w-14 text-center bg-transparent border border-zinc-200 rounded py-0.5 text-zinc-900 outline-none print:hidden"
                              />
                              <span className="hidden print:inline text-zinc-900">{item.units}</span>
                            </>
                          ) : (
                            <span className="text-zinc-900">{item.units}</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          {viewMode === "edit" ? (
                            <>
                              <input
                                type="number"
                                min="0"
                                value={item.rate}
                                onChange={(e) => updateItem(item.id, { rate: Number(e.target.value) })}
                                className="w-24 text-right bg-transparent border border-zinc-200 rounded py-0.5 text-zinc-900 outline-none print:hidden"
                              />
                              <span className="hidden print:inline font-mono">
                                {formatPrice(item.rate, currencySymbol)}
                              </span>
                            </>
                          ) : (
                            <span className="font-mono">{formatPrice(item.rate, currencySymbol)}</span>
                          )}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-zinc-950">
                          {formatPrice(lineTotal, currencySymbol)}
                        </td>
                        <td className="py-3 text-center print:hidden">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            disabled={items.length <= 1}
                            className="p-1 text-zinc-400 hover:text-rose-500 disabled:opacity-20 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {viewMode === "edit" && (
                <button
                  type="button"
                  onClick={addItem}
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 print:hidden cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Baris Deliverable</span>
                </button>
              )}
            </div>

            {/* Milestones Payment Schedule */}
            <div className="space-y-3 pt-2">
              <span className="font-bold text-zinc-600 uppercase text-[10px] tracking-wider block">
                Jadwal Termin Pembayaran (Payment Milestones):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {milestones.map((m) => {
                  const mAmount = Math.round((totals.total * m.percentage) / 100);
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-200 bg-zinc-50"
                    >
                      <span className="text-zinc-800 font-medium truncate mr-2">{m.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700 font-bold">
                          {m.percentage}%
                        </span>
                        <span className="font-mono font-bold text-zinc-950">
                          {formatPrice(mAmount, currencySymbol)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Totals & Terms */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pt-4 border-t border-zinc-200">
              <div className="w-full sm:w-1/2 space-y-1.5 text-xs">
                <span className="font-bold text-zinc-400 uppercase tracking-wider block text-[10px]">
                  Ketentuan & Klausul Penawaran:
                </span>
                <p className="text-xs text-zinc-600 whitespace-pre-line leading-relaxed">{terms}</p>
              </div>

              <div className="w-full sm:w-80 space-y-2 text-xs">
                <div className="flex justify-between py-1 text-zinc-600">
                  <span>Subtotal Estimasi:</span>
                  <span className="font-mono font-semibold text-zinc-900">
                    {formatPrice(totals.subtotal, currencySymbol)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 text-zinc-600">
                  <span>Pajak PPN ({taxPercent}%):</span>
                  <span className="font-mono">{formatPrice(totals.taxAmount, currencySymbol)}</span>
                </div>

                <div className="flex justify-between items-center py-1 text-zinc-600">
                  <span>Potongan Diskon:</span>
                  <span className="font-mono text-zinc-700">
                    -{formatPrice(totals.discountAmount, currencySymbol)}
                  </span>
                </div>

                <div className="flex justify-between py-3 border-t-2 border-zinc-900 font-black text-sm text-zinc-950">
                  <span>Total Nilai Penawaran:</span>
                  <span className="font-mono text-base font-black">
                    {formatPrice(totals.total, currencySymbol)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TEMPLATE 2: CORPORATE CLASSIC */}
        {/* ============================================================== */}
        {template === "corporate" && (
          <div>
            {/* Header Navy/Slate Banner */}
            <div className="bg-zinc-900 text-white p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-black tracking-wider uppercase">SURAT PENAWARAN HARGA</h1>
                <p className="text-xs text-zinc-300 font-mono mt-0.5">No: {quotationNumber}</p>
                <p className="text-xs text-zinc-400 mt-1 font-semibold">{title}</p>
              </div>
              <div className="text-left sm:text-right text-xs space-y-1">
                <p className="font-bold text-sm text-zinc-100">{providerName}</p>
                <p className="text-zinc-300">{providerCompany}</p>
                <p className="text-zinc-400 text-[11px]">{providerAddress}</p>
              </div>
            </div>

            {/* Corporate Body Padding */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Info Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200">
                  <span className="font-bold text-zinc-500 uppercase text-[10px] tracking-wider block mb-1">
                    Klien / Penerima Penawaran:
                  </span>
                  <p className="font-bold text-sm text-zinc-900">{clientName}</p>
                  <p className="text-zinc-700 font-semibold">{clientCompany}</p>
                  <p className="text-zinc-500">{clientEmail}</p>
                  <p className="text-zinc-500">{clientAddress}</p>
                </div>

                <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Tanggal Penawaran:</span>
                    <span className="font-bold text-zinc-800">{issueDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Masa Berlaku Hingga:</span>
                    <span className="font-bold text-zinc-800">{validUntil}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-200 pt-1.5">
                    <span className="font-semibold text-zinc-700">Masa Garansi:</span>
                    <span className="font-bold text-zinc-950">60 Hari Pemeliharaan</span>
                  </div>
                </div>
              </div>

              {/* Scope Summary Box */}
              <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50 text-xs">
                <span className="font-bold text-zinc-700 uppercase text-[10px] block mb-1">Ruang Lingkup Proyek:</span>
                <p className="text-zinc-600 leading-relaxed">{scopeSummary}</p>
              </div>

              {/* Items Table with Shaded Header */}
              <div className="border border-zinc-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-100 text-zinc-700 font-bold uppercase text-[10px] border-b border-zinc-200">
                    <tr>
                      <th className="py-2.5 px-3">Rincian Deliverable / Lingkup Kerja</th>
                      <th className="py-2.5 px-3 w-16 text-center">Volume</th>
                      <th className="py-2.5 px-3 w-28 text-right">Biaya Satuan</th>
                      <th className="py-2.5 px-3 w-32 text-right">Subtotal</th>
                      <th className="py-2.5 px-2 w-10 print:hidden"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {items.map((item, idx) => {
                      const lineTotal = totals.lineTotals[idx]?.amount ?? item.units * item.rate;
                      return (
                        <tr key={item.id} className={idx % 2 === 1 ? "bg-zinc-50/60" : "bg-white"}>
                          <td className="py-2.5 px-3 font-medium text-zinc-900">{item.deliverable}</td>
                          <td className="py-2.5 px-3 text-center text-zinc-800">{item.units}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-zinc-800">
                            {formatPrice(item.rate, currencySymbol)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-950">
                            {formatPrice(lineTotal, currencySymbol)}
                          </td>
                          <td className="py-2.5 px-2 text-center print:hidden">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              disabled={items.length <= 1}
                              className="text-zinc-400 hover:text-rose-500 cursor-pointer disabled:opacity-20"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary Bottom */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
                <div className="w-full sm:w-1/2 space-y-3">
                  <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 text-xs">
                    <span className="font-bold text-zinc-700 block text-[11px] mb-1">Skema Termin Pembayaran:</span>
                    <div className="space-y-1">
                      {milestones.map((m) => (
                        <div key={m.id} className="flex justify-between text-[11px] text-zinc-600">
                          <span>{m.name}</span>
                          <span className="font-mono font-bold text-zinc-800">{m.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-[11px] text-zinc-500 whitespace-pre-line leading-relaxed">
                    <strong className="text-zinc-700">Syarat & Ketentuan:</strong>
                    <br />
                    {terms}
                  </div>
                </div>

                <div className="w-full sm:w-72 space-y-2 text-xs">
                  <div className="flex justify-between py-1 text-zinc-600">
                    <span>Estimasi Biaya</span>
                    <span className="font-mono font-semibold text-zinc-900">
                      {formatPrice(totals.subtotal, currencySymbol)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-zinc-600">
                    <span>PPN ({taxPercent}%)</span>
                    <span className="font-mono">{formatPrice(totals.taxAmount, currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-zinc-600">
                    <span>Diskon Khusus</span>
                    <span className="font-mono">-{formatPrice(totals.discountAmount, currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between py-2.5 border-t-2 border-zinc-900 bg-zinc-100 px-3 rounded font-black text-sm text-zinc-950">
                    <span>Total Investasi</span>
                    <span className="font-mono text-base">{formatPrice(totals.total, currencySymbol)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TEMPLATE 3: CREATIVE STUDIO */}
        {/* ============================================================== */}
        {template === "creative" && (
          <div className="space-y-8">
            {/* Bold Studio Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase block mb-1">
                  PENAWARAN PROYEK KREATIF
                </span>
                <h1 className="text-3xl font-black text-zinc-950 tracking-tight">{title}</h1>
                <p className="text-xs text-zinc-500 mt-1">Diajukan oleh {providerName} • {providerEmail}</p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-4xl font-black font-mono text-zinc-200 tracking-tighter block">
                  {quotationNumber.split("-").pop() || "088"}
                </span>
                <span className="text-xs font-mono font-bold text-zinc-900 block mt-1">{quotationNumber}</span>
                <span className="text-[11px] text-zinc-500 block">Berlaku s/d: {validUntil}</span>
              </div>
            </div>

            {/* Accent divider bar */}
            <div className="h-1 w-full bg-zinc-900 rounded-full" />

            {/* Client info & Scope */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-0.5">KLIEN:</span>
                <p className="font-bold text-base text-zinc-900">{clientName}</p>
                <p className="text-zinc-600 font-semibold">{clientCompany}</p>
                <p className="text-zinc-500">{clientEmail}</p>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-0.5">RINGKASAN LINGKUP:</span>
                <p className="text-zinc-600 leading-relaxed">{scopeSummary}</p>
              </div>
            </div>

            {/* Clean Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-400 font-mono uppercase text-[10px]">
                    <th className="py-2">Item Deliverable</th>
                    <th className="py-2 w-16 text-center">Vol</th>
                    <th className="py-2 w-28 text-right">Tarif</th>
                    <th className="py-2 w-32 text-right">Total</th>
                    <th className="py-2 w-8 print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {items.map((item, idx) => {
                    const lineTotal = totals.lineTotals[idx]?.amount ?? item.units * item.rate;
                    return (
                      <tr key={item.id}>
                        <td className="py-3 font-medium text-zinc-900">{item.deliverable}</td>
                        <td className="py-3 text-center text-zinc-600">{item.units}</td>
                        <td className="py-3 text-right font-mono text-zinc-600">
                          {formatPrice(item.rate, currencySymbol)}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-zinc-950">
                          {formatPrice(lineTotal, currencySymbol)}
                        </td>
                        <td className="py-3 text-center print:hidden">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            disabled={items.length <= 1}
                            className="text-zinc-300 hover:text-rose-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Milestones Chips */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block">TAHAPAN PEMBAYARAN:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {milestones.map((m) => (
                  <div key={m.id} className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50">
                    <span className="font-mono text-xs font-bold text-zinc-900 block">{m.percentage}%</span>
                    <span className="text-[11px] text-zinc-600 truncate block mt-0.5">{m.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pt-4 border-t border-zinc-200">
              <div className="w-full sm:w-1/2 space-y-1 text-xs">
                <span className="text-[10px] font-mono uppercase text-zinc-400 block">KLAUSUL KESEPAKATAN:</span>
                <p className="text-zinc-600 whitespace-pre-line text-xs leading-relaxed">{terms}</p>
              </div>

              <div className="w-full sm:w-72 space-y-1.5 text-xs">
                <div className="flex justify-between py-1 text-zinc-500 font-mono">
                  <span>Subtotal</span>
                  <span>{formatPrice(totals.subtotal, currencySymbol)}</span>
                </div>
                <div className="flex justify-between py-1 text-zinc-500 font-mono">
                  <span>PPN ({taxPercent}%)</span>
                  <span>{formatPrice(totals.taxAmount, currencySymbol)}</span>
                </div>
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between py-1 text-zinc-500 font-mono">
                    <span>Diskon</span>
                    <span>-{formatPrice(totals.discountAmount, currencySymbol)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 border-t-2 border-zinc-950 font-black text-base text-zinc-950">
                  <span>TOTAL PENAWARAN</span>
                  <span className="font-mono">{formatPrice(totals.total, currencySymbol)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
