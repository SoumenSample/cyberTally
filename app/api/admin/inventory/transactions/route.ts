import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/session"
import { hasRole } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import StockTransaction from "@/models/StockTransaction"

type Body = {
  product?: string
  qty?: number
  rate?: number
  type?: "in" | "out" | "adjustment" | "transfer"
  warehouseFrom?: string
  warehouseTo?: string
  reference?: string
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser()

    if (!current || !hasRole(current, ["admin", "accountant"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = (await request.json()) as Body

    if (!body.product || typeof body.qty !== "number") {
      return NextResponse.json({ error: "product and qty are required" }, { status: 400 })
    }

    await connectDB()

    const tx = await StockTransaction.create({
      product: body.product,
      qty: body.qty,
      rate: body.rate ?? 0,
      type: body.type ?? (body.qty >= 0 ? "in" : "out"),
      warehouseFrom: body.warehouseFrom,
      warehouseTo: body.warehouseTo,
      reference: body.reference,
    })

    return NextResponse.json({ transaction: tx }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const current = await getCurrentUser()

    if (!current || !hasRole(current, ["admin", "accountant"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await connectDB()

    const items = await StockTransaction.find().sort({ createdAt: -1 }).populate("product warehouseFrom warehouseTo")

    return NextResponse.json({ transactions: items })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
