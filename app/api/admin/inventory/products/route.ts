import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/session"
import { hasRole } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import Product from "@/models/Product"
import StockTransaction from "@/models/StockTransaction"

type Body = {
  name?: string
  sku?: string
  hsnCode?: string
  unit?: string
  category?: string
  group?: string
  rate?: number
  openingStock?: { qty: number; warehouse?: string }
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser()

    if (!current || !hasRole(current, "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = (await request.json()) as Body

    if (!body.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 })
    }

    await connectDB()

    const product = await Product.create({
      name: body.name,
      sku: body.sku,
      hsnCode: body.hsnCode,
      unit: body.unit,
      category: body.category,
      group: body.group,
      rate: body.rate ?? 0,
    })

    // If opening stock provided, create opening transaction
    if (body.openingStock && body.openingStock.qty && body.openingStock.qty !== 0) {
      await StockTransaction.create({
        product: product._id,
        qty: body.openingStock.qty,
        rate: body.rate ?? 0,
        type: "opening",
        warehouseTo: body.openingStock.warehouse,
      })
    }

    return NextResponse.json({ product }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const current = await getCurrentUser()

    if (!current || !hasRole(current, "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await connectDB()

    const items = await Product.find().sort({ createdAt: -1 }).populate("unit category group")

    return NextResponse.json({ products: items })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
