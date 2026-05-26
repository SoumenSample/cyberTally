import { redirect } from "next/navigation"

import { AppSidebar } from "@/app/dashboard/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { InvoicesWorkbench } from "@/components/admin/invoices-workbench"
import { getInvoiceAdminServerData } from "@/app/dashboard/admin/invoices/getServerData"

export default async function Page() {
  const { sidebarUser, companyId, company, serializedLedgers, serializedInvoices, initialReport } = await getInvoiceAdminServerData()

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
                  <BreadcrumbLink href="#">Admin</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Sales & Purchase — Returns & Notes</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
          <InvoicesWorkbench
            view="returns"
            companyId={companyId}
            companyName={company?.companyName || "Sales & Purchase"}
            companyState={company?.address?.state || ""}
            initialLedgers={serializedLedgers}
            initialInvoices={serializedInvoices}
            initialReport={initialReport}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
