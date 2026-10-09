"use client";

import React, { useState, useMemo } from "react";
import { Plus, Trash2, Printer, Download, FileText } from "lucide-react";
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

export default function InvoiceReceiptGenerator() {
  const [invoiceNumber, setInvoiceNumber] = useState("INV-2026-001");
  const [issueDate, setIssueDate] = useState("2026-10-08");
  const [dueDate, setDueDate] = useState("2026-10-22");
  const [currencySymbol, setCurrencySymbol] = useState("$");

  React.useEffect(() => {
    setIssueDate(new Date().toISOString().split("T")[0]);
    setDueDate(new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]);
  }, []);

  // Sender details
  const [senderName, setSenderName] = useState("ForgeKit Digital Studio");
  const [senderEmail, setSenderEmail] = useState("billing@forgekit.dev");
  const [senderAddress, setSenderAddress] = useState("100 Innovation Way, Suite 400, San Francisco, CA");

  // Client details
  const [clientName, setClientName] = useState("Acme Global Ventures");
  const [clientEmail, setClientEmail] = useState("accounts@acmeglobal.com");
  const [clientAddress, setClientAddress] = useState("500 Tech Boulevard, New York, NY");

  // Items
  const [items, setItems] = useState<InvoiceLineItem[]>([
    { id: "1", description: "Design System Architecture & Tokens", quantity: 1, unitPrice: 2400 },
    { id: "2", description: "Fullstack Web Application Development (Sprint 1)", quantity: 40, unitPrice: 95 },
    { id: "3", description: "Cloud Infrastructure Setup & CI/CD", quantity: 1, unitPrice: 850 },
  ]);

  // Tax & Discount
  const [taxPercent, setTaxPercent] = useState(10);
  const [discountAmount, setDiscountAmount] = useState(150);
  const [notes, setNotes] = useState("Thank you for your partnership. Please remit payment via ACH or Wire within 14 days.");

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), description: "New Service / Item", quantity: 1, unitPrice: 100 },
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

  const invoiceData: InvoiceData = useMemo(() => ({
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
  }), [invoiceNumber, issueDate, dueDate, currencySymbol, senderName, senderEmail, senderAddress, clientName, clientEmail, clientAddress, items, taxPercent, discountAmount, notes]);

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
      {/* Top Controls */}
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
        </div>

        <div className="flex items-center gap-2">
          <CopyButton text={summaryText} label="Copy Text Summary" size="sm" variant="secondary" />
          <button
            type="button"
            onClick={handleDownloadJson}
            title="Download JSON schema"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
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

      {/* Printable Invoice Sheet */}
      <div className="p-8 md:p-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm space-y-8 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 uppercase">
              INVOICE
            </h2>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-zinc-400">Invoice No:</span>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="text-xs font-mono font-bold px-1.5 py-0.5 rounded border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-zinc-500 bg-transparent text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-zinc-400 block mb-0.5">Issue Date</span>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="font-medium bg-transparent text-zinc-800 dark:text-zinc-200"
              />
            </div>
            <div>
              <span className="text-zinc-400 block mb-0.5">Due Date</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="font-medium bg-transparent text-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>
        </div>

        {/* Sender & Recipient Addresses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          <div className="space-y-1.5">
            <span className="font-semibold text-zinc-400 uppercase tracking-wider block text-[10px]">
              Billed From:
            </span>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="font-bold text-sm text-zinc-900 dark:text-zinc-100 w-full bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-blue-500"
            />
            <input
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              className="text-zinc-500 w-full bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-blue-500"
            />
            <input
              type="text"
              value={senderAddress}
              onChange={(e) => setSenderAddress(e.target.value)}
              className="text-zinc-500 w-full bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <span className="font-semibold text-zinc-400 uppercase tracking-wider block text-[10px]">
              Bill To (Client):
            </span>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="font-bold text-sm text-zinc-900 dark:text-zinc-100 w-full bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-blue-500"
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

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5">Description</th>
                <th className="py-2.5 w-20 text-center">Qty</th>
                <th className="py-2.5 w-28 text-right">Unit Price</th>
                <th className="py-2.5 w-28 text-right">Amount</th>
                <th className="py-2.5 w-10 print:hidden"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const lineTotal = totals.lineTotals[idx]?.amount ?? item.quantity * item.unitPrice;
                return (
                  <tr key={item.id} className="border-b border-zinc-100 dark:border-zinc-900">
                    <td className="py-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        className="w-full bg-transparent text-zinc-800 dark:text-zinc-200 font-medium"
                      />
                    </td>
                    <td className="py-3 text-center">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                        className="w-14 text-center bg-transparent border border-zinc-200 dark:border-zinc-800 rounded py-0.5 text-zinc-800 dark:text-zinc-200"
                      />
                    </td>
                    <td className="py-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) })}
                        className="w-20 text-right bg-transparent border border-zinc-200 dark:border-zinc-800 rounded py-0.5 text-zinc-800 dark:text-zinc-200"
                      />
                    </td>
                    <td className="py-3 text-right font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatCurrencyAmount(lineTotal, currencySymbol)}
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
            <span>Add Item Row</span>
          </button>
        </div>

        {/* Summary Totals */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="w-full sm:w-1/2 space-y-2">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Payment Terms & Notes:
            </span>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs text-zinc-600 dark:text-zinc-400 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2"
            />
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between py-1 text-zinc-600 dark:text-zinc-400">
              <span>Subtotal:</span>
              <span className="font-mono font-medium">{formatCurrencyAmount(totals.subtotal, currencySymbol)}</span>
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
              <span className="font-mono">{formatCurrencyAmount(totals.taxAmount, currencySymbol)}</span>
            </div>

            <div className="flex justify-between items-center py-1 text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-1">
                <span>Discount:</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-16 text-right py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs"
                />
              </div>
              <span className="font-mono text-rose-500">-{formatCurrencyAmount(totals.discountAmount, currencySymbol)}</span>
            </div>

            <div className="flex justify-between py-2 border-t-2 border-zinc-900 dark:border-zinc-100 font-bold text-sm text-zinc-900 dark:text-zinc-100">
              <span>Total Balance Due:</span>
              <span className="font-mono text-base">{formatCurrencyAmount(totals.total, currencySymbol)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
