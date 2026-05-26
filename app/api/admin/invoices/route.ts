import { NextResponse } from "next/server"

import { getCurrentUserRecord } from "@/lib/session"
import { hasRole } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import Company from "@/models/Company"
import Ledger from "@/models/Ledger"
import Invoice from "@/models/Invoice"
import {
  calculateInvoiceDocument,
  getInvoicePrefix,
  invoiceTypes,
  type InvoiceType,
} from "@/lib/invoice"
import { determineGstMode, summarizeGstInvoices } from "@/lib/gst"

type InvoiceItemInput = {
  description?: string
  hsnCode?: string
  quantity?: number
  unit?: string
  rate?: number
  discount?: number
  gstRate?: number
}

type Body = {
  company?: string
  invoiceType?: string
  invoiceNumber?: string
  invoiceDate?: string
  dueDate?: string
  partyLedger?: string
  partyGstin?: string
  partyState?: string
  placeOfSupply?: string
  notes?: string
  items?: InvoiceItemInput[]
}

function normalizeInvoiceType(value?: string): InvoiceType | null {
  if (!value) return null
  return (invoiceTypes as readonly string[]).includes(value) ? (value as InvoiceType) : null
}

async function generateInvoiceNumber(company: string, invoiceType: InvoiceType) {
  const prefix = getInvoicePrefix(invoiceType)
  const lastInvoice = await Invoice.findOne({ company, invoiceType, invoiceNumber: new RegExp(`^${prefix}-`) })
    .sort({ createdAt: -1 })
    .select("invoiceNumber")

  const lastNumber = Number.parseInt(String(lastInvoice?.invoiceNumber || "").replace(`${prefix}-`, ""), 10)
  const nextNumber = Number.isFinite(lastNumber) ? lastNumber + 1 : 1

  return `${prefix}-${String(nextNumber).padStart(4, "0")}`
}

export async function GET(request: Request) {
  try {
    const current = await getCurrentUserRecord()

    if (!current || !hasRole(current, "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("company")?.trim() || ""

    await connectDB()

    const query: Record<string, string> = {}

    if (companyId) {
      query.company = companyId
    }

    const [invoices, company] = await Promise.all([
      Invoice.find(query)
        .populate({ path: "partyLedger", select: "name company" })
        .sort({ invoiceDate: -1, createdAt: -1 })
        .lean(),
      companyId ? Company.findById(companyId).select("companyName address gstNumber").lean() : Promise.resolve(null),
    ])

    const report = summarizeGstInvoices(
      invoices.map((invoice) => ({
        invoiceType: String(invoice.invoiceType),
        taxableValue: Number(invoice.taxableValue || 0),
        cgstAmount: Number(invoice.cgstAmount || 0),
        sgstAmount: Number(invoice.sgstAmount || 0),
        igstAmount: Number(invoice.igstAmount || 0),
        totalGst: Number(invoice.totalGst || 0),
        grandTotal: Number(invoice.grandTotal || 0),
        reportSign: Number(invoice.reportSign || 1),
      }))
    )

    return NextResponse.json({
      company,
      invoices,
      report,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentUserRecord()

    if (!current || !hasRole(current, "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = (await request.json()) as Body
    const company = body.company?.trim()
    const invoiceType = normalizeInvoiceType(body.invoiceType)
    const invoiceDate = body.invoiceDate ? new Date(body.invoiceDate) : null
    const dueDate = body.dueDate ? new Date(body.dueDate) : null
    const partyLedger = body.partyLedger?.trim()
    const items = Array.isArray(body.items) ? body.items : []

    if (!company || !invoiceType || !invoiceDate || Number.isNaN(invoiceDate.getTime()) || !partyLedger || !items.length) {
      return NextResponse.json({ error: "company, invoiceType, invoiceDate, partyLedger and items are required" }, { status: 400 })
    }

    await connectDB()

    const companyDoc = await Company.findById(company).select("address gstNumber companyName").lean()

    if (!companyDoc) {
      return NextResponse.json({ error: "Selected company was not found" }, { status: 404 })
    }

    const partyLedgerDoc = await Ledger.findOne({ _id: partyLedger, company }).select("name company").lean()

    if (!partyLedgerDoc) {
      return NextResponse.json({ error: "Selected ledger does not belong to the company" }, { status: 400 })
    }

    const calculated = calculateInvoiceDocument({
      invoiceType,
      items,
      companyState: companyDoc.address?.state || "",
      partyState: body.partyState?.trim() || "",
    })

    const invoiceNumber = body.invoiceNumber?.trim() || (await generateInvoiceNumber(company, invoiceType))
    const gstMode = determineGstMode(companyDoc.address?.state || "", body.partyState?.trim() || "")

    const invoice = await Invoice.create({
      company,
      invoiceType,
      invoiceNumber,
      invoiceDate,
      dueDate: dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate : undefined,
      partyLedger,
      partyName: partyLedgerDoc.name,
      partyGstin: body.partyGstin?.trim() || "",
      partyState: body.partyState?.trim() || "",
      placeOfSupply: body.placeOfSupply?.trim() || "",
      gstMode,
      reportSign: calculated.reportSign,
      stockEffect: calculated.stockEffect,
      items: calculated.items,
      taxableValue: calculated.taxableValue,
      cgstAmount: calculated.cgstAmount,
      sgstAmount: calculated.sgstAmount,
      igstAmount: calculated.igstAmount,
      totalGst: calculated.totalGst,
      grandTotal: calculated.grandTotal,
      notes: body.notes?.trim() || "",
    })

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate({ path: "partyLedger", select: "name company" })
      .lean()

    return NextResponse.json({ invoice: populatedInvoice }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
