import Company from "@/models/Company"
import Ledger from "@/models/Ledger"
import "@/models/LedgerGroup"
import Voucher from "@/models/Voucher"
import { connectDB } from "@/lib/db"

type LedgerGroupDoc = {
  name?: string
  type?: string
}

type PopulatedLedgerDoc = {
  _id: unknown
  name?: string
  openingBalance?: number
  balanceType?: "debit" | "credit"
  group?: LedgerGroupDoc
}

type VoucherEntryDoc = {
  ledger?: PopulatedLedgerDoc | string | { _id?: unknown }
  side?: "debit" | "credit"
  amount?: number
}

type VoucherDoc = {
  entries?: VoucherEntryDoc[]
}

export type LedgerBalanceRow = {
  id: string
  name: string
  groupName: string
  groupType: string
  openingBalance: number
  openingSide: "debit" | "credit"
  movementDebit: number
  movementCredit: number
  closingBalance: number
  closingSide: "debit" | "credit"
}

export type AccountingOverview = {
  company: {
    id: string
    name: string
    financialYearStart?: string | null
    financialYearEnd?: string | null
  } | null
  ledgerBalances: LedgerBalanceRow[]
  trialBalance: {
    totalDebit: number
    totalCredit: number
    difference: number
  }
  cashBalance: {
    totalDebit: number
    totalCredit: number
    netBalance: number
    rows: LedgerBalanceRow[]
  }
  profitLoss: {
    incomeTotal: number
    expenseTotal: number
    netProfitLoss: number
    incomeRows: LedgerBalanceRow[]
    expenseRows: LedgerBalanceRow[]
  }
  balanceSheet: {
    assetTotal: number
    liabilityTotal: number
    equityTotal: number
    totalLiabilitiesAndEquity: number
    difference: number
    assetRows: LedgerBalanceRow[]
    liabilityRows: LedgerBalanceRow[]
    equityLabel: string
  }
}

export type AccountingReportFilters = {
  fromDate?: string | null
  toDate?: string | null
}

const CASH_GROUP_TYPES = new Set(["Bank Accounts", "Cash-in-Hand"])
const ASSET_GROUP_TYPES = new Set(["Assets", "Bank Accounts", "Cash-in-Hand"])
const LIABILITY_GROUP_TYPES = new Set(["Liabilities"])
const INCOME_GROUP_TYPES = new Set(["Income", "Sales Accounts"])
const EXPENSE_GROUP_TYPES = new Set(["Expenses", "Purchase Accounts"])

function signedAmount(amount = 0, side: "debit" | "credit" = "debit") {
  return side === "credit" ? -Math.abs(amount) : Math.abs(amount)
}

function splitSignedAmount(value: number): { amount: number; side: "debit" | "credit" } {
  return value >= 0
    ? { amount: Math.abs(value), side: "debit" }
    : { amount: Math.abs(value), side: "credit" }
}

function getGroupType(group?: LedgerGroupDoc) {
  return group?.type || "Unknown"
}

function getLedgerId(ledger?: VoucherEntryDoc["ledger"]) {
  if (!ledger) return ""
  if (typeof ledger === "string") return ledger
  if ("_id" in ledger && ledger._id !== undefined && ledger._id !== null) return String(ledger._id)
  return ""
}

function isCategory(groupType: string, category: Set<string>) {
  return category.has(groupType)
}

