import { determineGstMode, getGstDirection, getInvoiceSign, roundCurrency, splitGst, type GstMode } from "@/lib/gst"

export const invoiceTypes = [
  "Sales Invoice",
  "Purchase Invoice",
  "Sales Return",
  "Purchase Return",
  "Credit Note",
  "Debit Note",
] as const

export type InvoiceType = (typeof invoiceTypes)[number]

export const invoiceTypePrefixes: Record<InvoiceType, string> = {
  "Sales Invoice": "SINV",
  "Purchase Invoice": "PINV",
  "Sales Return": "SRET",
  "Purchase Return": "PRET",
  "Credit Note": "CRN",
  "Debit Note": "DBN",
}

export type InvoiceItemInput = {
  description?: string
  hsnCode?: string
  quantity?: number
  unit?: string
  rate?: number
  discount?: number
  gstRate?: number
}

export type CalculatedInvoiceItem = {
  description: string
  hsnCode: string
  quantity: number
  unit: string
  rate: number
  discount: number
  gstRate: number
  taxableValue: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  totalGst: number
  lineTotal: number
}

export type CalculatedInvoiceDocument = {
  gstMode: GstMode
  reportSign: number
  stockEffect: number
  items: CalculatedInvoiceItem[]
  taxableValue: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  totalGst: number
  grandTotal: number
  signedTaxableValue: number
  signedCgstAmount: number
  signedSgstAmount: number
  signedIgstAmount: number
  signedTotalGst: number
  signedGrandTotal: number
}

export function getInvoicePrefix(invoiceType: InvoiceType) {
  return invoiceTypePrefixes[invoiceType]
}

export function getInvoiceStockEffect(invoiceType: InvoiceType) {
  return invoiceType === "Sales Invoice" || invoiceType === "Sales Return" || invoiceType === "Credit Note" ? -1 : 1
}

export function calculateInvoiceDocument(options: {
  invoiceType: InvoiceType
  items: InvoiceItemInput[]
  companyState?: string | null
  partyState?: string | null
}): CalculatedInvoiceDocument {
  const gstMode = determineGstMode(options.companyState, options.partyState)
  const reportSign = getInvoiceSign(options.invoiceType)
  const stockEffect = getInvoiceStockEffect(options.invoiceType)

  const items = options.items.map((item) => {
    const quantity = Math.max(0, Number(item.quantity || 0))
    const rate = Math.max(0, Number(item.rate || 0))
    const discount = Math.max(0, Number(item.discount || 0))
    const gstRate = Math.max(0, Number(item.gstRate || 0))
    const taxableValue = roundCurrency(Math.max(0, quantity * rate - discount))
    const gstSplit = splitGst(taxableValue, gstRate, gstMode)

    return {
      description: String(item.description || "").trim(),
      hsnCode: String(item.hsnCode || "").trim(),
      quantity,
      unit: String(item.unit || "Nos").trim() || "Nos",
      rate,
      discount,
      gstRate,
      taxableValue,
      cgstAmount: gstSplit.cgst,
      sgstAmount: gstSplit.sgst,
      igstAmount: gstSplit.igst,
      totalGst: gstSplit.total,
      lineTotal: roundCurrency(taxableValue + gstSplit.total),
    }
  })

  const totals = items.reduce(
    (acc, item) => {
      acc.taxableValue = roundCurrency(acc.taxableValue + item.taxableValue)
      acc.cgstAmount = roundCurrency(acc.cgstAmount + item.cgstAmount)
      acc.sgstAmount = roundCurrency(acc.sgstAmount + item.sgstAmount)
      acc.igstAmount = roundCurrency(acc.igstAmount + item.igstAmount)
      acc.totalGst = roundCurrency(acc.totalGst + item.totalGst)
      acc.grandTotal = roundCurrency(acc.grandTotal + item.lineTotal)
      return acc
    },
    { taxableValue: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalGst: 0, grandTotal: 0 }
  )

  const signedTaxableValue = roundCurrency(totals.taxableValue * reportSign)
  const signedCgstAmount = roundCurrency(totals.cgstAmount * reportSign)
  const signedSgstAmount = roundCurrency(totals.sgstAmount * reportSign)
  const signedIgstAmount = roundCurrency(totals.igstAmount * reportSign)
  const signedTotalGst = roundCurrency(totals.totalGst * reportSign)
  const signedGrandTotal = roundCurrency(totals.grandTotal * reportSign)

  return {
    gstMode,
    reportSign,
    stockEffect,
    items,
    taxableValue: totals.taxableValue,
    cgstAmount: totals.cgstAmount,
    sgstAmount: totals.sgstAmount,
    igstAmount: totals.igstAmount,
    totalGst: totals.totalGst,
    grandTotal: totals.grandTotal,
    signedTaxableValue,
    signedCgstAmount,
    signedSgstAmount,
    signedIgstAmount,
    signedTotalGst,
    signedGrandTotal,
  }
}

export function getInvoiceSummaryLabel(invoiceType: InvoiceType) {
  const direction = getGstDirection(invoiceType)

  if (invoiceType === "Sales Invoice") return "Customer invoice"
  if (invoiceType === "Purchase Invoice") return "Vendor bill"
  if (direction === "outward") return "Outward adjustment"
  return "Inward adjustment"
}
