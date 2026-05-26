import Link from "next/link"
import { redirect } from "next/navigation"

import { AppSidebar } from "@/app/dashboard/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getCurrentUser } from "@/lib/session"
import { hasRole } from "@/lib/auth"

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
          <h1 className="text-2xl font-semibold mb-4">Admin Panel</h1>
          <div className="grid gap-4">
            <Link href="/dashboard/admin/users" className="rounded-md border px-4 py-2">Manage Users</Link>
            <Link href="/dashboard/admin/companies" className="rounded-md border px-4 py-2">Manage Companies</Link>
            <Link href="/dashboard/admin/invoices" className="rounded-md border px-4 py-2">Sales & Purchase</Link>
            <Link href="/dashboard/admin/vouchers" className="rounded-md border px-4 py-2">Voucher Engine</Link>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
