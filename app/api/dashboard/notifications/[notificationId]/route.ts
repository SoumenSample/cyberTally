import { NextResponse } from "next/server"

import { getCurrentUserRecord } from "@/lib/session"
import { connectDB } from "@/lib/db"

type RouteContext = {
  params: Promise<{
    notificationId: string
  }>
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUserRecord()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { notificationId } = await context.params

    if (!notificationId) {
      return NextResponse.json({ error: "notificationId is required" }, { status: 400 })
    }

    await connectDB()

    const dismissedNotifications = Array.isArray(user.dismissedNotifications)
      ? user.dismissedNotifications
      : []

    const alreadyDismissed = dismissedNotifications.some(
      (entry: { notificationId?: string } | undefined | null) => entry?.notificationId === notificationId
    )

    if (!alreadyDismissed) {
      dismissedNotifications.push({ notificationId, dismissedAt: new Date() })
      user.dismissedNotifications = dismissedNotifications
      await user.save()
    }

    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}