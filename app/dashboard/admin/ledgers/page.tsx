import { redirect } from "next/navigation"

import { AppSidebar } from "@/app/dashboard/components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { getCurrentUserRecord, getDefaultCompanyIdForCurrentUser } from "@/lib/session"
import { hasRole } from "@/lib/auth"
import { CreateLedgerForm } from "@/components/forms/create-ledger-form"
import { LedgersTable } from "@/components/admin/ledgers-table"

export default async function Page() {
  const user = await getCurrentUserRecord()

  if (!user || !hasRole(user, "admin")) {
    redirect("/dashboard")
  }

  const companyId = (await getDefaultCompanyIdForCurrentUser()) ?? ""
  const sidebarUser = { name: user.name, email: user.email, role: user.role }

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
                                          <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator className="hidden md:block" />
                                        <BreadcrumbItem>
                                          <BreadcrumbPage>Ledger</BreadcrumbPage>
                                        </BreadcrumbItem>
                                      </BreadcrumbList>
                                    </Breadcrumb>
                                  </div>
                                </header>
        <div className="p-6">
          <h1 className="text-2xl font-semibold mb-4">Admin — Ledgers</h1>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <CreateLedgerForm companyId={companyId} />
            <div>
              <LedgersTable />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
