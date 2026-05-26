import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/session"
import { hasRole } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import Company from "@/models/Company"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const current = await getCurrentUser()

  if (!current || !hasRole(current, "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const id = params.id
  const body = await request.json()

  await connectDB()

  const company = await Company.findByIdAndUpdate(id, body, { new: true })

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 })
  }

  return NextResponse.json({ company })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const current = await getCurrentUser()

  if (!current || !hasRole(current, "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const id = params.id

  await connectDB()

  const company = await Company.findByIdAndDelete(id)

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
