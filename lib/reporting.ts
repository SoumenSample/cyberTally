import Invoice from "@/models/Invoice"
import Product from "@/models/Product"
import StockTransaction from "@/models/StockTransaction"
import Voucher from "@/models/Voucher"
import Warehouse from "@/models/Warehouse"
import { connectDB } from "@/lib/db"
import { getAccountingOverview, type AccountingOverview, type AccountingReportFilters } from "@/lib/accounting"
import { getInvoiceSign } from "@/lib/gst"

export type DayBookRow = {
  id: string
  date: string
  voucherType: string
  voucherNumber: string
  narration: string
  debit: number
  credit: number
  net: number
}

export type CashBookRow = {
  id: string
  date: string
  voucherType: string
  voucherNumber: string
  cashIn: number
  cashOut: number
  net: number
}

export type StockSummaryRow = {
  productId: string
  productName: string
  sku: string
  warehouseId: string
  warehouseName: string
  quantity: number
}

export type LowStockRow = {
  productId: string
  productName: string
  sku: string
  quantity: number
  threshold: number
}

export type MovementRow = {
  productId: string
  productName: string
  sku: string
  received: number
  issued: number
  adjusted: number
  transferred: number
  netQuantity: number
}

export type MonthlyPerformanceRow = {
  monthKey: string
  monthLabel: string
  revenue: number
  expenses: number
  profit: number
}

export type WeeklyPerformanceRow = {
  weekKey: string
  weekLabel: string
  revenue: number
  expenses: number
  profit: number
}

export type TopSellingProductRow = {
  label: string
  quantity: number
  revenue: number
}

export type ReportingDashboardData = {
  overview: AccountingOverview
  dayBook: DayBookRow[]
  cashBook: CashBookRow[]
  stockSummary: StockSummaryRow[]
  lowStock: LowStockRow[]
  movement: MovementRow[]
  monthlyPerformance: MonthlyPerformanceRow[]
  weeklyPerformance: WeeklyPerformanceRow[]
  topSellingProducts: TopSellingProductRow[]
}

function toIsoDate(value?: string | Date | null) {
  if (!value) return ""
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toISOString()
}

function formatMonthLabel(monthKey: string) {
  const [yearText, monthText] = monthKey.split("-")
  const year = Number(yearText)
  const month = Number(monthText)
  const date = new Date(year, Math.max(0, month - 1), 1)

  return new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(date)
}

function monthKeyFrom(value?: string | Date | null) {
  if (!value) return ""
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) return ""

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")

  return `${year}-${month}`
}

function getDateRangeMonths(fromDate?: string | null, toDate?: string | null, fallbackCount = 6) {
  const months: string[] = []
  const startDate = fromDate ? new Date(`${fromDate}T00:00:00`) : null
  const endDate = toDate ? new Date(`${toDate}T00:00:00`) : new Date()

  if (startDate && !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())) {
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    const endCursor = new Date(endDate.getFullYear(), endDate.getMonth(), 1)

    while (cursor <= endCursor) {
      months.push(monthKeyFrom(cursor))
      cursor.setMonth(cursor.getMonth() + 1)
    }
  }

  if (!months.length) {
    const cursor = new Date()
    cursor.setDate(1)
    cursor.setMonth(cursor.getMonth() - (fallbackCount - 1))

    for (let index = 0; index < fallbackCount; index += 1) {
      const current = new Date(cursor)
      current.setMonth(cursor.getMonth() + index)
      months.push(monthKeyFrom(current))
    }
  }

  return months.filter(Boolean)
}

function weekKeyFrom(value?: string | Date | null) {
  if (!value) return ""
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) return ""

  // Get the Monday of the week
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff))

  const year = monday.getFullYear()
  const month = String(monday.getMonth() + 1).padStart(2, "0")
  const dayOfMonth = String(monday.getDate()).padStart(2, "0")

  return `${year}-${month}-${dayOfMonth}`
}

function formatWeekLabel(weekKey: string) {
  const [yearText, monthText, dayText] = weekKey.split("-")
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const startDate = new Date(year, month - 1, day)
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 6)

  const startFormatted = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(startDate)
  const endFormatted = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(endDate)

  return `${startFormatted} - ${endFormatted}`
}

