import { redirect } from "next/navigation"

import { AppSidebar } from "@/app/dashboard/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getCurrentUser } from "@/lib/session"
import { hasRole } from "@/lib/auth"
import { CreateTransactionForm } from "@/components/forms/create-transaction-form"
import { TransactionsTable } from "@/components/admin/transactions-table"

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
          <h1 className="text-2xl font-semibold mb-4">Admin — Transactions</h1>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <CreateTransactionForm />
            <div>
              <TransactionsTable />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
