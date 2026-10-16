"use client";

import React, { useState, useRef } from "react";
import {
  Printer,
  Download,
  Plus,
  Trash2,
  Eye,
  Edit3,
  FileText,
  RotateCcw,
  Building2,
  User,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import {
  PayslipData,
  SalaryItem,
  calculateTotalEarnings,
  calculateTotalDeductions,
  calculateNetSalary,
  terbilangIndonesian,
  formatCurrencyIDR,
  getDefaultPayslipData,
} from "./engine";

export default function PayslipGenerator() {
  const [data, setData] = useState<PayslipData>(getDefaultPayslipData());
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleAddEarning = () => {
    const newItem: SalaryItem = {
      id: "e_" + Date.now(),
      label: "Tunjangan Lainnya",
      amount: 0,
    };
    setData((prev) => ({ ...prev, earnings: [...prev.earnings, newItem] }));
  };

  const handleRemoveEarning = (id: string) => {
    setData((prev) => ({
      ...prev,
      earnings: prev.earnings.filter((item) => item.id !== id),
    }));
  };

  const handleUpdateEarning = (id: string, field: "label" | "amount", value: string | number) => {
    setData((prev) => ({
      ...prev,
      earnings: prev.earnings.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleAddDeduction = () => {
    const newItem: SalaryItem = {
      id: "d_" + Date.now(),
      label: "Potongan Lainnya",
      amount: 0,
    };
    setData((prev) => ({ ...prev, deductions: [...prev.deductions, newItem] }));
  };

  const handleRemoveDeduction = (id: string) => {
    setData((prev) => ({
      ...prev,
      deductions: prev.deductions.filter((item) => item.id !== id),
    }));
  };

  const handleUpdateDeduction = (id: string, field: "label" | "amount", value: string | number) => {
    setData((prev) => ({
      ...prev,
      deductions: prev.deductions.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const totalEarnings = calculateTotalEarnings(data.earnings);
  const totalDeductions = calculateTotalDeductions(data.deductions);
  const netSalary = calculateNetSalary(data.earnings, data.deductions);
  const terbilangText = terbilangIndonesian(netSalary);

  return (
    <div className="space-y-6">
      {/* Top Controls Header (Hidden in Print) */}
      <div className="print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Slip Gaji (Payslip) Generator
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Buat slip gaji resmi dengan kalkulasi penghasilan, potongan BPJS/PPh21, dan cetak A4 rapi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 p-0.5 text-xs">
            <button
              onClick={() => setActiveTab("edit")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === "edit"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Edit3 size={13} />
              Edit Data
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === "preview"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Eye size={13} />
              A4 Preview
            </button>
          </div>

          {/* Template Selector */}
          <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-800 pl-2">
            {(["minimalist", "corporate", "compact"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setData((prev) => ({ ...prev, template: t }))}
                className={`px-2.5 py-1.5 rounded-md text-xs capitalize transition ${
                  data.template === t
                    ? "bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 font-medium"
                    : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Print / Save PDF Button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:opacity-90 transition shadow-sm ml-2"
          >
            <Printer size={14} />
            Cetak / Save PDF
          </button>
        </div>
      </div>

      {/* EDIT MODE (Print:hidden) */}
      {activeTab === "edit" && (
        <div className="print:hidden grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Company & Document Info */}
          <div className="space-y-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
              <Building2 size={16} />
              <span>Profil Perusahaan & Periode</span>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-zinc-500 block mb-1">Nama Perusahaan</label>
                <input
                  type="text"
                  value={data.companyName}
                  onChange={(e) => setData({ ...data, companyName: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                />
              </div>
              <div>
                <label className="text-zinc-500 block mb-1">Alamat Perusahaan</label>
                <input
                  type="text"
                  value={data.companyAddress}
                  onChange={(e) => setData({ ...data, companyAddress: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-zinc-500 block mb-1">No. Slip Gaji</label>
                  <input
                    type="text"
                    value={data.slipNumber}
                    onChange={(e) => setData({ ...data, slipNumber: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 block mb-1">Bulan</label>
                  <input
                    type="text"
                    value={data.periodMonth}
                    onChange={(e) => setData({ ...data, periodMonth: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 block mb-1">Tahun</label>
                  <input
                    type="text"
                    value={data.periodYear}
                    onChange={(e) => setData({ ...data, periodYear: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Employee Info */}
          <div className="space-y-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
              <User size={16} />
              <span>Data Karyawan</span>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-500 block mb-1">Nama Karyawan</label>
                  <input
                    type="text"
                    value={data.employeeName}
                    onChange={(e) => setData({ ...data, employeeName: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 block mb-1">ID Karyawan / NIK</label>
                  <input
                    type="text"
                    value={data.employeeId}
                    onChange={(e) => setData({ ...data, employeeId: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-zinc-500 block mb-1">Departemen</label>
                  <input
                    type="text"
                    value={data.department}
                    onChange={(e) => setData({ ...data, department: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 block mb-1">Jabatan</label>
                  <input
                    type="text"
                    value={data.position}
                    onChange={(e) => setData({ ...data, position: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 block mb-1">Status</label>
                  <select
                    value={data.status}
                    onChange={(e) =>
                      setData({ ...data, status: e.target.value as PayslipData["status"] })
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  >
                    <option value="Tetap">Tetap</option>
                    <option value="Kontrak">Kontrak</option>
                    <option value="Probation">Probation</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Earnings (Penghasilan) */}
          <div className="space-y-3 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                Rincian Penghasilan (Earnings)
              </span>
              <button
                onClick={handleAddEarning}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <Plus size={12} /> Tambah Item
              </button>
            </div>
            <div className="space-y-2">
              {data.earnings.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => handleUpdateEarning(item.id, "label", e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    placeholder="Nama Komponen"
                  />
                  <input
                    type="number"
                    value={item.amount || ""}
                    onChange={(e) =>
                      handleUpdateEarning(item.id, "amount", Number(e.target.value))
                    }
                    className="w-32 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-right"
                    placeholder="0"
                  />
                  <button
                    onClick={() => handleRemoveEarning(item.id)}
                    className="p-1 text-zinc-400 hover:text-zinc-600 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-800 font-medium text-zinc-900 dark:text-zinc-100">
              <span>Total Penghasilan Kotor</span>
              <span className="font-mono">{formatCurrencyIDR(totalEarnings)}</span>
            </div>
          </div>

          {/* Deductions (Potongan) */}
          <div className="space-y-3 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                Rincian Potongan (Deductions)
              </span>
              <button
                onClick={handleAddDeduction}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <Plus size={12} /> Tambah Item
              </button>
            </div>
            <div className="space-y-2">
              {data.deductions.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => handleUpdateDeduction(item.id, "label", e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    placeholder="Nama Potongan"
                  />
                  <input
                    type="number"
                    value={item.amount || ""}
                    onChange={(e) =>
                      handleUpdateDeduction(item.id, "amount", Number(e.target.value))
                    }
                    className="w-32 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-right"
                    placeholder="0"
                  />
                  <button
                    onClick={() => handleRemoveDeduction(item.id)}
                    className="p-1 text-zinc-400 hover:text-zinc-600 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-800 font-medium text-zinc-900 dark:text-zinc-100">
              <span>Total Potongan</span>
              <span className="font-mono">{formatCurrencyIDR(totalDeductions)}</span>
            </div>
          </div>
        </div>
      )}

      {/* A4 DOCUMENT PREVIEW & PRINT STAGE */}
      <div
        ref={printAreaRef}
        className={`bg-white text-zinc-900 p-8 sm:p-12 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 max-w-4xl mx-auto ${
          activeTab === "edit" ? "hidden print:block" : "block"
        }`}
      >
        {/* Document Header */}
        <div className="border-b-2 border-zinc-900 pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 uppercase">
              {data.companyName}
            </h1>
            <p className="text-xs text-zinc-600 mt-0.5">{data.companyAddress}</p>
            <p className="text-xs text-zinc-600">{data.companyPhone}</p>
          </div>
          <div className="text-left sm:text-right">
            <div className="inline-block px-3 py-1 bg-zinc-900 text-white text-xs font-bold tracking-wider uppercase mb-1">
              SLIP GAJI KARYAWAN
            </div>
            <p className="text-xs text-zinc-500 font-mono">{data.slipNumber}</p>
            <p className="text-xs font-medium text-zinc-800">
              Periode: {data.periodMonth} {data.periodYear}
            </p>
          </div>
        </div>

        {/* Employee Meta Grid */}
        <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-zinc-500 block">Nama Karyawan</span>
            <span className="font-bold text-zinc-900">{data.employeeName}</span>
          </div>
          <div>
            <span className="text-zinc-500 block">NIK / ID Karyawan</span>
            <span className="font-mono font-medium text-zinc-900">{data.employeeId}</span>
          </div>
          <div>
            <span className="text-zinc-500 block">Departemen & Jabatan</span>
            <span className="font-medium text-zinc-900">
              {data.department} — {data.position}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 block">Status Karyawan</span>
            <span className="font-medium text-zinc-900">{data.status}</span>
          </div>
        </div>

        {/* Double Column Breakdown: Earnings vs Deductions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {/* Earnings Table */}
          <div>
            <div className="bg-zinc-100 px-3 py-1.5 font-bold text-xs uppercase tracking-wide border-b border-zinc-300">
              A. Penghasilan
            </div>
            <table className="w-full text-xs">
              <tbody>
                {data.earnings.map((e) => (
                  <tr key={e.id} className="border-b border-zinc-200/60">
                    <td className="py-2 text-zinc-700">{e.label}</td>
                    <td className="py-2 text-right font-mono text-zinc-900">
                      {formatCurrencyIDR(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold border-t-2 border-zinc-900">
                  <td className="pt-2 text-zinc-900">Total Penghasilan (A)</td>
                  <td className="pt-2 text-right font-mono text-zinc-900">
                    {formatCurrencyIDR(totalEarnings)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Deductions Table */}
          <div>
            <div className="bg-zinc-100 px-3 py-1.5 font-bold text-xs uppercase tracking-wide border-b border-zinc-300">
              B. Potongan
            </div>
            <table className="w-full text-xs">
              <tbody>
                {data.deductions.map((d) => (
                  <tr key={d.id} className="border-b border-zinc-200/60">
                    <td className="py-2 text-zinc-700">{d.label}</td>
                    <td className="py-2 text-right font-mono text-zinc-900">
                      {formatCurrencyIDR(d.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold border-t-2 border-zinc-900">
                  <td className="pt-2 text-zinc-900">Total Potongan (B)</td>
                  <td className="pt-2 text-right font-mono text-zinc-900">
                    {formatCurrencyIDR(totalDeductions)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Take Home Pay Box */}
        <div className="bg-zinc-900 text-white p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
          <div>
            <span className="text-xs text-zinc-300 uppercase tracking-wider font-semibold">
              Gaji Bersih Diterima (Take Home Pay = A - B)
            </span>
            <p className="text-xs text-zinc-400 italic mt-0.5 capitalize">
              Terbilang: {terbilangText}
            </p>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight">
            {formatCurrencyIDR(netSalary)}
          </div>
        </div>

        {/* Footer Notes & Signatures */}
        <div className="grid grid-cols-2 gap-8 pt-4 border-t border-zinc-200 text-xs">
          <div>
            <p className="text-zinc-500 font-medium mb-1">Catatan:</p>
            <p className="text-zinc-700 text-[11px] leading-relaxed">{data.notes}</p>
          </div>
          <div className="flex flex-col items-end text-center">
            <span className="text-zinc-500 mb-12">
              Diterima pada {data.paymentDate}, Disetujui oleh:
            </span>
            <div className="border-b border-zinc-900 w-44 pb-1">
              <span className="font-bold text-zinc-900">{data.authorizedBy}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
