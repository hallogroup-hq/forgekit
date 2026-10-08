/**
 * Quotation & Cost Estimate Engine
 * Computes deliverables pricing, milestone payment schedules, validity windows,
 * and formats clean proposals for Markdown, Plain Text, and Print.
 */

export interface QuotationLineItem {
  id: string;
  deliverable: string;
  units: number; // e.g. hours, days, items
  rate: number;
}

export interface QuotationMilestone {
  id: string;
  name: string;
  percentage: number;
}

export interface QuotationParty {
  name: string;
  email: string;
  company: string;
  address: string;
}

export interface QuotationData {
  quotationNumber: string;
  title: string;
  issueDate: string;
  validUntil: string;
  currencySymbol: string;
  provider: QuotationParty;
  client: QuotationParty;
  scopeSummary: string;
  items: QuotationLineItem[];
  milestones: QuotationMilestone[];
  taxPercent: number;
  discountAmount: number;
  terms: string;
}

export interface QuotationTotals {
  lineTotals: { id: string; amount: number }[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  milestoneAllocations: { id: string; name: string; percentage: number; amount: number }[];
}

export function roundPrice(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export function formatPrice(amount: number, symbol: string = "$"): string {
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}

/**
 * Calculates line totals, subtotal, tax, discounts, and milestone dollar distributions.
 */
export function calculateQuotationTotals(
  items: QuotationLineItem[],
  taxPercent: number = 0,
  discountAmount: number = 0,
  milestones: QuotationMilestone[] = []
): QuotationTotals {
  const lineTotals = items.map((item) => {
    const units = Math.max(0, item.units);
    const rate = Math.max(0, item.rate);
    return {
      id: item.id,
      amount: roundPrice(units * rate),
    };
  });

  const subtotal = roundPrice(
    lineTotals.reduce((acc, cur) => acc + cur.amount, 0)
  );

  const safeTax = Math.max(0, taxPercent);
  const taxAmount = roundPrice((subtotal * safeTax) / 100);

  const safeDiscount = Math.max(0, discountAmount);
  const total = roundPrice(Math.max(0, subtotal + taxAmount - safeDiscount));

  const milestoneAllocations = milestones.map((m) => {
    const pct = Math.max(0, m.percentage);
    const amount = roundPrice((total * pct) / 100);
    return {
      id: m.id,
      name: m.name,
      percentage: pct,
      amount,
    };
  });

  return {
    lineTotals,
    subtotal,
    taxAmount,
    discountAmount: safeDiscount,
    total,
    milestoneAllocations,
  };
}

/**
 * Formats quotation as a clean Markdown proposal document.
 */
export function formatQuotationMarkdown(
  data: QuotationData,
  totals: QuotationTotals
): string {
  const itemsMd = data.items
    .map((item, idx) => {
      const line = totals.lineTotals[idx]?.amount ?? item.units * item.rate;
      return `| ${idx + 1} | ${item.deliverable || "Deliverable"} | ${item.units} | ${formatPrice(item.rate, data.currencySymbol)} | ${formatPrice(line, data.currencySymbol)} |`;
    })
    .join("\n");

  const milestonesMd = totals.milestoneAllocations
    .map((m) => `- **${m.name}** (${m.percentage}%): ${formatPrice(m.amount, data.currencySymbol)}`)
    .join("\n");

  return `# Project Quotation: ${data.title}
**Quote No:** ${data.quotationNumber}  
**Date:** ${data.issueDate} | **Valid Until:** ${data.validUntil}

---

### Prepared By
**${data.provider.name || "Provider"}** (${data.provider.company})  
Email: ${data.provider.email}  
Address: ${data.provider.address}

### Prepared For
**${data.client.name || "Client"}** (${data.client.company})  
Email: ${data.client.email}  
Address: ${data.client.address}

---

### Scope of Work
> ${data.scopeSummary || "No summary provided."}

---

### Deliverables & Cost Breakdown
| # | Deliverable | Units / Hours | Rate | Total |
| :- | :--- | :---: | :---: | ----: |
${itemsMd}

- **Subtotal:** ${formatPrice(totals.subtotal, data.currencySymbol)}
- **Tax (${data.taxPercent}%):** ${formatPrice(totals.taxAmount, data.currencySymbol)}
- **Discount:** -${formatPrice(totals.discountAmount, data.currencySymbol)}
- **Estimated Total:** **${formatPrice(totals.total, data.currencySymbol)}**

---

### Milestone Payment Schedule
${milestonesMd || "_Payment due upon invoice delivery._"}

---

### Terms & Conditions
${data.terms || "Standard payment within 14 days."}
`;
}
