import Link from "next/link"
import { redirect } from "next/navigation"

import { AppSidebar } from "@/app/dashboard/components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
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
            <header className="flex flex-col items-start gap-2 py-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="px-4">
                <SidebarTrigger className="-ml-1" />
              </div>
              <div className="w-full px-4">
                <Separator />
              </div>
              <div className="w-full px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Admin Panel</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
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
