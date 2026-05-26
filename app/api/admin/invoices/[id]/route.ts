import { NextResponse } from "next/server"

import { getCurrentUserRecord } from "@/lib/session"
import { hasRole } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import Invoice from "@/models/Invoice"

type RouteParams = {
  params: Promise<{ id: string }> | { id: string }
}

export async function DELETE(_request: Request, context: RouteParams) {
  try {
    const current = await getCurrentUserRecord()

    if (!current || !hasRole(current, "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const params = await Promise.resolve(context.params)

    await connectDB()

    const invoice = await Invoice.findById(params.id)

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    await Invoice.deleteOne({ _id: params.id })

    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
