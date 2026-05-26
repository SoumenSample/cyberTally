import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/session"
import { hasRole } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import Ledger from "@/models/Ledger"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const current = await getCurrentUser()
  if (!current || !hasRole(current, "admin")) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const body = await request.json()
  await connectDB()

  const l = await Ledger.findById(params.id)
  if (!l) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (body.name) l.name = body.name
  if (body.group) l.group = body.group
  if (body.openingBalance !== undefined) l.openingBalance = body.openingBalance
  if (body.balanceType) l.balanceType = body.balanceType

  await l.save()

  return NextResponse.json({ ledger: l })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const current = await getCurrentUser()
  if (!current || !hasRole(current, "admin")) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  await connectDB()

  const l = await Ledger.findById(params.id)
  if (!l) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await l.remove()

  return NextResponse.json({ ok: true })
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  await connectDB()
  const l = await Ledger.findById(params.id).populate('group')
  if (!l) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ ledger: l })
}
