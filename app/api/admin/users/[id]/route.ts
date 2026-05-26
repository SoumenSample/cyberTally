import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/session"
import { hasRole } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import User from "@/models/User"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const current = await getCurrentUser()

  if (!current || !hasRole(current, "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const id = params.id

  const body = await request.json()
  const updates: any = {}

  if (typeof body.name === "string") updates.name = body.name.trim()
  if (typeof body.role === "string") {
    const role = body.role.toLowerCase()
    if (!["admin", "accountant", "employee"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }
    updates.role = role
  }
  if (Array.isArray(body.companies)) {
    updates.companies = body.companies
  }
  if (typeof body.activeCompany === "string") {
    updates.activeCompany = body.activeCompany
  }

  await connectDB()

  const user = await User.findByIdAndUpdate(id, updates, { new: true }).select("name email role companies activeCompany createdAt updatedAt").populate("companies", "companyName").populate("activeCompany", "companyName")

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json({ user })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const current = await getCurrentUser()

  if (!current || !hasRole(current, "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const id = params.id

  // Prevent deleting yourself
  if (current.id === id) {
    return NextResponse.json({ error: "Cannot delete your own account." }, { status: 400 })
  }

  await connectDB()

  const user = await User.findByIdAndDelete(id)

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
