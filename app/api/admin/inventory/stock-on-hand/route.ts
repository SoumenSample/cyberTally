import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/session"
import { hasRole } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import StockTransaction from "@/models/StockTransaction"
import Product from "@/models/Product"
import Warehouse from "@/models/Warehouse"

export async function GET(request: Request) {
  try {
    const current = await getCurrentUser()

    if (!current || !hasRole(current, ["admin", "accountant"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await connectDB()

    const txs = await StockTransaction.find().lean()

    // Compute net qty per product per warehouse
    const map: Record<string, Record<string, number>> = {}

    for (const t of txs) {
      const pid = typeof t.product === 'object' && t.product?._id ? String(t.product._id) : String(t.product)

      if (!map[pid]) map[pid] = {}

      // If transaction has a to-warehouse, add
      if (t.warehouseTo) {
        const wid = String(t.warehouseTo)
        map[pid][wid] = (map[pid][wid] || 0) + (t.qty || 0)
      }

      // If transaction has a from-warehouse, subtract
      if (t.warehouseFrom) {
        const wid = String(t.warehouseFrom)
        map[pid][wid] = (map[pid][wid] || 0) - (t.qty || 0)
      }

      // If neither warehouse specified, treat as global (use key "_global")
      if (!t.warehouseFrom && !t.warehouseTo) {
        const wid = "_global"
        map[pid][wid] = (map[pid][wid] || 0) + (t.qty || 0)
      }
    }

    const productIds = Object.keys(map)
    const warehouseIds = new Set<string>()
    for (const pid of productIds) {
      for (const wid of Object.keys(map[pid])) warehouseIds.add(wid)
    }

    const products = await Product.find({ _id: { $in: productIds } }).lean()
    const warehouses = await Warehouse.find({ _id: { $in: Array.from(warehouseIds).filter((w) => w !== "_global") } }).lean()

    const productById: Record<string, any> = {}
    for (const p of products) productById[String(p._id)] = p

    const warehouseById: Record<string, any> = {}
    for (const w of warehouses) warehouseById[String(w._id)] = w

    const result: Array<{ product: any; warehouse: any | null; qty: number }> = []

    for (const pid of productIds) {
      for (const wid of Object.keys(map[pid])) {
        const qty = map[pid][wid] || 0
        const product = productById[pid] || { _id: pid, name: "(deleted)" }
        const warehouse = wid === "_global" ? null : warehouseById[wid] || { _id: wid, name: "(deleted)" }
        result.push({ product, warehouse, qty })
      }
    }

    return NextResponse.json({ stockOnHand: result })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
