import { NextResponse } from "next/server"

import { getCurrentUserRecord, getDefaultCompanyIdForCurrentUser } from "@/lib/session"
import { hasRole } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import LedgerGroup from "@/models/LedgerGroup"

type Body = {
  name?: string
  type?: string
  parent?: string
  company?: string
}

const DEFAULT_GROUPS = ["Assets", "Liabilities", "Income", "Expenses", "Bank Accounts", "Cash-in-Hand", "Sales Accounts", "Purchase Accounts"]

export async function POST(request: Request) {
  try {
    const current = await getCurrentUserRecord()

    if (!current || !hasRole(current, "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = (await request.json()) as Body

    if (!body.name || !body.type || !body.company) {
      return NextResponse.json({ error: "name, type and company are required" }, { status: 400 })
    }

    await connectDB()

    const group = await LedgerGroup.create({ name: body.name, type: body.type, parent: body.parent || undefined, company: body.company })

    return NextResponse.json({ group }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const current = await getCurrentUserRecord()

    if (!current || !hasRole(current, "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await connectDB()

    const groups = await LedgerGroup.find().sort({ createdAt: -1 })

    if (!groups || groups.length === 0) {
      const companyId = (await getDefaultCompanyIdForCurrentUser()) ?? ""

      if (companyId) {
        const created: any[] = []
        for (const t of DEFAULT_GROUPS) {
          const g = await LedgerGroup.create({ name: t, type: t, company: companyId })
          created.push(g)
        }
        return NextResponse.json({ groups: created })
      }
    }

    return NextResponse.json({ groups })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
