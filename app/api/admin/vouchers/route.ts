import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/session"
import { hasRole } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import Voucher from "@/models/Voucher"
import Ledger from "@/models/Ledger"
import { getVoucherPrefix, voucherTypes, type VoucherType } from "@/lib/voucher"

type EntryInput = {
  ledger?: string
  side?: "debit" | "credit"
  amount?: number
  narration?: string
}

type Body = {
  company?: string
  voucherType?: VoucherType
  voucherNumber?: string
  voucherDate?: string
  narration?: string
  entries?: EntryInput[]
}

function normalizeVoucherType(value?: string): VoucherType | null {
  if (!value) return null
  return (voucherTypes as readonly string[]).includes(value) ? (value as VoucherType) : null
}

function getEntryTotals(entries: EntryInput[]) {
  return entries.reduce(
    (acc, entry) => {
      const amount = Number(entry.amount || 0)
      if (entry.side === "debit") acc.debit += amount
      if (entry.side === "credit") acc.credit += amount
      return acc
    },
    { debit: 0, credit: 0 }
  )
}

async function generateVoucherNumber(company: string, voucherType: VoucherType) {
  const prefix = getVoucherPrefix(voucherType)
  const lastVoucher = await Voucher.findOne({ company, voucherType, voucherNumber: new RegExp(`^${prefix}-`) })
    .sort({ createdAt: -1 })
    .select("voucherNumber")

  const lastNumber = Number.parseInt(String(lastVoucher?.voucherNumber || "").replace(`${prefix}-`, ""), 10)
  const nextNumber = Number.isFinite(lastNumber) ? lastNumber + 1 : 1

  return `${prefix}-${String(nextNumber).padStart(4, "0")}`
}

export async function GET() {
  try {
    const current = await getCurrentUser()

    if (!current || !hasRole(current, "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await connectDB()

    const vouchers = await Voucher.find().sort({ voucherDate: -1, createdAt: -1 }).populate({
      path: "entries.ledger",
      select: "name company",
    })

    return NextResponse.json({ vouchers })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser()

    if (!current || !hasRole(current, "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = (await request.json()) as Body
    const company = body.company?.trim()
    const voucherType = normalizeVoucherType(body.voucherType)
    const voucherDate = body.voucherDate ? new Date(body.voucherDate) : null
    const entries = Array.isArray(body.entries) ? body.entries : []

    if (!company || !voucherType || !voucherDate || Number.isNaN(voucherDate.getTime())) {
      return NextResponse.json({ error: "company, voucherType and voucherDate are required" }, { status: 400 })
    }

    if (!entries.length) {
      return NextResponse.json({ error: "At least two entries are required" }, { status: 400 })
    }

    const normalizedEntries = entries.map((entry, index) => {
      const ledger = entry.ledger?.trim()
      const side = entry.side
      const amount = Number(entry.amount || 0)

      if (!ledger || !side || !["debit", "credit"].includes(side) || !Number.isFinite(amount) || amount <= 0) {
        throw new Error(`Entry ${index + 1} is incomplete`)
      }

      return {
        ledger,
        side: side as "debit" | "credit",
        amount,
        narration: entry.narration?.trim() || "",
      }
    })

    const totals = getEntryTotals(normalizedEntries)

    if (normalizedEntries.length < 2) {
      return NextResponse.json({ error: "At least two entries are required" }, { status: 400 })
    }

    if (totals.debit <= 0 || totals.credit <= 0 || totals.debit !== totals.credit) {
      return NextResponse.json({ error: "Debit and credit totals must match" }, { status: 400 })
    }

    await connectDB()

    const ledgers = await Ledger.find({ _id: { $in: normalizedEntries.map((entry) => entry.ledger) }, company })
      .select("_id")
      .lean()

    if (ledgers.length !== normalizedEntries.length) {
      return NextResponse.json({ error: "One or more entries use a ledger outside the selected company" }, { status: 400 })
    }

    const voucherNumber = body.voucherNumber?.trim() || (await generateVoucherNumber(company, voucherType))

    const voucher = await Voucher.create({
      company,
      voucherType,
      voucherNumber,
      voucherDate,
      narration: body.narration?.trim() || "",
      entries: normalizedEntries,
      totalDebit: totals.debit,
      totalCredit: totals.credit,
    })

    return NextResponse.json({ voucher }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