function getDateRangeWeeks(fromDate?: string | null, toDate?: string | null, fallbackWeeks = 12) {
  const weeks: string[] = []
  const startDate = fromDate ? new Date(`${fromDate}T00:00:00`) : null
  const endDate = toDate ? new Date(`${toDate}T23:59:59`) : new Date()

  if (startDate && !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())) {
    // Get the Monday of the start date
    const d = new Date(startDate)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const cursor = new Date(d.setDate(diff))

    while (cursor <= endDate) {
      weeks.push(weekKeyFrom(cursor))
      cursor.setDate(cursor.getDate() + 7)
    }
  }

  if (!weeks.length) {
    const cursor = new Date()
    const day = cursor.getDay()
    const diff = cursor.getDate() - day + (day === 0 ? -6 : 1)
    cursor.setDate(diff)
    cursor.setDate(cursor.getDate() - (fallbackWeeks - 1) * 7)

    for (let index = 0; index < fallbackWeeks; index += 1) {
      weeks.push(weekKeyFrom(cursor))
      cursor.setDate(cursor.getDate() + 7)
    }
  }

  return weeks.filter(Boolean)
}

function buildInventoryMaps(
  stockTransactions: Array<{
    product?: string | { _id?: unknown; name?: string; sku?: string } | null
    qty?: number
    type?: string
    warehouseFrom?: string | { _id?: unknown; name?: string } | null
    warehouseTo?: string | { _id?: unknown; name?: string } | null
  }>,
  products: Array<{ _id?: unknown; name?: string; sku?: string }>,
  warehouses: Array<{ _id?: unknown; name?: string }>
) {
  const productById = new Map<string, { _id?: unknown; name?: string; sku?: string }>()
  const warehouseById = new Map<string, { _id?: unknown; name?: string }>()

  for (const product of products) {
    productById.set(String(product._id), product)
  }

  for (const warehouse of warehouses) {
    warehouseById.set(String(warehouse._id), warehouse)
  }

  const stockMap = new Map<string, Map<string, number>>()
  const movementMap = new Map<string, MovementRow>()

  const addStock = (productId: string, warehouseId: string, quantity: number) => {
    const byWarehouse = stockMap.get(productId) || new Map<string, number>()
    byWarehouse.set(warehouseId, (byWarehouse.get(warehouseId) || 0) + quantity)
    stockMap.set(productId, byWarehouse)
  }

  const ensureMovement = (productId: string) => {
    const current = movementMap.get(productId)

    if (current) return current

    const product = productById.get(productId)
    const row: MovementRow = {
      productId,
      productName: product?.name || "Deleted product",
      sku: product?.sku || "",
      received: 0,
      issued: 0,
      adjusted: 0,
      transferred: 0,
      netQuantity: 0,
    }

    movementMap.set(productId, row)
    return row
  }

  for (const transaction of stockTransactions) {
    const productId = typeof transaction.product === "object" && transaction.product?._id ? String(transaction.product._id) : String(transaction.product || "")

    if (!productId) continue

    const quantity = Math.abs(Number(transaction.qty || 0))
    const movementRow = ensureMovement(productId)
    const warehouseFromId = transaction.warehouseFrom
      ? typeof transaction.warehouseFrom === "object" && transaction.warehouseFrom._id
        ? String(transaction.warehouseFrom._id)
        : String(transaction.warehouseFrom)
      : "_global"
    const warehouseToId = transaction.warehouseTo
      ? typeof transaction.warehouseTo === "object" && transaction.warehouseTo._id
        ? String(transaction.warehouseTo._id)
        : String(transaction.warehouseTo)
      : "_global"

    if (transaction.type === "transfer") {
      movementRow.transferred += quantity
      addStock(productId, warehouseFromId, -quantity)
      addStock(productId, warehouseToId, quantity)
      continue
    }

    if (transaction.type === "out") {
      movementRow.issued += quantity
      movementRow.netQuantity -= quantity
      addStock(productId, warehouseFromId, -quantity)
      continue
    }

    if (transaction.type === "adjustment") {
      const signedQuantity = Number(transaction.qty || 0)
      movementRow.adjusted += signedQuantity
      movementRow.netQuantity += signedQuantity
      addStock(productId, warehouseToId, signedQuantity)
      continue
    }

    movementRow.received += quantity
    movementRow.netQuantity += quantity
    addStock(productId, warehouseToId, quantity)
  }

  const stockSummary: StockSummaryRow[] = []

  for (const [productId, byWarehouse] of stockMap.entries()) {
    const product = productById.get(productId)

    for (const [warehouseId, quantity] of byWarehouse.entries()) {
      if (!quantity) continue

      stockSummary.push({
        productId,
        productName: product?.name || "Deleted product",
        sku: product?.sku || "",
        warehouseId,
        warehouseName: warehouseId === "_global" ? "Global" : warehouseById.get(warehouseId)?.name || "Deleted warehouse",
        quantity,
      })
    }
  }

  const productTotals = new Map<string, number>()

  for (const row of stockSummary) {
    productTotals.set(row.productId, (productTotals.get(row.productId) || 0) + row.quantity)
  }

  const threshold = 10
  const lowStock = Array.from(productTotals.entries())
    .map(([productId, quantity]) => {
      const product = productById.get(productId)

      return {
        productId,
        productName: product?.name || "Deleted product",
        sku: product?.sku || "",
        quantity,
        threshold,
      } satisfies LowStockRow
    })
    .filter((row) => row.quantity <= threshold)
    .sort((left, right) => left.quantity - right.quantity || left.productName.localeCompare(right.productName))

  return {
    stockSummary: stockSummary.sort((left, right) => left.productName.localeCompare(right.productName) || left.warehouseName.localeCompare(right.warehouseName)),
    lowStock,
    movement: Array.from(movementMap.values())
      .filter((row) => row.received || row.issued || row.adjusted || row.transferred || row.netQuantity)
      .sort((left, right) => right.netQuantity - left.netQuantity || left.productName.localeCompare(right.productName)),
  }
}

