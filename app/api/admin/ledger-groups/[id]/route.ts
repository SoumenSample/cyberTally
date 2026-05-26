import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/session"
import { hasRole } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import LedgerGroup from "@/models/LedgerGroup"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const current = await getCurrentUser()
  if (!current || !hasRole(current, "admin")) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const body = await request.json()
  await connectDB()

  const g = await LedgerGroup.findById(params.id)
  if (!g) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (body.name) g.name = body.name
  if (body.type) g.type = body.type
  if (body.parent !== undefined) g.parent = body.parent

  await g.save()

  return NextResponse.json({ group: g })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const current = await getCurrentUser()
  if (!current || !hasRole(current, "admin")) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  await connectDB()

  const g = await LedgerGroup.findById(params.id)
  if (!g) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await g.remove()

  return NextResponse.json({ ok: true })
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  await connectDB()
  const g = await LedgerGroup.findById(params.id)
  if (!g) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ group: g })
}
