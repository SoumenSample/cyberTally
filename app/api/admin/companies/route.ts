import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/session"
import { hasRole } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import Company from "@/models/Company"

type Body = {
  companyName?: string
  gstNumber?: string
  address?: any
  phone?: string
  email?: string
  financialYearStart?: string
  financialYearEnd?: string
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser()

    if (!current || !hasRole(current, "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = (await request.json()) as Body

    if (!body.companyName) {
      return NextResponse.json({ error: "companyName is required" }, { status: 400 })
    }

    await connectDB()

    const company = await Company.create({
      companyName: body.companyName,
      gstNumber: body.gstNumber,
      address: body.address,
      phone: body.phone,
      email: body.email,
      financialYearStart: body.financialYearStart,
      financialYearEnd: body.financialYearEnd,
    })

    return NextResponse.json({ company }, { status: 201 })
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

    const companies = await Company.find().sort({ createdAt: -1 })

    return NextResponse.json({ companies })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
