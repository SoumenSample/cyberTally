import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/session"
import { hasRole } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import User from "@/models/User"

type Body = {
  name?: string
  email?: string
  password?: string
  role?: string
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser()

    if (!current || !hasRole(current, "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = (await request.json()) as Body
    const name = body.name?.trim() ?? ""
    const email = body.email?.trim().toLowerCase() ?? ""
    const password = body.password ?? ""
    const role = (body.role ?? "employee").toLowerCase()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 })
    }

    if (!["admin", "accountant", "employee"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 })
    }

    await connectDB()

    const existing = await User.findOne({ email })

    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)

    const user = await User.create({ name, email, password: hashed, role })

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }, { status: 201 })
  } catch (err: any) {
    const message = err?.message || String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const current = await getCurrentUser()

    if (!current || !hasRole(current, "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await connectDB()

    // Avoid using Mongoose populate here because some mongoose configurations
    // may throw StrictPopulateError in the dev environment. Return basic
    // user fields and company ids; the frontend currently only displays name/email/role.
    const users = await User.find({}, "name email role createdAt updatedAt").sort({ createdAt: -1 })

    return NextResponse.json({ users })
  } catch (err: any) {
    const message = err?.message || String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
