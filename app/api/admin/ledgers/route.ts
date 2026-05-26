import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/session"
import { hasRole } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import Ledger from "@/models/Ledger"

type Body = {
  name?: string
  group?: string
  openingBalance?: number
  balanceType?: string
  company?: string
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser()

    if (!current || !hasRole(current, "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = (await request.json()) as Body

    if (!body.name || !body.group || !body.company) {
      return NextResponse.json({ error: "name, group and company are required" }, { status: 400 })
    }

    await connectDB()

    const ledger = await Ledger.create({ name: body.name, group: body.group, openingBalance: body.openingBalance || 0, balanceType: body.balanceType || 'debit', company: body.company })

    return NextResponse.json({ ledger }, { status: 201 })
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

    const ledgers = await Ledger.find().sort({ createdAt: -1 }).populate('group')

    return NextResponse.json({ ledgers })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