function toDateStart(value?: string | null) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function toDateEnd(value?: string | null) {
  if (!value) return null
  const date = new Date(`${value}T23:59:59.999`)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function getAccountingOverview(
  companyId: string,
  filters: AccountingReportFilters = {}
): Promise<AccountingOverview> {
  await connectDB()

  const fromDate = toDateStart(filters.fromDate)
  const toDate = toDateEnd(filters.toDate)

  const voucherDateFilter: Record<string, Date> = {}

  if (fromDate) {
    voucherDateFilter.$gte = fromDate
  }

  if (toDate) {
    voucherDateFilter.$lte = toDate
  }

  const voucherQuery = Object.keys(voucherDateFilter).length
    ? { company: companyId, voucherDate: voucherDateFilter }
    : { company: companyId }

  const [company, ledgers, vouchers] = await Promise.all([
    Company.findById(companyId).select("companyName financialYearStart financialYearEnd"),
    Ledger.find({ company: companyId })
      .populate({ path: "group", select: "name type" })
      .sort({ name: 1 }),
    Voucher.find(voucherQuery)
      .populate({
        path: "entries.ledger",
        select: "name openingBalance balanceType group",
        populate: { path: "group", select: "name type" },
      })
      .sort({ voucherDate: 1, createdAt: 1 }),
  ])

  const movementByLedger = new Map<string, { debit: number; credit: number }>()

  for (const voucher of vouchers as unknown as VoucherDoc[]) {
    for (const entry of voucher.entries || []) {
      const ledgerId = getLedgerId(entry.ledger)

      if (!ledgerId) continue

      const current = movementByLedger.get(ledgerId) || { debit: 0, credit: 0 }
      const amount = Math.abs(Number(entry.amount || 0))

      if (entry.side === "credit") {
        current.credit += amount
      } else {
        current.debit += amount
      }

      movementByLedger.set(ledgerId, current)
    }
  }

  const ledgerBalances = (ledgers as unknown as PopulatedLedgerDoc[]).map((ledger) => {
    const ledgerId = String(ledger._id)
    const movement = movementByLedger.get(ledgerId) || { debit: 0, credit: 0 }
    const openingBalance = Math.abs(Number(ledger.openingBalance || 0))
    const openingSide = ledger.balanceType === "credit" ? "credit" : "debit"
    const openingSigned = signedAmount(openingBalance, openingSide)
    const closingSigned = openingSigned + movement.debit - movement.credit
    const closing = splitSignedAmount(closingSigned)

    return {
      id: ledgerId,
      name: ledger.name || "Unnamed ledger",
      groupName: ledger.group?.name || "Unassigned",
      groupType: getGroupType(ledger.group),
      openingBalance,
      openingSide,
      movementDebit: movement.debit,
      movementCredit: movement.credit,
      closingBalance: closing.amount,
      closingSide: closing.side,
    } satisfies LedgerBalanceRow
  })

  const trialBalance = ledgerBalances.reduce(
    (acc, row) => {
      if (row.closingSide === "debit") {
        acc.totalDebit += row.closingBalance
      } else {
        acc.totalCredit += row.closingBalance
      }
      return acc
    },
    { totalDebit: 0, totalCredit: 0 }
  )

  const cashRows = ledgerBalances.filter((row) => isCategory(row.groupType, CASH_GROUP_TYPES))
  const cashSignedTotal = cashRows.reduce((acc, row) => acc + signedAmount(row.closingBalance, row.closingSide), 0)
  const cashBalance = splitSignedAmount(cashSignedTotal)

  const incomeRows = ledgerBalances.filter((row) => isCategory(row.groupType, INCOME_GROUP_TYPES))
  const expenseRows = ledgerBalances.filter((row) => isCategory(row.groupType, EXPENSE_GROUP_TYPES))

  const incomeTotal = incomeRows.reduce((acc, row) => acc - signedAmount(row.closingBalance, row.closingSide), 0)
  const expenseTotal = expenseRows.reduce((acc, row) => acc + signedAmount(row.closingBalance, row.closingSide), 0)
  const netProfitLoss = incomeTotal - expenseTotal

  const assetRows = ledgerBalances.filter((row) => isCategory(row.groupType, ASSET_GROUP_TYPES))
  const liabilityRows = ledgerBalances.filter((row) => isCategory(row.groupType, LIABILITY_GROUP_TYPES))

  const assetTotal = assetRows.reduce((acc, row) => acc + signedAmount(row.closingBalance, row.closingSide), 0)
  const liabilityTotal = liabilityRows.reduce((acc, row) => acc + Math.max(0, -signedAmount(row.closingBalance, row.closingSide)), 0)
  const equityTotal = netProfitLoss
  const totalLiabilitiesAndEquity = liabilityTotal + equityTotal

  return {
    company: company
      ? {
          id: String(company._id),
          name: company.companyName,
          financialYearStart: company.financialYearStart ?? null,
          financialYearEnd: company.financialYearEnd ?? null,
        }
      : null,
    ledgerBalances,
    trialBalance: {
      totalDebit: trialBalance.totalDebit,
      totalCredit: trialBalance.totalCredit,
      difference: trialBalance.totalDebit - trialBalance.totalCredit,
    },
    cashBalance: {
      totalDebit: cashBalance.side === "debit" ? cashBalance.amount : 0,
      totalCredit: cashBalance.side === "credit" ? cashBalance.amount : 0,
      netBalance: cashSignedTotal,
      rows: cashRows,
    },
    profitLoss: {
      incomeTotal,
      expenseTotal,
      netProfitLoss,
      incomeRows,
      expenseRows,
    },
    balanceSheet: {
      assetTotal,
      liabilityTotal,
      equityTotal,
      totalLiabilitiesAndEquity,
      difference: assetTotal - totalLiabilitiesAndEquity,
      assetRows,
      liabilityRows,
      equityLabel: equityTotal >= 0 ? "Current period profit" : "Current period loss",
    },
  }
}
