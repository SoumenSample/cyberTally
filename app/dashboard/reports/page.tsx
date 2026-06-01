import { redirect } from "next/navigation"

import { AppSidebar } from "@/app/dashboard/components/app-sidebar"
import { AccountingReportControls } from "@/components/dashboard/accounting-report-controls"
import { ReportingWorkspace } from "@/components/dashboard/reporting-workspace"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { getCurrentUserRecord, getDefaultCompanyIdForCurrentUser } from "@/lib/session"
import { hasRole } from "@/lib/auth"
import { getReportingDashboardData } from "@/lib/reporting"

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
  const reportData = companyId
    ? await getReportingDashboardData(companyId, {
        fromDate: resolvedSearchParams.from ?? null,
        toDate: resolvedSearchParams.to ?? null,
      })
    : null

  return (
    <SidebarProvider>
      <AppSidebar user={sidebarUser} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Reports</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Financial, inventory, and analytics</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
          <div className="rounded-2xl border bg-linear-to-br from-background via-background to-muted/40 p-6 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Reporting system</p>
                <h1 className="text-3xl font-semibold tracking-tight">{reportData?.overview.company?.name || "No company selected"}</h1>
                <p className="max-w-3xl text-sm text-muted-foreground">
                  Trial balance, balance sheet, profit and loss, day book, cash book, inventory stock summary, low stock, movement report, and dashboard analytics are all derived from the live company data.
                </p>
              </div>
            </div>
          </div>

          {reportData ? (
            <AccountingReportControls
              key={`${resolvedSearchParams.from ?? ""}-${resolvedSearchParams.to ?? ""}`}
              companyName={reportData.overview.company?.name}
              fromDate={resolvedSearchParams.from ?? ""}
              toDate={resolvedSearchParams.to ?? ""}
              overview={reportData.overview}
            />
          ) : null}

          {reportData ? <ReportingWorkspace data={reportData} /> : null}

          {!reportData ? (
            <div className="rounded-2xl border bg-card/60 p-6">
              <h2 className="text-lg font-semibold">No company selected</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Create a company and set it as the active company to view reports and analytics.
              </p>
            </div>
          ) : null}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
