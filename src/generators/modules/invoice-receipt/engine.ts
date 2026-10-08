/**
 * Invoice & Receipt Studio Engine
 * Handles accurate line item arithmetic, rounding, multi-currency formatting,
 * and structured JSON / text export generation.
 */

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceParty {
  name: string;
  email: string;
  address: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currencySymbol: string;
  sender: InvoiceParty;
  client: InvoiceParty;
  items: InvoiceLineItem[];
  taxPercent: number;
  discountAmount: number;
  notes: string;
}

export interface InvoiceTotals {
  lineTotals: { id: string; amount: number }[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
}

/**
 * Rounds numbers to 2 decimal places to avoid floating point inaccuracies.
 */
export function roundCurrency(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates subtotal, tax, discount, and balance due.
 */
export function calculateInvoiceTotals(
  items: InvoiceLineItem[],
  taxPercent: number = 0,
  discountAmount: number = 0
): InvoiceTotals {
  const lineTotals = items.map((item) => {
    const qty = Math.max(0, item.quantity);
    const price = Math.max(0, item.unitPrice);
    return {
      id: item.id,
      amount: roundCurrency(qty * price),
    };
  });

  const subtotal = roundCurrency(
    lineTotals.reduce((acc, cur) => acc + cur.amount, 0)
  );

  const safeTaxPct = Math.max(0, taxPercent);
  const taxAmount = roundCurrency((subtotal * safeTaxPct) / 100);

  const safeDiscount = Math.max(0, discountAmount);
  const total = roundCurrency(Math.max(0, subtotal + taxAmount - safeDiscount));

  return {
    lineTotals,
    subtotal,
    taxAmount,
    discountAmount: safeDiscount,
    total,
  };
}

export const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "¥", "IDR", "RP", "KRW", "₩", "VND", "₫"]);

export function isZeroDecimalCurrency(symbolOrCode: string): boolean {
  const norm = symbolOrCode.trim().toUpperCase();
  return ZERO_DECIMAL_CURRENCIES.has(norm) || ZERO_DECIMAL_CURRENCIES.has(symbolOrCode.trim());
}

/**
 * Formats a numeric amount with the chosen currency symbol, adhering to standard decimal conventions.
 */
export function formatCurrencyAmount(amount: number, symbol: string = "$"): string {
  const isZeroDec = isZeroDecimalCurrency(symbol);
  const decimals = isZeroDec ? 0 : 2;
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${symbol}${formatted}`;
}

/**
 * Generates structured summary in plain text suitable for email/messaging.
 */
export function generateInvoiceSummaryText(
  data: InvoiceData,
  totals: InvoiceTotals
): string {
  const itemsText = data.items
    .map((item, idx) => {
      const line = totals.lineTotals[idx]?.amount ?? item.quantity * item.unitPrice;
      return `${idx + 1}. ${item.description || "Item"} | Qty: ${item.quantity} x ${formatCurrencyAmount(item.unitPrice, data.currencySymbol)} = ${formatCurrencyAmount(line, data.currencySymbol)}`;
    })
    .join("\n");

  return `========================================
INVOICE ${data.invoiceNumber}
Date: ${data.issueDate} | Due: ${data.dueDate}
========================================

FROM:
${data.sender.name || "Sender"}
${data.sender.email}
${data.sender.address}

BILL TO:
${data.client.name || "Client"}
${data.client.email}
${data.client.address}

----------------------------------------
LINE ITEMS:
${itemsText}
----------------------------------------
Subtotal: ${formatCurrencyAmount(totals.subtotal, data.currencySymbol)}
Tax (${data.taxPercent}%): ${formatCurrencyAmount(totals.taxAmount, data.currencySymbol)}
Discount: -${formatCurrencyAmount(totals.discountAmount, data.currencySymbol)}
TOTAL BALANCE DUE: ${formatCurrencyAmount(totals.total, data.currencySymbol)}
----------------------------------------
Notes: ${data.notes || "None"}
========================================`;
}
