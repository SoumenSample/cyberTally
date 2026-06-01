"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  RadialBar,
  RadialBarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { BarChart3, Database, PackageSearch, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Badge } from "@/components/ui/badge"
import type { ReportingDashboardData } from "@/lib/reporting"

type Props = {
  data: ReportingDashboardData
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value)
}

function formatSignedMoney(value: number) {
  const label = value >= 0 ? "Dr" : "Cr"
  return value < 0 ? `-${formatMoney(Math.abs(value))} ${label}` : `${formatMoney(value)} ${label}`
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value)
}

function formatDate(value: string) {
  return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value)) : ""
}

// ─── Color tokens ─────────────────────────────────────────────────────────────

const COLOR = {
  profit: "#16a34a",      // green-600
  profitLight: "#dcfce7", // green-100
  loss: "#dc2626",        // red-600
  lossLight: "#fee2e2",   // red-100
  neutral: "#2563eb",     // blue-600
  neutralLight: "#dbeafe",
  warning: "#d97706",     // amber-600
  warningLight: "#fef3c7",
  revenue: "#2563eb",
  expenses: "#dc2626",
  border: "#e5e7eb",
  muted: "#9ca3af",
  grid: "#f3f4f6",
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg text-sm">
      <p className="mb-1.5 font-semibold text-gray-700">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-gray-500">{entry.name}:</span>
          <span className="font-medium text-gray-800">
            {typeof entry.value === "number" ? formatMoney(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "default",
}: {
  title: string
  value: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  tone?: "default" | "positive" | "negative" | "warning"
}) {
  const config = {
    positive: {
      text: "text-green-700",
      bg: "bg-green-50",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      badge: "bg-green-100 text-green-700",
      indicator: "bg-green-500",
    },
    negative: {
      text: "text-red-700",
      bg: "bg-red-50",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      badge: "bg-red-100 text-red-700",
      indicator: "bg-red-500",
    },
    warning: {
      text: "text-amber-700",
      bg: "bg-amber-50",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      badge: "bg-amber-100 text-amber-700",
      indicator: "bg-amber-500",
    },
    default: {
      text: "text-blue-700",
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      badge: "bg-blue-100 text-blue-700",
      indicator: "bg-blue-500",
    },
  }[tone]

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md`}>
      {/* left accent bar */}
      {/* <div className={`absolute left-0 top-0 h-full w-1 ${config.indicator}`} /> */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 pl-1">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">{title}</p>
          <p className={`truncate text-2xl font-bold tabular-nums ${config.text}`}>{value}</p>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>
        <div className={`shrink-0 rounded-xl p-2.5 ${config.iconBg}`}>
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
        </div>
      </div>
    </div>
  )
}

// ─── Chart Card ───────────────────────────────────────────────────────────────

function ChartCard({ title, description, children, filter }: { title: string; description: string; children: React.ReactNode; filter?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <p className="mt-0.5 text-xs text-gray-400">{description}</p>
        </div>
        {filter && <div className="ml-4">{filter}</div>}
      </div>
      {children}
    </div>
  )
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-gray-400">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 text-center">
      <div className="rounded-full bg-gray-100 p-3">
        <BarChart3 className="h-5 w-5 text-gray-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="mt-1 text-xs text-gray-400">{description}</p>
      </div>
    </div>
  )
}

// ─── Styled Table ─────────────────────────────────────────────────────────────

function DataTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

function DTHead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-400">{children}</thead>
}

function DTBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-gray-50">{children}</tbody>
}

function DTRow({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return <tr className={`transition-colors hover:bg-gray-50/80 ${highlight ? "bg-green-50/40" : ""}`}>{children}</tr>
}

function DTCell({ children, className = "", colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return <td colSpan={colSpan} className={`px-4 py-3 text-gray-700 ${className}`}>{children}</td>
}

function DTHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-2.5 text-left font-medium ${className}`}>{children}</th>
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ReportingWorkspace({ data }: Props) {
  const [revenueExpensesPeriod, setRevenueExpensesPeriod] = React.useState<"monthly" | "weekly">("monthly")

  const trialDifference = data.overview.trialBalance.difference
  const balanceDifference = data.overview.balanceSheet.difference
  const profitLoss = data.overview.profitLoss.netProfitLoss
  const lowStockCount = data.lowStock.length
  const totalRevenue = data.monthlyPerformance.reduce((total, row) => total + row.revenue, 0)
  const totalExpenses = data.monthlyPerformance.reduce((total, row) => total + row.expenses, 0)
  const totalProfit = data.monthlyPerformance.reduce((total, row) => total + row.profit, 0)

  // Enrich monthly data with bar colors
  const enrichedMonthly = data.monthlyPerformance.map((row) => ({
    ...row,
    profitColor: row.profit >= 0 ? COLOR.profit : COLOR.loss,
  }))

  // Enrich weekly data with bar colors
  const enrichedWeekly = data.weeklyPerformance.map((row) => ({
    ...row,
    profitColor: row.profit >= 0 ? COLOR.profit : COLOR.loss,
  }))

  // Get the data for revenue/expenses chart based on selected period
  const revenueExpensesData = revenueExpensesPeriod === "monthly" ? data.monthlyPerformance : data.weeklyPerformance
  const revenueExpensesLabel = revenueExpensesPeriod === "monthly" ? "monthLabel" : "weekLabel"

  // Filter UI for revenue/expenses
  const revenueExpensesFilter = (
    <div className="flex gap-2">
      <button
        onClick={() => setRevenueExpensesPeriod("monthly")}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
          revenueExpensesPeriod === "monthly"
            ? "bg-gray-900 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        Monthly
      </button>
      <button
        onClick={() => setRevenueExpensesPeriod("weekly")}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
          revenueExpensesPeriod === "weekly"
            ? "bg-gray-900 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        Weekly
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6">
      <Tabs defaultValue="overview" className="gap-5 flex flex-col">
        {/* Tab bar */}
        <div className="rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
          <TabsList className="w-full justify-start overflow-x-auto bg-transparent gap-1">
            {["overview", "financial", "inventory", "analytics"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="rounded-lg px-4 py-2 text-sm font-medium capitalize text-gray-500 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ── OVERVIEW ───────────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-5 mt-0">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Trial Balance"
              value={formatMoney(Math.abs(trialDifference))}
              description="Debits and credits reconciliation"
              icon={BarChart3}
              tone={trialDifference === 0 ? "positive" : "negative"}
            />
            <StatCard
              title="Profit / Loss"
              value={formatSignedMoney(profitLoss)}
              description="Ledger-driven period result"
              icon={profitLoss >= 0 ? TrendingUp : TrendingDown}
              tone={profitLoss >= 0 ? "positive" : "negative"}
            />
            <StatCard
              title="Balance Sheet"
              value={formatMoney(Math.abs(balanceDifference))}
              description="Assets vs liabilities + equity"
              icon={Database}
              tone={balanceDifference === 0 ? "positive" : "negative"}
            />
            <StatCard
              title="Low Stock Items"
              value={String(lowStockCount)}
              description="Items at or below threshold"
              icon={PackageSearch}
              tone={lowStockCount === 0 ? "positive" : lowStockCount > 5 ? "negative" : "warning"}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {/* Revenue & Expenses — Area Chart */}
            <ChartCard 
              title="Revenue & Expenses" 
              description={revenueExpensesPeriod === "monthly" ? "Month-by-month sales and purchase trend" : "Week-by-week sales and purchase trend"}
              filter={revenueExpensesFilter}
            >
              {revenueExpensesData.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={revenueExpensesData as any} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLOR.revenue} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={COLOR.revenue} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLOR.expenses} stopOpacity={0.12} />
                        <stop offset="95%" stopColor={COLOR.expenses} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke={COLOR.grid} vertical={false} />
                    <XAxis dataKey={revenueExpensesLabel} tickMargin={8} tick={{ fontSize: 11, fill: COLOR.muted }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => formatNumber(Number(v))} tick={{ fontSize: 11, fill: COLOR.muted }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                      formatter={(value) => <span style={{ color: "#374151" }}>{value}</span>}
                    />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke={COLOR.revenue} strokeWidth={2.5} fill="url(#gradRevenue)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke={COLOR.expenses} strokeWidth={2.5} fill="url(#gradExpenses)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="No revenue data" description="Create invoices to populate the revenue and expense trends." />
              )}
            </ChartCard>

            {/* Monthly Profit — Colored Bar Chart */}
            <ChartCard title="Monthly Profit" description="Net profit after expenses — green = profit, red = loss">
              {enrichedMonthly.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={enrichedMonthly} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke={COLOR.grid} vertical={false} />
                    <XAxis dataKey="monthLabel" tickMargin={8} tick={{ fontSize: 11, fill: COLOR.muted }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => formatNumber(Number(v))} tick={{ fontSize: 11, fill: COLOR.muted }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke={COLOR.border} strokeWidth={1.5} />
                    <Bar dataKey="profit" name="Profit" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {enrichedMonthly.map((entry, index) => (
                        <Cell key={index} fill={entry.profit >= 0 ? COLOR.profit : COLOR.loss} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="No monthly profit data" description="Once invoices exist, monthly profit will appear here." />
              )}
            </ChartCard>
          </div>

          {/* Top Products — Horizontal Bar */}
          <ChartCard title="Top Selling Products" description="Sales quantity ranked by invoice item description">
            {data.topSellingProducts.length ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.topSellingProducts} layout="vertical" margin={{ top: 8, right: 16, left: 24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradProduct" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={COLOR.neutral} />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke={COLOR.grid} horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => formatNumber(Number(v))} tick={{ fontSize: 11, fill: COLOR.muted }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="label" width={180} tick={{ fontSize: 12, fill: "#374151" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="quantity" name="Quantity" radius={[0, 6, 6, 0]} maxBarSize={28} fill="url(#gradProduct)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No top products yet" description="Sales invoice items will automatically power this ranking." />
            )}
          </ChartCard>
        </TabsContent>

        {/* ── FINANCIAL ──────────────────────────────────────────────────────── */}
        <TabsContent value="financial" className="space-y-5 mt-0">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Trial Balance Diff." value={formatMoney(Math.abs(trialDifference))} description="Should be zero when balanced" icon={BarChart3} tone={trialDifference === 0 ? "positive" : "negative"} />
            <StatCard title="Cash Balance" value={formatSignedMoney(data.overview.cashBalance.netBalance)} description="Cash and bank ledgers" icon={TrendingUp} tone={data.overview.cashBalance.netBalance >= 0 ? "positive" : "negative"} />
            <StatCard title="Profit / Loss" value={formatSignedMoney(profitLoss)} description="Income minus expenses" icon={profitLoss >= 0 ? TrendingUp : TrendingDown} tone={profitLoss >= 0 ? "positive" : "negative"} />
            <StatCard title="Balance Sheet Diff." value={formatMoney(Math.abs(balanceDifference))} description="Assets vs liabilities and equity" icon={Database} tone={balanceDifference === 0 ? "positive" : "negative"} />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <SectionCard title="Trial Balance" description="Debit and credit totals should match when postings are balanced.">
              <DataTable>
                <DTHead>
                  <tr>
                    <DTHeader>Metric</DTHeader>
                    <DTHeader className="text-right">Amount</DTHeader>
                  </tr>
                </DTHead>
                <DTBody>
                  <DTRow>
                    <DTCell>Total Debit</DTCell>
                    <DTCell className="text-right font-mono">{formatMoney(data.overview.trialBalance.totalDebit)}</DTCell>
                  </DTRow>
                  <DTRow>
                    <DTCell>Total Credit</DTCell>
                    <DTCell className="text-right font-mono">{formatMoney(data.overview.trialBalance.totalCredit)}</DTCell>
                  </DTRow>
                  <DTRow highlight={trialDifference === 0}>
                    <DTCell className="font-semibold text-gray-800">Difference</DTCell>
                    <DTCell className={`text-right font-semibold font-mono ${trialDifference === 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatMoney(Math.abs(trialDifference))}
                      {trialDifference === 0 && <CheckCircle2 className="inline ml-1.5 h-3.5 w-3.5" />}
                    </DTCell>
                  </DTRow>
                </DTBody>
              </DataTable>
            </SectionCard>

            <SectionCard title="Cash Book" description="Cash and bank ledger balances from the active company.">
              <DataTable>
                <DTHead>
                  <tr>
                    <DTHeader>Ledger</DTHeader>
                    <DTHeader className="text-right">Balance</DTHeader>
                  </tr>
                </DTHead>
                <DTBody>
                  {data.overview.cashBalance.rows.length ? (
                    data.overview.cashBalance.rows.map((row) => (
                      <DTRow key={row.id}>
                        <DTCell>{row.name}</DTCell>
                        <DTCell className="text-right font-mono">{formatSignedMoney(row.closingSide === "credit" ? -row.closingBalance : row.closingBalance)}</DTCell>
                      </DTRow>
                    ))
                  ) : (
                    <DTRow>
                      <DTCell className="text-center text-gray-400" colSpan={2}>No cash ledgers were found.</DTCell>
                    </DTRow>
                  )}
                  <DTRow>
                    <DTCell className="font-semibold text-gray-800">Net Cash Balance</DTCell>
                    <DTCell className={`text-right font-semibold font-mono ${data.overview.cashBalance.netBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatSignedMoney(data.overview.cashBalance.netBalance)}
                    </DTCell>
                  </DTRow>
                </DTBody>
              </DataTable>
            </SectionCard>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <SectionCard title="Profit / Loss" description="Income accounts less expense accounts for the current company.">
              <DataTable>
                <DTHead>
                  <tr>
                    <DTHeader>Section</DTHeader>
                    <DTHeader className="text-right">Amount</DTHeader>
                  </tr>
                </DTHead>
                <DTBody>
                  <DTRow>
                    <DTCell>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        Income
                      </span>
                    </DTCell>
                    <DTCell className="text-right font-mono text-green-700">{formatMoney(data.overview.profitLoss.incomeTotal)}</DTCell>
                  </DTRow>
                  <DTRow>
                    <DTCell>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        Expenses
                      </span>
                    </DTCell>
                    <DTCell className="text-right font-mono text-red-700">{formatMoney(data.overview.profitLoss.expenseTotal)}</DTCell>
                  </DTRow>
                  <DTRow highlight={profitLoss >= 0}>
                    <DTCell className="font-semibold text-gray-800">Net Result</DTCell>
                    <DTCell className={`text-right font-semibold font-mono ${profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatSignedMoney(profitLoss)}
                    </DTCell>
                  </DTRow>
                </DTBody>
              </DataTable>
            </SectionCard>

            <SectionCard title="Balance Sheet" description="Assets compared with liabilities plus retained earnings.">
              <DataTable>
                <DTHead>
                  <tr>
                    <DTHeader>Section</DTHeader>
                    <DTHeader className="text-right">Amount</DTHeader>
                  </tr>
                </DTHead>
                <DTBody>
                  <DTRow>
                    <DTCell>Assets</DTCell>
                    <DTCell className="text-right font-mono text-blue-700">{formatMoney(Math.abs(data.overview.balanceSheet.assetTotal))}</DTCell>
                  </DTRow>
                  <DTRow>
                    <DTCell>Liabilities</DTCell>
                    <DTCell className="text-right font-mono text-red-700">{formatMoney(data.overview.balanceSheet.liabilityTotal)}</DTCell>
                  </DTRow>
                  <DTRow>
                    <DTCell>{data.overview.balanceSheet.equityLabel}</DTCell>
                    <DTCell className={`text-right font-mono ${data.overview.balanceSheet.equityTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatSignedMoney(data.overview.balanceSheet.equityTotal)}
                    </DTCell>
                  </DTRow>
                  <DTRow highlight={balanceDifference === 0}>
                    <DTCell className="font-semibold text-gray-800">Difference</DTCell>
                    <DTCell className={`text-right font-semibold font-mono ${balanceDifference === 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatMoney(Math.abs(balanceDifference))}
                      {balanceDifference === 0 && <CheckCircle2 className="inline ml-1.5 h-3.5 w-3.5" />}
                    </DTCell>
                  </DTRow>
                </DTBody>
              </DataTable>
            </SectionCard>
          </div>

          <SectionCard title="Day Book" description="Voucher register in chronological order.">
            <div className="overflow-x-auto">
              <DataTable>
                <DTHead>
                  <tr>
                    <DTHeader>Date</DTHeader>
                    <DTHeader>Voucher</DTHeader>
                    <DTHeader>Type</DTHeader>
                    <DTHeader>Narration</DTHeader>
                    <DTHeader className="text-right">Debit</DTHeader>
                    <DTHeader className="text-right">Credit</DTHeader>
                    <DTHeader className="text-right">Net</DTHeader>
                  </tr>
                </DTHead>
                <DTBody>
                  {data.dayBook.length ? (
                    data.dayBook.slice(0, 25).map((row) => (
                      <DTRow key={row.id}>
                        <DTCell className="text-xs text-gray-500 whitespace-nowrap">{formatDate(row.date)}</DTCell>
                        <DTCell className="font-mono text-xs">{row.voucherNumber}</DTCell>
                        <DTCell>
                          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{row.voucherType}</span>
                        </DTCell>
                        <DTCell className="max-w-64 truncate text-xs text-gray-500">{row.narration || "—"}</DTCell>
                        <DTCell className="text-right font-mono text-xs text-green-700">{formatMoney(row.debit)}</DTCell>
                        <DTCell className="text-right font-mono text-xs text-red-700">{formatMoney(row.credit)}</DTCell>
                        <DTCell className={`text-right font-mono text-xs font-medium ${row.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatSignedMoney(row.net)}
                        </DTCell>
                      </DTRow>
                    ))
                  ) : (
                    <DTRow>
                      <DTCell className="text-center text-gray-400 py-8" colSpan={7}>No vouchers found for the selected range.</DTCell>
                    </DTRow>
                  )}
                </DTBody>
              </DataTable>
            </div>
          </SectionCard>
        </TabsContent>

        {/* ── INVENTORY ──────────────────────────────────────────────────────── */}
        <TabsContent value="inventory" className="space-y-5 mt-0">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Stock Rows" value={String(data.stockSummary.length)} description="Product and warehouse combinations" icon={PackageSearch} tone="default" />
            <StatCard title="Low Stock Items" value={String(data.lowStock.length)} description="Products at or below threshold" icon={TrendingDown} tone={data.lowStock.length === 0 ? "positive" : "negative"} />
            <StatCard title="Movement Rows" value={String(data.movement.length)} description="Products with stock activity" icon={BarChart3} tone="default" />
            <StatCard title="Top Selling Items" value={String(data.topSellingProducts.length)} description="Sales item descriptions tracked" icon={TrendingUp} tone="default" />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <SectionCard title="Stock Summary" description="Current quantity by product and warehouse.">
              <div className="max-h-96 overflow-auto">
                <DataTable>
                  <DTHead>
                    <tr>
                      <DTHeader>Product</DTHeader>
                      <DTHeader>Warehouse</DTHeader>
                      <DTHeader>SKU</DTHeader>
                      <DTHeader className="text-right">Qty</DTHeader>
                    </tr>
                  </DTHead>
                  <DTBody>
                    {data.stockSummary.length ? (
                      data.stockSummary.slice(0, 60).map((row) => (
                        <DTRow key={`${row.productId}-${row.warehouseId}`}>
                          <DTCell className="font-medium">{row.productName}</DTCell>
                          <DTCell className="text-gray-500">{row.warehouseName}</DTCell>
                          <DTCell className="font-mono text-xs text-gray-400">{row.sku || "—"}</DTCell>
                          <DTCell className="text-right font-mono">{formatNumber(row.quantity)}</DTCell>
                        </DTRow>
                      ))
                    ) : (
                      <DTRow>
                        <DTCell className="text-center text-gray-400 py-8" colSpan={4}>No stock transactions were found.</DTCell>
                      </DTRow>
                    )}
                  </DTBody>
                </DataTable>
              </div>
            </SectionCard>

            <SectionCard title="Low Stock" description="Products with quantities at or below 10 units.">
              <DataTable>
                <DTHead>
                  <tr>
                    <DTHeader>Product</DTHeader>
                    <DTHeader>SKU</DTHeader>
                    <DTHeader className="text-right">Qty</DTHeader>
                    <DTHeader className="text-right">Threshold</DTHeader>
                  </tr>
                </DTHead>
                <DTBody>
                  {data.lowStock.length ? (
                    data.lowStock.map((row) => (
                      <DTRow key={row.productId}>
                        <DTCell>
                          <span className="flex items-center gap-1.5 font-medium">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            {row.productName}
                          </span>
                        </DTCell>
                        <DTCell className="font-mono text-xs text-gray-400">{row.sku || "—"}</DTCell>
                        <DTCell className="text-right font-mono font-semibold text-red-600">{formatNumber(row.quantity)}</DTCell>
                        <DTCell className="text-right font-mono text-gray-500">{formatNumber(row.threshold)}</DTCell>
                      </DTRow>
                    ))
                  ) : (
                    <DTRow>
                      <DTCell className="text-center py-8" colSpan={4}>
                        <span className="flex items-center justify-center gap-2 text-green-600 font-medium text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          No products are below the stock threshold.
                        </span>
                      </DTCell>
                    </DTRow>
                  )}
                </DTBody>
              </DataTable>
            </SectionCard>
          </div>

          <SectionCard title="Movement Report" description="Product-wise stock movement summary.">
            <div className="overflow-x-auto">
              <DataTable>
                <DTHead>
                  <tr>
                    <DTHeader>Product</DTHeader>
                    <DTHeader>SKU</DTHeader>
                    <DTHeader className="text-right">Received</DTHeader>
                    <DTHeader className="text-right">Issued</DTHeader>
                    <DTHeader className="text-right">Adjusted</DTHeader>
                    <DTHeader className="text-right">Transferred</DTHeader>
                    <DTHeader className="text-right">Net</DTHeader>
                  </tr>
                </DTHead>
                <DTBody>
                  {data.movement.length ? (
                    data.movement.slice(0, 60).map((row) => (
                      <DTRow key={row.productId}>
                        <DTCell className="font-medium">{row.productName}</DTCell>
                        <DTCell className="font-mono text-xs text-gray-400">{row.sku || "—"}</DTCell>
                        <DTCell className="text-right font-mono text-green-700">{formatNumber(row.received)}</DTCell>
                        <DTCell className="text-right font-mono text-red-600">{formatNumber(row.issued)}</DTCell>
                        <DTCell className="text-right font-mono text-gray-600">{formatNumber(row.adjusted)}</DTCell>
                        <DTCell className="text-right font-mono text-blue-600">{formatNumber(row.transferred)}</DTCell>
                        <DTCell className={`text-right font-mono font-semibold ${row.netQuantity >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatNumber(row.netQuantity)}
                        </DTCell>
                      </DTRow>
                    ))
                  ) : (
                    <DTRow>
                      <DTCell className="text-center text-gray-400 py-8" colSpan={7}>No movement records are available yet.</DTCell>
                    </DTRow>
                  )}
                </DTBody>
              </DataTable>
            </div>
          </SectionCard>
        </TabsContent>

        {/* ── ANALYTICS ──────────────────────────────────────────────────────── */}
        <TabsContent value="analytics" className="space-y-5 mt-0">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Revenue" value={formatMoney(totalRevenue)} description="Sales invoice value in the selected period" icon={TrendingUp} tone="positive" />
            <StatCard title="Expenses" value={formatMoney(totalExpenses)} description="Purchase invoice value in the selected period" icon={TrendingDown} tone="negative" />
            <StatCard title="Monthly Profit" value={formatSignedMoney(totalProfit)} description="Revenue less expenses across the active range" icon={BarChart3} tone={totalProfit >= 0 ? "positive" : "negative"} />
            <StatCard title="Top Products" value={String(data.topSellingProducts.length)} description="Ranked by invoice item performance" icon={PackageSearch} />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <ChartCard title="Revenue vs Expenses" description="The active reporting window">
              {data.monthlyPerformance.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data.monthlyPerformance} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradRevenue2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLOR.revenue} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={COLOR.revenue} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradExpenses2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLOR.expenses} stopOpacity={0.12} />
                        <stop offset="95%" stopColor={COLOR.expenses} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke={COLOR.grid} vertical={false} />
                    <XAxis dataKey="monthLabel" tickMargin={8} tick={{ fontSize: 11, fill: COLOR.muted }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => formatNumber(Number(v))} tick={{ fontSize: 11, fill: COLOR.muted }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} formatter={(v) => <span style={{ color: "#374151" }}>{v}</span>} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke={COLOR.revenue} strokeWidth={2.5} fill="url(#gradRevenue2)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke={COLOR.expenses} strokeWidth={2.5} fill="url(#gradExpenses2)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="No analytics data" description="Create invoices to see revenue and expense trends." />
              )}
            </ChartCard>

            <ChartCard title="Monthly Profit" description="Net profit by month — green bars are profitable, red are losses">
              {enrichedMonthly.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={enrichedMonthly} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke={COLOR.grid} vertical={false} />
                    <XAxis dataKey="monthLabel" tickMargin={8} tick={{ fontSize: 11, fill: COLOR.muted }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => formatNumber(Number(v))} tick={{ fontSize: 11, fill: COLOR.muted }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke={COLOR.border} strokeWidth={1.5} />
                    <Bar dataKey="profit" name="Profit" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {enrichedMonthly.map((entry, index) => (
                        <Cell key={index} fill={entry.profit >= 0 ? COLOR.profit : COLOR.loss} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="No monthly profit data" description="The chart will appear once invoices are available." />
              )}
            </ChartCard>
          </div>

          <SectionCard title="Top Selling Products" description="Sorted by sold quantity with revenue as a secondary metric.">
            <div className="overflow-x-auto">
              <DataTable>
                <DTHead>
                  <tr>
                    <DTHeader>Rank</DTHeader>
                    <DTHeader>Product</DTHeader>
                    <DTHeader className="text-right">Quantity</DTHeader>
                    <DTHeader className="text-right">Revenue</DTHeader>
                  </tr>
                </DTHead>
                <DTBody>
                  {data.topSellingProducts.length ? (
                    data.topSellingProducts.map((row, index) => (
                      <DTRow key={row.label}>
                        <DTCell>
                          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold
                            ${index === 0 ? "bg-amber-100 text-amber-700" : index === 1 ? "bg-gray-100 text-gray-600" : index === 2 ? "bg-orange-100 text-orange-600" : "text-gray-400 text-xs"}`}>
                            {index + 1}
                          </span>
                        </DTCell>
                        <DTCell className="font-medium">{row.label}</DTCell>
                        <DTCell className="text-right font-mono text-blue-700">{formatNumber(row.quantity)}</DTCell>
                        <DTCell className="text-right font-mono font-semibold text-green-700">{formatMoney(row.revenue)}</DTCell>
                      </DTRow>
                    ))
                  ) : (
                    <DTRow>
                      <DTCell className="text-center text-gray-400 py-8" colSpan={4}>No sales items were found in the active range.</DTCell>
                    </DTRow>
                  )}
                </DTBody>
              </DataTable>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}