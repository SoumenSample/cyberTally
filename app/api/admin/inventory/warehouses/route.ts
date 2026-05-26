import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/session"
import { hasRole } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import Warehouse from "@/models/Warehouse"

type Body = {
  name?: string
  code?: string
  address?: string
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

    const wh = await Warehouse.create({ name: body.name, code: body.code, address: body.address })

    return NextResponse.json({ warehouse: wh }, { status: 201 })
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

    const items = await Warehouse.find().sort({ createdAt: -1 })

    return NextResponse.json({ warehouses: items })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
