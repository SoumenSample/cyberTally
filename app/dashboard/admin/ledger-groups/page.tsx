import { redirect } from "next/navigation"

import { AppSidebar } from "@/app/dashboard/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getCurrentUserRecord, getDefaultCompanyIdForCurrentUser } from "@/lib/session"
import { hasRole } from "@/lib/auth"
import { CreateLedgerGroupForm } from "@/components/forms/create-ledger-group-form"
import { LedgerGroupsTable } from "@/components/admin/ledger-groups-table"

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
        <div className="p-6">
          <h1 className="text-2xl font-semibold mb-4">Admin — Ledger Groups</h1>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <CreateLedgerGroupForm companyId={companyId} />
            <div>
              <LedgerGroupsTable />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