function buildDayBook(vouchers: Array<{ _id?: unknown; voucherDate?: string | Date; voucherType?: string; voucherNumber?: string; narration?: string; totalDebit?: number; totalCredit?: number }>) {
  return vouchers
    .map((voucher) => ({
      id: String(voucher._id || `${voucher.voucherNumber || "voucher"}-${voucher.voucherDate || ""}`),
      date: toIsoDate(voucher.voucherDate || null),
      voucherType: voucher.voucherType || "Voucher",
      voucherNumber: voucher.voucherNumber || "",
      narration: voucher.narration || "",
      debit: Number(voucher.totalDebit || 0),
      credit: Number(voucher.totalCredit || 0),
      net: Number(voucher.totalDebit || 0) - Number(voucher.totalCredit || 0),
    }))
    .sort((left, right) => right.date.localeCompare(left.date))
}

function buildCashBook(overview: AccountingOverview, vouchers: Array<{ _id?: unknown; voucherDate?: string | Date; voucherType?: string; voucherNumber?: string; entries?: Array<{ ledger?: string | { _id?: unknown } | null; side?: "debit" | "credit"; amount?: number }> }>) {
  const cashLedgerIds = new Set(overview.cashBalance.rows.map((row) => row.id))

  return vouchers
    .map((voucher) => {
      let cashIn = 0
      let cashOut = 0

      for (const entry of voucher.entries || []) {
        const ledgerId = typeof entry.ledger === "object" && entry.ledger?._id ? String(entry.ledger._id) : String(entry.ledger || "")

        if (!ledgerId || !cashLedgerIds.has(ledgerId)) continue

        const amount = Math.abs(Number(entry.amount || 0))

        if (entry.side === "credit") {
          cashOut += amount
        } else {
          cashIn += amount
        }
      }

      return {
        id: String(voucher._id || `${voucher.voucherNumber || "voucher"}-${voucher.voucherDate || ""}`),
        date: toIsoDate(voucher.voucherDate || null),
        voucherType: voucher.voucherType || "Voucher",
        voucherNumber: voucher.voucherNumber || "",
        cashIn,
        cashOut,
        net: cashIn - cashOut,
      } satisfies CashBookRow
    })
    .filter((row) => row.cashIn || row.cashOut)
    .sort((left, right) => right.date.localeCompare(left.date))
}

