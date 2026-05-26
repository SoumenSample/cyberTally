import { redirect } from "next/navigation"

import { AppSidebar } from "@/app/dashboard/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getCurrentUser } from "@/lib/session"
import { hasRole } from "@/lib/auth"
import { CreateCompanyForm } from "@/components/forms/create-company-form"
import { CompaniesTable } from "@/components/admin/companies-table"

export default async function Page() {
  const user = await getCurrentUser()

  if (!user || !hasRole(user, "admin")) {
    redirect("/dashboard")
  }

  const sidebarUser = { name: user.name, email: user.email, role: user.role }

  return (
    <SidebarProvider>
      <AppSidebar user={sidebarUser} />
      <SidebarInset>
        <div className="p-6">
          <h1 className="text-2xl font-semibold mb-4">Admin — Companies</h1>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <CreateCompanyForm />
            <div>
              <CompaniesTable />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
