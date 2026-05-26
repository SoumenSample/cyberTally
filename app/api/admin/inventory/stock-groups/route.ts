import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/session"
import { hasRole } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import StockGroup from "@/models/StockGroup"

type Body = {
  name?: string
  description?: string
  parent?: string
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

    const group = await StockGroup.create({
      name: body.name,
      description: body.description,
      parent: body.parent,
    })

    return NextResponse.json({ group }, { status: 201 })
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

    const items = await StockGroup.find().sort({ createdAt: -1 })

    return NextResponse.json({ groups: items })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
