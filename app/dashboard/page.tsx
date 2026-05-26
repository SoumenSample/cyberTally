import { redirect } from "next/navigation"

import { AppSidebar } from "@/app/dashboard/components/app-sidebar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { AccountingReportControls } from "../../components/dashboard/accounting-report-controls"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { getCurrentUserRecord, getDefaultCompanyIdForCurrentUser } from "@/lib/session"
import { hasRole } from "@/lib/auth"
import { getAccountingOverview } from "@/lib/accounting"

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

type PageProps = {
  searchParams?: Promise<{
    from?: string
    to?: string
  }> | {
    from?: string
    to?: string
  }
}

export default async function Page({ searchParams }: PageProps) {
  const user = await getCurrentUserRecord()

  if (!user || !hasRole(user, ["admin", "accountant", "employee"])) {
    redirect("/login")
  }

  const sidebarUser = { name: user.name, email: user.email, role: user.role }
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {})
  const companyId = await getDefaultCompanyIdForCurrentUser()
  const overview = companyId ? await getAccountingOverview(companyId, { fromDate: resolvedSearchParams.from ?? null, toDate: resolvedSearchParams.to ?? null }) : null
  const trialDifference = overview?.trialBalance.difference ?? 0
  const cashNet = overview?.cashBalance.netBalance ?? 0
  const profitLoss = overview?.profitLoss.netProfitLoss ?? 0
  const balanceDifference = overview?.balanceSheet.difference ?? 0

  return (
    <SidebarProvider>
      <AppSidebar user={sidebarUser} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Accounting</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Calculations</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
          <div className="rounded-2xl border bg-linear-to-br from-background via-background to-muted/40 p-6 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                  Accounting calculations
                </p>
                <h1 className="text-3xl font-semibold tracking-tight">
                  {overview?.company?.name || "No company selected"}
                </h1>
                <p className="max-w-3xl text-sm text-muted-foreground">
                  Ledger balances, trial balance, cash balance, profit/loss, and balance sheet are
                  derived from the current company&apos;s opening balances and voucher entries.
                </p>
              </div>
            </div>
          </div>

          {overview ? (
            <AccountingReportControls
              key={`${resolvedSearchParams.from ?? ""}-${resolvedSearchParams.to ?? ""}`}
              companyName={overview.company?.name}
              fromDate={resolvedSearchParams.from ?? ""}
              toDate={resolvedSearchParams.to ?? ""}
              overview={overview}
            />
          ) : null}

          {overview ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Card size="sm" className="min-w-40">
                <CardHeader>
                  <CardDescription>Trial balance difference</CardDescription>
                  <CardTitle className={trialDifference === 0 ? "text-emerald-600" : "text-destructive"}>
                    {formatMoney(Math.abs(trialDifference))}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card size="sm" className="min-w-40">
                <CardHeader>
                  <CardDescription>Cash balance</CardDescription>
                  <CardTitle>{formatSignedMoney(cashNet)}</CardTitle>
                </CardHeader>
              </Card>
              <Card size="sm" className="min-w-40">
                <CardHeader>
                  <CardDescription>Profit / Loss</CardDescription>
                  <CardTitle className={profitLoss >= 0 ? "text-emerald-600" : "text-destructive"}>
                    {formatSignedMoney(profitLoss)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card size="sm" className="min-w-40">
                <CardHeader>
                  <CardDescription>Balance sheet difference</CardDescription>
                  <CardTitle className={balanceDifference === 0 ? "text-emerald-600" : "text-destructive"}>
                    {formatMoney(Math.abs(balanceDifference))}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
          ) : null}

          {!overview ? (
            <Card>
              <CardHeader>
                <CardTitle>No company selected</CardTitle>
                <CardDescription>
                  Create a company and set it as the active company to calculate balances.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ledger balances</CardTitle>
                  <CardDescription>
                    Closing balance per ledger after applying opening balance and voucher movements.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ledger</TableHead>
                        <TableHead>Group</TableHead>
                        <TableHead className="text-right">Opening</TableHead>
                        <TableHead className="text-right">Debits</TableHead>
                        <TableHead className="text-right">Credits</TableHead>
                        <TableHead className="text-right">Closing</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overview.ledgerBalances.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell>{row.groupName}</TableCell>
                          <TableCell className="text-right">{formatSignedMoney(row.openingSide === "credit" ? -row.openingBalance : row.openingBalance)}</TableCell>
                          <TableCell className="text-right">{formatMoney(row.movementDebit)}</TableCell>
                          <TableCell className="text-right">{formatMoney(row.movementCredit)}</TableCell>
                          <TableCell className="text-right">{formatSignedMoney(row.closingSide === "credit" ? -row.closingBalance : row.closingBalance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Trial balance</CardTitle>
                    <CardDescription>
                      Debit and credit totals should match when postings are balanced.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Metric</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Total debit</TableCell>
                          <TableCell className="text-right">{formatMoney(overview.trialBalance.totalDebit)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Total credit</TableCell>
                          <TableCell className="text-right">{formatMoney(overview.trialBalance.totalCredit)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Difference</TableCell>
                          <TableCell className={`text-right ${trialDifference === 0 ? "text-emerald-600" : "text-destructive"}`}>
                            {formatMoney(Math.abs(trialDifference))}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cash balance</CardTitle>
                    <CardDescription>
                      Bank accounts and cash-in-hand ledgers considered as liquid cash.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ledger</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {overview.cashBalance.rows.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.name}</TableCell>
                            <TableCell className="text-right">{formatSignedMoney(row.closingSide === "credit" ? -row.closingBalance : row.closingBalance)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell className="font-medium">Net cash balance</TableCell>
                          <TableCell className="text-right font-medium">{formatSignedMoney(overview.cashBalance.netBalance)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Profit / Loss</CardTitle>
                    <CardDescription>
                      Income accounts less expense accounts for the current company.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Section</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Income</TableCell>
                          <TableCell className="text-right">{formatMoney(overview.profitLoss.incomeTotal)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Expenses</TableCell>
                          <TableCell className="text-right">{formatMoney(overview.profitLoss.expenseTotal)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Net result</TableCell>
                          <TableCell className={`text-right font-medium ${profitLoss >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                            {formatSignedMoney(profitLoss)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Balance sheet</CardTitle>
                    <CardDescription>
                      Assets compared with liabilities plus retained earnings from the current period.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Section</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Assets</TableCell>
                          <TableCell className="text-right">{formatMoney(Math.abs(overview.balanceSheet.assetTotal))}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Liabilities</TableCell>
                          <TableCell className="text-right">{formatMoney(overview.balanceSheet.liabilityTotal)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>{overview.balanceSheet.equityLabel}</TableCell>
                          <TableCell className={`text-right ${overview.balanceSheet.equityTotal >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                            {formatSignedMoney(overview.balanceSheet.equityTotal)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Difference</TableCell>
                          <TableCell className={`text-right font-medium ${balanceDifference === 0 ? "text-emerald-600" : "text-destructive"}`}>
                            {formatMoney(Math.abs(balanceDifference))}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
