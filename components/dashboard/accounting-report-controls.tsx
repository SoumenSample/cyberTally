"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import jsPDF from "jspdf"
import * as XLSX from "xlsx"
import { Download, FileSpreadsheet, FileText, Filter, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type AccountingOverview } from "@/lib/accounting"

type Props = {
  companyName?: string | null
  fromDate?: string | null
  toDate?: string | null
  overview: AccountingOverview
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value)
}

function formatSignedMoney(value: number) {
  return value < 0 ? `-${formatMoney(Math.abs(value))} Cr` : `${formatMoney(value)} Dr`
}

function buildQueryString(fromDate?: string | null, toDate?: string | null) {
  const params = new URLSearchParams()

  if (fromDate) params.set("from", fromDate)
  if (toDate) params.set("to", toDate)

  const query = params.toString()
  return query ? `?${query}` : ""
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

export function AccountingReportControls({ companyName, fromDate = "", toDate = "", overview }: Props) {
  const router = useRouter()
  const [rangeFrom, setRangeFrom] = React.useState(fromDate ?? "")
  const [rangeTo, setRangeTo] = React.useState(toDate ?? "")

  const applyFilters = () => {
    router.push(`/dashboard${buildQueryString(rangeFrom || null, rangeTo || null)}`)
  }

  const clearFilters = () => {
    setRangeFrom("")
    setRangeTo("")
    router.push("/dashboard")
  }

  const exportExcel = () => {
    const workbook = XLSX.utils.book_new()

    const summarySheet = XLSX.utils.json_to_sheet([
      {
        Company: overview.company?.name || companyName || "",
        "From date": rangeFrom || "",
        "To date": rangeTo || "",
        "Trial debit": overview.trialBalance.totalDebit,
        "Trial credit": overview.trialBalance.totalCredit,
        "Trial difference": overview.trialBalance.difference,
        "Cash balance": overview.cashBalance.netBalance,
        "Income total": overview.profitLoss.incomeTotal,
        "Expense total": overview.profitLoss.expenseTotal,
        "Profit/Loss": overview.profitLoss.netProfitLoss,
        Assets: overview.balanceSheet.assetTotal,
        Liabilities: overview.balanceSheet.liabilityTotal,
        Equity: overview.balanceSheet.equityTotal,
        "Balance difference": overview.balanceSheet.difference,
      },
    ])

    const ledgerSheet = XLSX.utils.json_to_sheet(
      overview.ledgerBalances.map((row) => ({
        Ledger: row.name,
        Group: row.groupName,
        Type: row.groupType,
        Opening: row.openingSide === "credit" ? -row.openingBalance : row.openingBalance,
        Debits: row.movementDebit,
        Credits: row.movementCredit,
        Closing: row.closingSide === "credit" ? -row.closingBalance : row.closingBalance,
      }))
    )

    const trialSheet = XLSX.utils.json_to_sheet([
      { Metric: "Total debit", Amount: overview.trialBalance.totalDebit },
      { Metric: "Total credit", Amount: overview.trialBalance.totalCredit },
      { Metric: "Difference", Amount: overview.trialBalance.difference },
    ])

    const cashSheet = XLSX.utils.json_to_sheet(
      overview.cashBalance.rows.map((row) => ({
        Ledger: row.name,
        Balance: row.closingSide === "credit" ? -row.closingBalance : row.closingBalance,
      }))
    )

    const profitSheet = XLSX.utils.json_to_sheet([
      { Section: "Income", Amount: overview.profitLoss.incomeTotal },
      { Section: "Expenses", Amount: overview.profitLoss.expenseTotal },
      { Section: "Net result", Amount: overview.profitLoss.netProfitLoss },
    ])

    const balanceSheet = XLSX.utils.json_to_sheet([
      { Section: "Assets", Amount: overview.balanceSheet.assetTotal },
      { Section: "Liabilities", Amount: overview.balanceSheet.liabilityTotal },
      { Section: overview.balanceSheet.equityLabel, Amount: overview.balanceSheet.equityTotal },
      { Section: "Difference", Amount: overview.balanceSheet.difference },
    ])

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary")
    XLSX.utils.book_append_sheet(workbook, ledgerSheet, "Ledger Balances")
    XLSX.utils.book_append_sheet(workbook, trialSheet, "Trial Balance")
    XLSX.utils.book_append_sheet(workbook, cashSheet, "Cash Balance")
    XLSX.utils.book_append_sheet(workbook, profitSheet, "Profit Loss")
    XLSX.utils.book_append_sheet(workbook, balanceSheet, "Balance Sheet")

    const arrayBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    downloadBlob(
      new Blob([arrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `${(overview.company?.name || companyName || "accounting").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-statements.xlsx`
    )
  }

  const exportPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" })
    const margin = 40
    const pageHeight = doc.internal.pageSize.getHeight()
    let cursorY = margin

    const ensureSpace = (space = 20) => {
      if (cursorY + space > pageHeight - margin) {
        doc.addPage()
        cursorY = margin
      }
    }

    const addLine = (text: string, indent = 0, fontSize = 10, isBold = false) => {
      ensureSpace(fontSize + 8)
      doc.setFont("helvetica", isBold ? "bold" : "normal")
      doc.setFontSize(fontSize)
      doc.text(text, margin + indent, cursorY)
      cursorY += fontSize + 8
    }

    const addSection = (title: string, lines: string[]) => {
      addLine(title, 0, 13, true)
      lines.forEach((line) => addLine(line, 10, 10, false))
      cursorY += 8
    }

    addLine("Accounting statements", 0, 16, true)
    addLine(overview.company?.name || companyName || "", 0, 12, false)
    addLine(`Period: ${rangeFrom || "Start"} to ${rangeTo || "End"}`, 0, 11, false)
    cursorY += 8

    addSection("Trial Balance", [
      `Total debit: ${formatMoney(overview.trialBalance.totalDebit)}`,
      `Total credit: ${formatMoney(overview.trialBalance.totalCredit)}`,
      `Difference: ${formatMoney(Math.abs(overview.trialBalance.difference))}`,
    ])

    addSection(
      "Cash Balance",
      overview.cashBalance.rows.length
        ? overview.cashBalance.rows.map((row) => `${row.name}: ${formatSignedMoney(row.closingSide === "credit" ? -row.closingBalance : row.closingBalance)}`)
        : ["No cash ledgers found"]
    )
    addLine(`Net cash balance: ${formatSignedMoney(overview.cashBalance.netBalance)}`, 10, 10, true)

    addSection("Profit / Loss", [
      `Income: ${formatMoney(overview.profitLoss.incomeTotal)}`,
      `Expenses: ${formatMoney(overview.profitLoss.expenseTotal)}`,
      `Net result: ${formatSignedMoney(overview.profitLoss.netProfitLoss)}`,
    ])

    addSection("Balance Sheet", [
      `Assets: ${formatMoney(Math.abs(overview.balanceSheet.assetTotal))}`,
      `Liabilities: ${formatMoney(overview.balanceSheet.liabilityTotal)}`,
      `${overview.balanceSheet.equityLabel}: ${formatSignedMoney(overview.balanceSheet.equityTotal)}`,
      `Difference: ${formatMoney(Math.abs(overview.balanceSheet.difference))}`,
    ])

    addSection(
      "Ledger Balances",
      overview.ledgerBalances.map(
        (row) =>
          `${row.name} | ${row.groupName} | Opening ${formatSignedMoney(row.openingSide === "credit" ? -row.openingBalance : row.openingBalance)} | Closing ${formatSignedMoney(row.closingSide === "credit" ? -row.closingBalance : row.closingBalance)}`
      )
    )

    doc.save(`${(overview.company?.name || companyName || "accounting").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-statements.pdf`)
  }

  return (
    <div className="rounded-2xl border bg-card/60 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:items-end xl:gap-4">
          <div className="space-y-2">
            <Label htmlFor="from-date">From date</Label>
            <Input
              id="from-date"
              type="date"
              value={rangeFrom}
              onChange={(event) => setRangeFrom(event.target.value)}
              className="w-full xl:w-45"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to-date">To date</Label>
            <Input
              id="to-date"
              type="date"
              value={rangeTo}
              onChange={(event) => setRangeTo(event.target.value)}
              className="w-full xl:w-45"
            />
          </div>
          <div className="flex gap-2 pt-0 xl:pt-6">
            <Button onClick={applyFilters} variant="default">
              <Filter className="h-4 w-4" />
              Apply
            </Button>
            <Button onClick={clearFilters} variant="ghost">
              <RotateCcw className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportPdf} variant="outline">
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={exportExcel} variant="secondary">
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Download className="h-3.5 w-3.5" />
        <span>Filtering updates the reports in place and exports use the same visible range.</span>
      </div>
    </div>
  )
}
