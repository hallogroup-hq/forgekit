export interface SalaryItem {
  id: string;
  label: string;
  amount: number;
}

export interface PayslipData {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  slipNumber: string;
  periodMonth: string;
  periodYear: string;
  paymentDate: string;
  employeeName: string;
  employeeId: string;
  department: string;
  position: string;
  status: "Tetap" | "Kontrak" | "Probation" | "Freelance";
  earnings: SalaryItem[];
  deductions: SalaryItem[];
  notes: string;
  authorizedBy: string;
  template: "minimalist" | "corporate" | "compact";
}

export function calculateTotalEarnings(earnings: SalaryItem[]): number {
  return earnings.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}

export function calculateTotalDeductions(deductions: SalaryItem[]): number {
  return deductions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}

export function calculateNetSalary(earnings: SalaryItem[], deductions: SalaryItem[]): number {
  const totalEarn = calculateTotalEarnings(earnings);
  const totalDed = calculateTotalDeductions(deductions);
  return Math.max(0, totalEarn - totalDed);
}

export function formatCurrencyIDR(val: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);
}

/**
 * Converts numbers into Indonesian spelled-out words (Terbilang)
 */
export function terbilangIndonesian(n: number): string {
  const angka = Math.floor(Math.abs(n));
  if (angka === 0) return "Nol Rupiah";

  const satuan = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];

  function convertGroup(val: number): string {
    if (val < 12) {
      return satuan[val];
    } else if (val < 20) {
      return convertGroup(val - 10) + " Belas";
    } else if (val < 100) {
      return convertGroup(Math.floor(val / 10)) + " Puluh " + convertGroup(val % 10);
    } else if (val < 200) {
      return "Seratus " + convertGroup(val - 100);
    } else if (val < 1000) {
      return convertGroup(Math.floor(val / 100)) + " Ratus " + convertGroup(val % 100);
    } else if (val < 2000) {
      return "Seribu " + convertGroup(val - 1000);
    } else if (val < 1000000) {
      return convertGroup(Math.floor(val / 1000)) + " Ribu " + convertGroup(val % 1000);
    } else if (val < 1000000000) {
      return (
        convertGroup(Math.floor(val / 1000000)) +
        " Juta " +
        convertGroup(val % 1000000)
      );
    } else if (val < 1000000000000) {
      return (
        convertGroup(Math.floor(val / 1000000000)) +
        " Miliar " +
        convertGroup(val % 1000000000)
      );
    }
    return "";
  }

  const result = convertGroup(angka).replace(/\s+/g, " ").trim();
  return `${result} Rupiah`;
}

export function getDefaultPayslipData(): PayslipData {
  return {
    companyName: "PT Teknologi Mandiri Berkarya",
    companyAddress: "Jl. Sudirman Kav. 52-53, Senayan, Jakarta Selatan 12190",
    companyPhone: "+62 21 5088 9000",
    slipNumber: "SLIP/2026/10/0142",
    periodMonth: "Oktober",
    periodYear: "2026",
    paymentDate: "2026-10-25",
    employeeName: "Dimas Arya Pratama",
    employeeId: "EMP-2024-089",
    department: "Engineering",
    position: "Senior Frontend Engineer",
    status: "Tetap",
    earnings: [
      { id: "e1", label: "Gaji Pokok", amount: 15000000 },
      { id: "e2", label: "Tunjangan Jabatan", amount: 2500000 },
      { id: "e3", label: "Tunjangan Transport & Makan", amount: 1200000 },
      { id: "e4", label: "Insentif Proyek", amount: 1500000 },
    ],
    deductions: [
      { id: "d1", label: "BPJS Ketenagakerjaan (JHT + JP)", amount: 450000 },
      { id: "d2", label: "BPJS Kesehatan (1%)", amount: 150000 },
      { id: "d3", label: "PPh 21", amount: 650000 },
    ],
    notes: "Pembayaran gaji via transfer ke rekening BCA 8830192812 a.n Dimas Arya Pratama.",
    authorizedBy: "Hendra Wijaya (Finance Director)",
    template: "minimalist",
  };
}
