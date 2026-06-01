import Invoice from "@/models/Invoice"
import { connectDB } from "@/lib/db"
import { getReportingDashboardData, type LowStockRow } from "@/lib/reporting"

export type NotificationSeverity = "critical" | "high" | "medium" | "low"

export type NotificationKind = "payment-reminder" | "low-stock"

export type NotificationItem = {
  id: string
  kind: NotificationKind
  title: string
  message: string
  severity: NotificationSeverity
  date: string
  amount?: number
  daysUntilDue?: number
  invoiceNumber?: string
  invoiceType?: string
  productName?: string
  quantity?: number
  threshold?: number
}

export type NotificationCenterData = {
  reminders: NotificationItem[]
  lowStockAlerts: NotificationItem[]
  items: NotificationItem[]
  reminderCount: number
  lowStockCount: number
  totalCount: number
  latestDueDate?: string | null
}

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toISOString()
}

function daysBetween(today: Date, dueDate: Date) {
  const start = new Date(today)
  start.setHours(0, 0, 0, 0)

  const end = new Date(dueDate)
  end.setHours(0, 0, 0, 0)

  return Math.round((end.getTime() - start.getTime()) / 86400000)
}

function buildPaymentReminder(invoice: {
  _id?: unknown
  invoiceDate?: string | Date
  dueDate?: string | Date | null
  invoiceType?: string
  invoiceNumber?: string
  partyName?: string
  grandTotal?: number
}): NotificationItem | null {
  if (!invoice.dueDate) return null

  const dueDate = new Date(invoice.dueDate)
  if (Number.isNaN(dueDate.getTime())) return null

  const daysUntilDue = daysBetween(new Date(), dueDate)

  if (daysUntilDue > 7) return null

  const overdue = daysUntilDue < 0
  const reminderType = invoice.invoiceType === "Purchase Invoice" || invoice.invoiceType === "Purchase Return" || invoice.invoiceType === "Debit Note"
    ? "Payable reminder"
    : "Payment reminder"

  return {
    id: `payment-${String(invoice._id || invoice.invoiceNumber || invoice.partyName || dueDate.toISOString())}`,
    kind: "payment-reminder" as const,
    title: overdue ? `${reminderType} overdue` : `${reminderType} due soon`,
    message: `${invoice.invoiceNumber || "Invoice"} for ${invoice.partyName || "the party"} is ${overdue ? `${Math.abs(daysUntilDue)} day(s) overdue` : `due in ${daysUntilDue} day(s)`}.`,
    severity: overdue ? "critical" : daysUntilDue <= 2 ? "high" : "medium",
    date: formatDate(dueDate),
    amount: Number(invoice.grandTotal || 0),
    daysUntilDue,
    invoiceNumber: invoice.invoiceNumber,
    invoiceType: invoice.invoiceType,
  } satisfies NotificationItem
}

function buildLowStockAlert(row: LowStockRow) {
  const shortage = Math.max(0, row.threshold - row.quantity)

  return {
    id: `stock-${row.productId}`,
    kind: "low-stock" as const,
    title: "Low stock alert",
    message: `${row.productName} is at ${row.quantity} units. Keep at least ${row.threshold} units in stock; shortage is ${shortage} unit(s).`,
    severity: row.quantity === 0 ? "critical" : row.quantity <= 3 ? "high" : "medium",
    date: new Date().toISOString(),
    productName: row.productName,
    quantity: row.quantity,
    threshold: row.threshold,
  } satisfies NotificationItem
}

export async function getNotificationCenterData(companyId: string, dismissedNotificationIds: string[] = []): Promise<NotificationCenterData> {
  await connectDB()

  const [dashboardData, invoices] = await Promise.all([
    getReportingDashboardData(companyId),
    Invoice.find({ company: companyId }).sort({ dueDate: 1, invoiceDate: -1 }).lean(),
  ])

  const reminders = (invoices as Array<{
    _id?: unknown
    invoiceDate?: string | Date
    dueDate?: string | Date | null
    invoiceType?: string
    invoiceNumber?: string
    partyName?: string
    grandTotal?: number
  }>)
    .map(buildPaymentReminder)
    .filter((item): item is NotificationItem => item !== null)
    .sort((left, right) => (left.daysUntilDue ?? 0) - (right.daysUntilDue ?? 0))

  const lowStockAlerts = dashboardData.lowStock.map(buildLowStockAlert)

  const dismissedSet = new Set(dismissedNotificationIds)

  const visibleReminders = reminders.filter((item) => !dismissedSet.has(item.id))
  const visibleLowStockAlerts = lowStockAlerts.filter((item) => !dismissedSet.has(item.id))

  const items = [...visibleReminders, ...visibleLowStockAlerts].sort((left, right) => {
    const severityWeight: Record<NotificationSeverity, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    }

    return severityWeight[left.severity] - severityWeight[right.severity] || left.date.localeCompare(right.date)
  })

  const latestDueDate = visibleReminders.length ? visibleReminders[0].date : null

  return {
    reminders: visibleReminders,
    lowStockAlerts: visibleLowStockAlerts,
    items,
    reminderCount: visibleReminders.length,
    lowStockCount: visibleLowStockAlerts.length,
    totalCount: items.length,
    latestDueDate,
  }
}