function buildAnalytics(
  invoices: Array<{
    invoiceType?: string
    invoiceDate?: string | Date
    items?: Array<{ description?: string; quantity?: number; lineTotal?: number }>
    reportSign?: number
    grandTotal?: number
  }>,
  fromDate?: string | null,
  toDate?: string | null
) {
  const monthKeys = getDateRangeMonths(fromDate, toDate, 6)
  const weekKeys = getDateRangeWeeks(fromDate, toDate, 12)
  const monthlyMap = new Map<string, MonthlyPerformanceRow>()
  const weeklyMap = new Map<string, WeeklyPerformanceRow>()

  for (const monthKey of monthKeys) {
    monthlyMap.set(monthKey, {
      monthKey,
      monthLabel: formatMonthLabel(monthKey),
      revenue: 0,
      expenses: 0,
      profit: 0,
    })
  }

  for (const weekKey of weekKeys) {
    weeklyMap.set(weekKey, {
      weekKey,
      weekLabel: formatWeekLabel(weekKey),
      revenue: 0,
      expenses: 0,
      profit: 0,
    })
  }

  const topProducts = new Map<string, TopSellingProductRow>()
  const outwardTypes = new Set(["Sales Invoice", "Sales Return", "Credit Note"])
  const inwardTypes = new Set(["Purchase Invoice", "Purchase Return", "Debit Note"])

  for (const invoice of invoices) {
    const monthKey = monthKeyFrom(invoice.invoiceDate || null)
    const weekKey = weekKeyFrom(invoice.invoiceDate || null)
    const monthlyRow = monthlyMap.get(monthKey)
    const weeklyRow = weeklyMap.get(weekKey)
    const sign = Number(invoice.reportSign || getInvoiceSign(invoice.invoiceType || ""))
    const invoiceTotal = Math.abs(Number(invoice.grandTotal || 0)) * sign

    if (monthlyRow) {
      if (outwardTypes.has(invoice.invoiceType || "")) {
        monthlyRow.revenue += invoiceTotal
      } else if (inwardTypes.has(invoice.invoiceType || "")) {
        monthlyRow.expenses += invoiceTotal
      }
      monthlyRow.profit = monthlyRow.revenue - monthlyRow.expenses
    }

    if (weeklyRow) {
      if (outwardTypes.has(invoice.invoiceType || "")) {
        weeklyRow.revenue += invoiceTotal
      } else if (inwardTypes.has(invoice.invoiceType || "")) {
        weeklyRow.expenses += invoiceTotal
      }
      weeklyRow.profit = weeklyRow.revenue - weeklyRow.expenses
    }

    if (!outwardTypes.has(invoice.invoiceType || "")) continue

    for (const item of invoice.items || []) {
      const label = String(item.description || "Unnamed item").trim() || "Unnamed item"
      const quantity = Math.abs(Number(item.quantity || 0)) * sign
      const revenue = Math.abs(Number(item.lineTotal || 0)) * sign
      const current = topProducts.get(label) || { label, quantity: 0, revenue: 0 }
      current.quantity += quantity
      current.revenue += revenue
      topProducts.set(label, current)
    }
  }

  return {
    monthlyPerformance: Array.from(monthlyMap.values()),
    weeklyPerformance: Array.from(weeklyMap.values()),
    topSellingProducts: Array.from(topProducts.values())
      .sort((left, right) => Math.abs(right.revenue) - Math.abs(left.revenue) || Math.abs(right.quantity) - Math.abs(left.quantity))
      .slice(0, 8),
  }
}

export async function getReportingDashboardData(companyId: string, filters: AccountingReportFilters = {}): Promise<ReportingDashboardData> {
  await connectDB()

  const voucherDateFilter: Record<string, Date> = {}

  if (filters.fromDate) {
    voucherDateFilter.$gte = new Date(`${filters.fromDate}T00:00:00`)
  }

  if (filters.toDate) {
    voucherDateFilter.$lte = new Date(`${filters.toDate}T23:59:59.999`)
  }

  const voucherQuery = Object.keys(voucherDateFilter).length ? { company: companyId, voucherDate: voucherDateFilter } : { company: companyId }

  const [overview, invoices, vouchers, stockTransactions, products, warehouses] = await Promise.all([
    getAccountingOverview(companyId, filters),
    Invoice.find({ company: companyId }).sort({ invoiceDate: 1, createdAt: 1 }).lean(),
    Voucher.find(voucherQuery).sort({ voucherDate: 1, createdAt: 1 }).lean(),
    StockTransaction.find().sort({ createdAt: 1 }).lean(),
    Product.find().sort({ name: 1 }).lean(),
    Warehouse.find().sort({ name: 1 }).lean(),
  ])

  type StockTransactionRecord = Parameters<typeof buildInventoryMaps>[0][number]
  type VoucherRecord = Parameters<typeof buildDayBook>[0][number]
  type InvoiceRecord = Parameters<typeof buildAnalytics>[0][number]

  const inventory = buildInventoryMaps(stockTransactions as StockTransactionRecord[], products as Array<{ _id?: unknown; name?: string; sku?: string }>, warehouses as Array<{ _id?: unknown; name?: string }>)
  const dayBook = buildDayBook(vouchers as VoucherRecord[])
  const cashBook = buildCashBook(overview, vouchers as VoucherRecord[])
  const analytics = buildAnalytics(invoices as InvoiceRecord[], filters.fromDate ?? null, filters.toDate ?? null)

  return {
    overview,
    dayBook,
    cashBook,
    stockSummary: inventory.stockSummary,
    lowStock: inventory.lowStock,
    movement: inventory.movement,
    monthlyPerformance: analytics.monthlyPerformance,
    weeklyPerformance: analytics.weeklyPerformance,
    topSellingProducts: analytics.topSellingProducts,
  }
}
