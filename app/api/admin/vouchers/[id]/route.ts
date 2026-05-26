import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/session"
import { hasRole } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import Voucher from "@/models/Voucher"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  await connectDB()
  const voucher = await Voucher.findById(params.id).populate({ path: "entries.ledger", select: "name company" })

  if (!voucher) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ voucher })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const current = await getCurrentUser()

    if (!current || !hasRole(current, "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    await connectDB()

    const voucher = await Voucher.findById(params.id)

    if (!voucher) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (body.voucherNumber) voucher.voucherNumber = body.voucherNumber
    if (body.voucherDate) voucher.voucherDate = new Date(body.voucherDate)
    if (body.narration !== undefined) voucher.narration = body.narration

    await voucher.save()

    return NextResponse.json({ voucher })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const current = await getCurrentUser()

  if (!current || !hasRole(current, "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  await connectDB()

  const voucher = await Voucher.findById(params.id)

  if (!voucher) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await voucher.deleteOne()

  return NextResponse.json({ ok: true })
}
