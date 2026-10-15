"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, Printer, Download, FileText, Check, Eye, Edit3, LayoutTemplate } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";
import {
  InvoiceLineItem,
  InvoiceData,
  calculateInvoiceTotals,
  formatCurrencyAmount,
  generateInvoiceSummaryText,
} from "./engine";

export type InvoiceTemplate = "minimalist" | "corporate" | "creative";

export default function InvoiceReceiptGenerator() {
  const [template, setTemplate] = useState<InvoiceTemplate>("minimalist");
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");

  const [invoiceNumber, setInvoiceNumber] = useState("INV-2026-001");
  const [issueDate, setIssueDate] = useState("2026-10-08");
  const [dueDate, setDueDate] = useState("2026-10-22");
  const [currencySymbol, setCurrencySymbol] = useState("Rp ");

  useEffect(() => {
    setIssueDate(new Date().toISOString().split("T")[0]);
    setDueDate(new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]);
  }, []);

  // Sender details
  const [senderName, setSenderName] = useState("ForgeKit Digital Studio");
  const [senderEmail, setSenderEmail] = useState("billing@forgekit.dev");
  const [senderAddress, setSenderAddress] = useState("Jl. Jenderal Sudirman No. 45, Jakarta Selatan");

  // Client details
  const [clientName, setClientName] = useState("PT Maju Teknologi Nusantara");
  const [clientEmail, setClientEmail] = useState("finance@majutekno.co.id");
  const [clientAddress, setClientAddress] = useState("Gedung Cyber 2 Lantai 18, Jakarta");

  // Items
  const [items, setItems] = useState<InvoiceLineItem[]>([
    { id: "1", description: "Design System Architecture & UI Tokens", quantity: 1, unitPrice: 12500000 },
    { id: "2", description: "Fullstack Web Application Development (Sprint 1)", quantity: 1, unitPrice: 28000000 },
    { id: "3", description: "Cloud Infrastructure Setup, SSL & CI/CD", quantity: 1, unitPrice: 6500000 },
  ]);

  // Tax & Discount
  const [taxPercent, setTaxPercent] = useState(11);
  const [discountAmount, setDiscountAmount] = useState(1000000);
  const [notes, setNotes] = useState(
    "Pembayaran mohon ditransfer via Rekening Bank Mandiri: 123-00-9876543-1 a.n. ForgeKit Studio. Terima kasih atas kerja samanya."
  );

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), description: "Item / Jasa Baru", quantity: 1, unitPrice: 1000000 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, updates: Partial<InvoiceLineItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  // Computations via pure engine
  const totals = useMemo(() => {
    return calculateInvoiceTotals(items, taxPercent, discountAmount);
  }, [items, taxPercent, discountAmount]);

  const invoiceData: InvoiceData = useMemo(
    () => ({
      invoiceNumber,
      issueDate,
      dueDate,
      currencySymbol,
      sender: { name: senderName, email: senderEmail, address: senderAddress },
      client: { name: clientName, email: clientEmail, address: clientAddress },
      items,
      taxPercent,
      discountAmount,
      notes,
    }),
    [
      invoiceNumber,
      issueDate,
      dueDate,
      currencySymbol,
      senderName,
      senderEmail,
      senderAddress,
      clientName,
      clientEmail,
      clientAddress,
      items,
      taxPercent,
      discountAmount,
      notes,
    ]
  );

  const summaryText = useMemo(() => {
    return generateInvoiceSummaryText(invoiceData, totals);
  }, [invoiceData, totals]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const payload = JSON.stringify({ ...invoiceData, totals }, null, 2);
    downloadFile(payload, `${invoiceNumber.toLowerCase()}-data.json`, "application/json");
    confetti({ particleCount: 20, spread: 40, origin: { y: 0.8 } });
  };

  return (
    <div className="space-y-6">
      {/* Top Interactive Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70 print:hidden">
        {/* Left side: Currency & Template Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Currency */}
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
                  onClick={() => setTemplate(t.id as InvoiceTemplate)}
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
          {/* Edit vs Preview Toggle */}
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
          </div>

          <CopyButton text={summaryText} label="Salin Teks" size="sm" variant="secondary" />

          <button
            type="button"
            onClick={handleDownloadJson}
            title="Download JSON schema"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
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

      {/* DOCUMENT SHEET (Standard A4 Proportions) */}
      <div
        id="invoice-document-sheet"
        className={`w-full max-w-4xl mx-auto bg-white text-zinc-950 shadow-md rounded-xl transition-all print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full print:rounded-none ${
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
                {viewMode === "edit" ? (
                  <>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Nama Perusahaan / Studio"
                      className="text-lg font-bold text-zinc-900 w-full bg-transparent border-b border-zinc-200 focus:border-sky-500 outline-none pb-0.5 print:hidden"
                    />
                    <span className="hidden print:block text-lg font-bold text-zinc-900">{senderName}</span>
                    <input
                      type="email"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="Email"
                      className="text-xs text-zinc-500 w-full bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-sky-500 outline-none print:hidden"
                    />
                    <span className="hidden print:block text-xs text-zinc-500">{senderEmail}</span>
                    <input
                      type="text"
                      value={senderAddress}
                      onChange={(e) => setSenderAddress(e.target.value)}
                      placeholder="Alamat"
                      className="text-xs text-zinc-500 w-full bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-sky-500 outline-none print:hidden"
                    />
                    <span className="hidden print:block text-xs text-zinc-500">{senderAddress}</span>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-bold text-zinc-900">{senderName}</h2>
                    <p className="text-xs text-zinc-500">{senderEmail}</p>
                    <p className="text-xs text-zinc-500">{senderAddress}</p>
                  </>
                )}
              </div>

              <div className="text-left sm:text-right space-y-1">
                <h1 className="text-2xl font-black tracking-tight text-zinc-900 uppercase">INVOICE</h1>
                <div className="flex sm:justify-end items-center gap-1.5 text-xs text-zinc-600">
                  <span className="text-zinc-400">No:</span>
                  {viewMode === "edit" ? (
                    <>
                      <input
                        type="text"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        className="font-mono font-bold text-zinc-900 bg-transparent border-b border-zinc-200 focus:border-sky-500 text-left sm:text-right w-32 outline-none print:hidden"
                      />
                      <span className="hidden print:inline font-mono font-bold text-zinc-900">{invoiceNumber}</span>
                    </>
                  ) : (
                    <span className="font-mono font-bold text-zinc-900">{invoiceNumber}</span>
                  )}
                </div>
                <div className="text-xs text-zinc-500 flex sm:justify-end items-center gap-3 pt-1">
                  <div>
                    <span className="text-zinc-400 mr-1">Tgl:</span>
                    {viewMode === "edit" ? (
                      <>
                        <input
                          type="date"
                          value={issueDate}
                          onChange={(e) => setIssueDate(e.target.value)}
                          className="font-medium bg-transparent text-zinc-800 outline-none print:hidden"
                        />
                        <span className="hidden print:inline font-medium text-zinc-800">{issueDate}</span>
                      </>
                    ) : (
                      <span className="font-medium text-zinc-800">{issueDate}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-zinc-400 mr-1">Jatuh Tempo:</span>
                    {viewMode === "edit" ? (
                      <>
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="font-medium bg-transparent text-zinc-800 outline-none print:hidden"
                        />
                        <span className="hidden print:inline font-medium text-zinc-800">{dueDate}</span>
                      </>
                    ) : (
                      <span className="font-medium text-zinc-800">{dueDate}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To Recipient */}
            <div className="space-y-1 max-w-sm text-xs">
              <span className="font-bold text-zinc-400 uppercase tracking-wider block text-[10px]">
                Ditagihkan Kepada:
              </span>
              {viewMode === "edit" ? (
                <>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nama Klien / Perusahaan"
                    className="font-bold text-sm text-zinc-900 w-full bg-transparent border-b border-zinc-200 focus:border-sky-500 outline-none pb-0.5 print:hidden"
                  />
                  <span className="hidden print:block font-bold text-sm text-zinc-900">{clientName}</span>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="Email Klien"
                    className="text-zinc-500 w-full bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-sky-500 outline-none print:hidden"
                  />
                  <span className="hidden print:block text-zinc-500">{clientEmail}</span>
                  <input
                    type="text"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    placeholder="Alamat Klien"
                    className="text-zinc-500 w-full bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-sky-500 outline-none print:hidden"
                  />
                  <span className="hidden print:block text-zinc-500">{clientAddress}</span>
                </>
              ) : (
                <>
                  <p className="font-bold text-sm text-zinc-900">{clientName}</p>
                  <p className="text-zinc-500">{clientEmail}</p>
                  <p className="text-zinc-500">{clientAddress}</p>
                </>
              )}
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-zinc-900 text-zinc-600 font-bold uppercase text-[10px]">
                    <th className="py-2.5">Deskripsi Layanan / Item</th>
                    <th className="py-2.5 w-16 text-center">Qty</th>
                    <th className="py-2.5 w-28 text-right">Harga Satuan</th>
                    <th className="py-2.5 w-32 text-right">Jumlah</th>
                    <th className="py-2.5 w-10 print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {items.map((item, idx) => {
                    const lineTotal = totals.lineTotals[idx]?.amount ?? item.quantity * item.unitPrice;
                    return (
                      <tr key={item.id}>
                        <td className="py-3">
                          {viewMode === "edit" ? (
                            <>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => updateItem(item.id, { description: e.target.value })}
                                className="w-full bg-transparent text-zinc-900 font-medium outline-none focus:bg-zinc-50 px-1 py-0.5 rounded print:hidden"
                              />
                              <span className="hidden print:block text-zinc-900 font-medium">{item.description}</span>
                            </>
                          ) : (
                            <span className="text-zinc-900 font-medium">{item.description}</span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          {viewMode === "edit" ? (
                            <>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                                className="w-14 text-center bg-transparent border border-zinc-200 rounded py-0.5 text-zinc-900 outline-none print:hidden"
                              />
                              <span className="hidden print:inline text-zinc-900">{item.quantity}</span>
                            </>
                          ) : (
                            <span className="text-zinc-900">{item.quantity}</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          {viewMode === "edit" ? (
                            <>
                              <input
                                type="number"
                                min="0"
                                value={item.unitPrice}
                                onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) })}
                                className="w-24 text-right bg-transparent border border-zinc-200 rounded py-0.5 text-zinc-900 outline-none print:hidden"
                              />
                              <span className="hidden print:inline font-mono">
                                {formatCurrencyAmount(item.unitPrice, currencySymbol)}
                              </span>
                            </>
                          ) : (
                            <span className="font-mono">{formatCurrencyAmount(item.unitPrice, currencySymbol)}</span>
                          )}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-zinc-950">
                          {formatCurrencyAmount(lineTotal, currencySymbol)}
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
                  <span>Tambah Baris Item</span>
                </button>
              )}
            </div>

            {/* Totals & Notes */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pt-4 border-t border-zinc-200">
              <div className="w-full sm:w-1/2 space-y-1.5 text-xs">
                <span className="font-bold text-zinc-400 uppercase tracking-wider block text-[10px]">
                  Petunjuk Pembayaran & Catatan:
                </span>
                {viewMode === "edit" ? (
                  <>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full text-xs text-zinc-700 bg-transparent border border-zinc-200 rounded-lg p-2.5 outline-none focus:border-sky-500 print:hidden"
                    />
                    <p className="hidden print:block text-xs text-zinc-600 whitespace-pre-line leading-relaxed">{notes}</p>
                  </>
                ) : (
                  <p className="text-xs text-zinc-600 whitespace-pre-line leading-relaxed">{notes}</p>
                )}
              </div>

              <div className="w-full sm:w-80 space-y-2 text-xs">
                <div className="flex justify-between py-1 text-zinc-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold text-zinc-900">
                    {formatCurrencyAmount(totals.subtotal, currencySymbol)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 text-zinc-600">
                  <div className="flex items-center gap-1">
                    <span>Pajak (PPN):</span>
                    {viewMode === "edit" ? (
                      <>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={taxPercent}
                          onChange={(e) => setTaxPercent(Number(e.target.value))}
                          className="w-12 text-center py-0.5 rounded border border-zinc-200 bg-transparent text-xs print:hidden"
                        />
                        <span className="print:hidden">%</span>
                        <span className="hidden print:inline font-mono">({taxPercent}%)</span>
                      </>
                    ) : (
                      <span className="font-mono">({taxPercent}%)</span>
                    )}
                  </div>
                  <span className="font-mono">{formatCurrencyAmount(totals.taxAmount, currencySymbol)}</span>
                </div>

                <div className="flex justify-between items-center py-1 text-zinc-600">
                  <div className="flex items-center gap-1">
                    <span>Diskon:</span>
                    {viewMode === "edit" ? (
                      <input
                        type="number"
                        min="0"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(Number(e.target.value))}
                        className="w-20 text-right py-0.5 rounded border border-zinc-200 bg-transparent text-xs print:hidden"
                      />
                    ) : null}
                  </div>
                  <span className="font-mono text-zinc-700">
                    -{formatCurrencyAmount(totals.discountAmount, currencySymbol)}
                  </span>
                </div>

                <div className="flex justify-between py-3 border-t-2 border-zinc-900 font-black text-sm text-zinc-950">
                  <span>Total Tagihan:</span>
                  <span className="font-mono text-base font-black">
                    {formatCurrencyAmount(totals.total, currencySymbol)}
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
                <h1 className="text-2xl font-black tracking-wider uppercase">INVOICE RESMI</h1>
                <p className="text-xs text-zinc-300 font-mono mt-0.5">#{invoiceNumber}</p>
              </div>
              <div className="text-left sm:text-right text-xs space-y-1">
                <p className="font-bold text-sm text-zinc-100">{senderName}</p>
                <p className="text-zinc-300">{senderEmail}</p>
                <p className="text-zinc-400 text-[11px]">{senderAddress}</p>
              </div>
            </div>

            {/* Corporate Body Padding */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Info Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200">
                  <span className="font-bold text-zinc-500 uppercase text-[10px] tracking-wider block mb-1">
                    Ditujukan Kepada:
                  </span>
                  <p className="font-bold text-sm text-zinc-900">{clientName}</p>
                  <p className="text-zinc-600">{clientEmail}</p>
                  <p className="text-zinc-500">{clientAddress}</p>
                </div>

                <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Tanggal Terbit:</span>
                    <span className="font-bold text-zinc-800">{issueDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Batas Waktu:</span>
                    <span className="font-bold text-zinc-800">{dueDate}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-200 pt-1.5">
                    <span className="font-semibold text-zinc-700">Status Pembayaran:</span>
                    <span className="font-bold text-zinc-950 uppercase text-[11px]">Belum Lunas</span>
                  </div>
                </div>
              </div>

              {/* Items Table with Shaded Header */}
              <div className="border border-zinc-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-100 text-zinc-700 font-bold uppercase text-[10px] border-b border-zinc-200">
                    <tr>
                      <th className="py-2.5 px-3">Deskripsi Layanan / Item</th>
                      <th className="py-2.5 px-3 w-16 text-center">Kuantitas</th>
                      <th className="py-2.5 px-3 w-28 text-right">Harga Satuan</th>
                      <th className="py-2.5 px-3 w-32 text-right">Total</th>
                      <th className="py-2.5 px-2 w-10 print:hidden"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {items.map((item, idx) => {
                      const lineTotal = totals.lineTotals[idx]?.amount ?? item.quantity * item.unitPrice;
                      return (
                        <tr key={item.id} className={idx % 2 === 1 ? "bg-zinc-50/60" : "bg-white"}>
                          <td className="py-2.5 px-3 font-medium text-zinc-900">{item.description}</td>
                          <td className="py-2.5 px-3 text-center text-zinc-800">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-zinc-800">
                            {formatCurrencyAmount(item.unitPrice, currencySymbol)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-950">
                            {formatCurrencyAmount(lineTotal, currencySymbol)}
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
                <div className="w-full sm:w-1/2 p-3.5 rounded-lg border border-zinc-200 bg-zinc-50 text-xs space-y-1">
                  <span className="font-bold text-zinc-700 block text-[11px]">Instruksi Transfer & Catatan:</span>
                  <p className="text-zinc-600 whitespace-pre-line text-[11px] leading-relaxed">{notes}</p>
                </div>

                <div className="w-full sm:w-72 space-y-2 text-xs">
                  <div className="flex justify-between py-1 text-zinc-600">
                    <span>Subtotal</span>
                    <span className="font-mono font-semibold text-zinc-900">
                      {formatCurrencyAmount(totals.subtotal, currencySymbol)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-zinc-600">
                    <span>PPN ({taxPercent}%)</span>
                    <span className="font-mono">{formatCurrencyAmount(totals.taxAmount, currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-zinc-600">
                    <span>Diskon</span>
                    <span className="font-mono">-{formatCurrencyAmount(totals.discountAmount, currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between py-2.5 border-t-2 border-zinc-900 bg-zinc-100 px-3 rounded font-black text-sm text-zinc-950">
                    <span>Total Pembayaran</span>
                    <span className="font-mono text-base">{formatCurrencyAmount(totals.total, currencySymbol)}</span>
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
                  TAGIHAN PEMBAYARAN PROYEK
                </span>
                <h1 className="text-3xl font-black text-zinc-950 tracking-tight">{senderName}</h1>
                <p className="text-xs text-zinc-500 mt-1">{senderAddress}</p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-4xl font-black font-mono text-zinc-200 tracking-tighter block">
                  {invoiceNumber.split("-").pop() || "001"}
                </span>
                <span className="text-xs font-mono font-bold text-zinc-900 block mt-1">{invoiceNumber}</span>
                <span className="text-[11px] text-zinc-500 block">Jatuh Tempo: {dueDate}</span>
              </div>
            </div>

            {/* Accent divider bar */}
            <div className="h-1 w-full bg-zinc-900 rounded-full" />

            {/* Client info */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-0.5">KLIEN:</span>
                <p className="font-bold text-base text-zinc-900">{clientName}</p>
                <p className="text-zinc-500">{clientEmail}</p>
                <p className="text-zinc-500">{clientAddress}</p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-0.5">TANGGAL PENERBITAN:</span>
                <p className="font-semibold text-zinc-800">{issueDate}</p>
              </div>
            </div>

            {/* Clean Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-400 font-mono uppercase text-[10px]">
                    <th className="py-2">Item Pekerjaan</th>
                    <th className="py-2 w-16 text-center">Vol</th>
                    <th className="py-2 w-28 text-right">Tarif</th>
                    <th className="py-2 w-32 text-right">Total</th>
                    <th className="py-2 w-8 print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {items.map((item, idx) => {
                    const lineTotal = totals.lineTotals[idx]?.amount ?? item.quantity * item.unitPrice;
                    return (
                      <tr key={item.id}>
                        <td className="py-3 font-medium text-zinc-900">{item.description}</td>
                        <td className="py-3 text-center text-zinc-600">{item.quantity}</td>
                        <td className="py-3 text-right font-mono text-zinc-600">
                          {formatCurrencyAmount(item.unitPrice, currencySymbol)}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-zinc-950">
                          {formatCurrencyAmount(lineTotal, currencySymbol)}
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

            {/* Bottom summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pt-4 border-t border-zinc-200">
              <div className="w-full sm:w-1/2 space-y-1 text-xs">
                <span className="text-[10px] font-mono uppercase text-zinc-400 block">KETERANGAN:</span>
                <p className="text-zinc-600 whitespace-pre-line text-xs leading-relaxed">{notes}</p>
              </div>

              <div className="w-full sm:w-72 space-y-1.5 text-xs">
                <div className="flex justify-between py-1 text-zinc-500 font-mono">
                  <span>Subtotal</span>
                  <span>{formatCurrencyAmount(totals.subtotal, currencySymbol)}</span>
                </div>
                <div className="flex justify-between py-1 text-zinc-500 font-mono">
                  <span>Pajak PPN ({taxPercent}%)</span>
                  <span>{formatCurrencyAmount(totals.taxAmount, currencySymbol)}</span>
                </div>
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between py-1 text-zinc-500 font-mono">
                    <span>Potongan Diskon</span>
                    <span>-{formatCurrencyAmount(totals.discountAmount, currencySymbol)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 border-t-2 border-zinc-950 font-black text-base text-zinc-950">
                  <span>TOTAL AKHIR</span>
                  <span className="font-mono">{formatCurrencyAmount(totals.total, currencySymbol)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
