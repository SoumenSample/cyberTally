export type GstMode = "intra" | "inter"

export type GstSplit = {
  cgst: number
  sgst: number
  igst: number
  total: number
}

export type GstInvoiceSource = {
  invoiceType: string
  taxableValue: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  totalGst: number
  grandTotal: number
  reportSign?: number
}

export type GstBreakdownRow = {
  invoiceType: string
  count: number
  taxableValue: number
  cgst: number
  sgst: number
  igst: number
  totalTax: number
  grandTotal: number
}

export type GstReportSummary = {
  gstr1: {
    taxableValue: number
    cgst: number
    sgst: number
    igst: number
    documentCount: number
  }
  gstr3b: {
    outwardTaxableValue: number
    outwardTax: number
    inputTaxableValue: number
    inputTax: number
    netTaxPayable: number
  }
  taxSummary: {
    cgst: number
    sgst: number
    igst: number
    totalTax: number
    inputTax: number
    netLiability: number
  }
  breakdown: GstBreakdownRow[]
}

const OUTWARD_TYPES = new Set(["Sales Invoice", "Sales Return", "Credit Note"])
const INWARD_TYPES = new Set(["Purchase Invoice", "Purchase Return", "Debit Note"])

export function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function normalizeState(value?: string | null) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase()
}

export function determineGstMode(companyState?: string | null, partyState?: string | null): GstMode {
  const normalizedCompanyState = normalizeState(companyState)
  const normalizedPartyState = normalizeState(partyState)

  if (!normalizedCompanyState || !normalizedPartyState) {
    return "intra"
  }

  return normalizedCompanyState === normalizedPartyState ? "intra" : "inter"
}

export function splitGst(taxableValue: number, gstRate: number, mode: GstMode): GstSplit {
  const totalTax = roundCurrency((Math.max(0, taxableValue) * Math.max(0, gstRate)) / 100)

  if (mode === "inter") {
    return {
      cgst: 0,
      sgst: 0,
      igst: totalTax,
      total: totalTax,
    }
  }

  const cgst = roundCurrency(totalTax / 2)

  return {
    cgst,
    sgst: roundCurrency(totalTax - cgst),
    igst: 0,
    total: totalTax,
  }
}

export function getGstDirection(invoiceType: string) {
  return OUTWARD_TYPES.has(invoiceType) ? "outward" : INWARD_TYPES.has(invoiceType) ? "inward" : "outward"
}

export function getInvoiceSign(invoiceType: string) {
  return invoiceType === "Sales Return" || invoiceType === "Purchase Return" || invoiceType === "Credit Note" || invoiceType === "Debit Note" ? -1 : 1
}

export function createEmptyGstReport(): GstReportSummary {
  return {
    gstr1: {
      taxableValue: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      documentCount: 0,
    },
    gstr3b: {
      outwardTaxableValue: 0,
      outwardTax: 0,
      inputTaxableValue: 0,
      inputTax: 0,
      netTaxPayable: 0,
    },
    taxSummary: {
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalTax: 0,
      inputTax: 0,
      netLiability: 0,
    },
    breakdown: [],
  }
}

export function summarizeGstInvoices(invoices: GstInvoiceSource[]): GstReportSummary {
  const report = createEmptyGstReport()
  const breakdownMap = new Map<
    string,
    {
      count: number
      taxableValue: number
      cgst: number
      sgst: number
      igst: number
      totalTax: number
      grandTotal: number
    }
  >()

  for (const invoice of invoices) {
    const sign = Number(invoice.reportSign || 1)
    const taxableValue = roundCurrency(Number(invoice.taxableValue || 0) * sign)
    const cgst = roundCurrency(Number(invoice.cgstAmount || 0) * sign)
    const sgst = roundCurrency(Number(invoice.sgstAmount || 0) * sign)
    const igst = roundCurrency(Number(invoice.igstAmount || 0) * sign)
    const totalTax = roundCurrency(Number(invoice.totalGst || 0) * sign)
    const grandTotal = roundCurrency(Number(invoice.grandTotal || 0) * sign)

    const row = breakdownMap.get(invoice.invoiceType) || {
      count: 0,
      taxableValue: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalTax: 0,
      grandTotal: 0,
    }

    row.count += 1
    row.taxableValue = roundCurrency(row.taxableValue + taxableValue)
    row.cgst = roundCurrency(row.cgst + cgst)
    row.sgst = roundCurrency(row.sgst + sgst)
    row.igst = roundCurrency(row.igst + igst)
    row.totalTax = roundCurrency(row.totalTax + totalTax)
    row.grandTotal = roundCurrency(row.grandTotal + grandTotal)

    breakdownMap.set(invoice.invoiceType, row)

    const taxablePositive = Math.abs(taxableValue)
    const taxPositive = Math.abs(totalTax)

    if (OUTWARD_TYPES.has(invoice.invoiceType)) {
      report.gstr1.taxableValue = roundCurrency(report.gstr1.taxableValue + taxableValue)
      report.gstr1.cgst = roundCurrency(report.gstr1.cgst + cgst)
      report.gstr1.sgst = roundCurrency(report.gstr1.sgst + sgst)
      report.gstr1.igst = roundCurrency(report.gstr1.igst + igst)
      report.gstr1.documentCount += 1

      report.gstr3b.outwardTaxableValue = roundCurrency(report.gstr3b.outwardTaxableValue + taxableValue)
      report.gstr3b.outwardTax = roundCurrency(report.gstr3b.outwardTax + totalTax)
      report.taxSummary.totalTax = roundCurrency(report.taxSummary.totalTax + totalTax)
      report.taxSummary.cgst = roundCurrency(report.taxSummary.cgst + cgst)
      report.taxSummary.sgst = roundCurrency(report.taxSummary.sgst + sgst)
      report.taxSummary.igst = roundCurrency(report.taxSummary.igst + igst)
    } else if (INWARD_TYPES.has(invoice.invoiceType)) {
      report.gstr3b.inputTaxableValue = roundCurrency(report.gstr3b.inputTaxableValue + taxablePositive)
      report.gstr3b.inputTax = roundCurrency(report.gstr3b.inputTax + taxPositive)
      report.taxSummary.inputTax = roundCurrency(report.taxSummary.inputTax + taxPositive)
    }
  }

  report.gstr3b.netTaxPayable = roundCurrency(report.gstr3b.outwardTax - report.gstr3b.inputTax)
  report.taxSummary.netLiability = roundCurrency(report.taxSummary.totalTax - report.taxSummary.inputTax)
  report.breakdown = Array.from(breakdownMap.entries())
    .map(([invoiceType, row]) => ({ invoiceType, ...row }))
    .sort((left, right) => left.invoiceType.localeCompare(right.invoiceType))

  return report
}
