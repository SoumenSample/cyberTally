"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
// helper not required here
import {
  AudioWaveform,
  BookOpen,
  Bell,
  FileText,
  Receipt,
  Users,
  Building,
  Frame,
  Layers,
  GalleryVerticalEnd,
  Map,
  PieChart,
  SquareTerminal,
  ChevronDown,
} from "lucide-react"

// nav sections removed per request
import { NavUser } from "@/app/dashboard/components/nav-user"
import { HeaderCalculator } from "@/components/dashboard/header-calculator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"

type SidebarUser = {
  name: string
  email: string
  avatar?: string
  role: "admin" | "accountant" | "employee"
}

type InventoryCollapsibleProps = {
  isInventoryActive: boolean
  isUnitsActive: boolean
  isCategoriesActive: boolean
  isStockGroupsActive: boolean
  isProductsActive: boolean
  isWarehousesActive: boolean
  isTransactionsActive: boolean
  isStockOnHandActive: boolean
}

function InventoryCollapsible({
  isInventoryActive,
  isUnitsActive,
  isCategoriesActive,
  isStockGroupsActive,
  isProductsActive,
  isWarehousesActive,
  isTransactionsActive,
  isStockOnHandActive,
}: InventoryCollapsibleProps) {
  const [open, setOpen] = React.useState<boolean>(() => isInventoryActive)

  return (
    <SidebarGroupContent>
      <SidebarMenu>
        <SidebarMenuItem>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted peer/menu-button group/menu-button outline-hidden transition-[width,height,padding] group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! group-data-[collapsible=icon]:justify-center"
            aria-expanded={open}
            aria-controls="inventory-submenu"
          >
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Inventory</span>
            </div>
            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform group-data-[collapsible=icon]:hidden ${open ? "-rotate-180" : "rotate-0"}`} />
          </button>
        </SidebarMenuItem>
      </SidebarMenu>

      {open ? (
        <SidebarMenuSub>
          <SidebarMenuSubItem>
            <SidebarMenuSubButton href="/dashboard/admin/units" isActive={isUnitsActive}>
              <Frame className="h-4 w-4" />
              <span>Units</span>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
          <SidebarMenuSubItem>
            <SidebarMenuSubButton href="/dashboard/admin/categories" isActive={isCategoriesActive}>
              <BookOpen className="h-4 w-4" />
              <span>Categories</span>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
          <SidebarMenuSubItem>
            <SidebarMenuSubButton href="/dashboard/admin/stock-groups" isActive={isStockGroupsActive}>
              <GalleryVerticalEnd className="h-4 w-4" />
              <span>Stock Groups</span>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
          <SidebarMenuSubItem>
            <SidebarMenuSubButton href="/dashboard/admin/products" isActive={isProductsActive}>
              <SquareTerminal className="h-4 w-4" />
              <span>Products</span>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
          <SidebarMenuSubItem>
            <SidebarMenuSubButton href="/dashboard/admin/warehouses" isActive={isWarehousesActive}>
              <Building className="h-4 w-4" />
              <span>Warehouses</span>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
          <SidebarMenuSubItem>
            <SidebarMenuSubButton href="/dashboard/admin/transactions" isActive={isTransactionsActive}>
              <Map className="h-4 w-4" />
              <span>Transactions</span>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
          <SidebarMenuSubItem>
            <SidebarMenuSubButton href="/dashboard/admin/stock-on-hand" isActive={isStockOnHandActive}>
              <PieChart className="h-4 w-4" />
              <span>Stock on Hand</span>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        </SidebarMenuSub>
      ) : null}
    </SidebarGroupContent>
  )
}

type SalesPurchaseCollapsibleProps = {
  isSalesPurchaseActive: boolean
  isInvoicesBuilderActive: boolean
}

function SalesPurchaseCollapsible({ isSalesPurchaseActive, isInvoicesBuilderActive }: SalesPurchaseCollapsibleProps) {
  const [open, setOpen] = React.useState<boolean>(() => isSalesPurchaseActive)

  return (
    <SidebarGroupContent>
      <SidebarMenu>
        <SidebarMenuItem>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted peer/menu-button group/menu-button outline-hidden transition-[width,height,padding] group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! group-data-[collapsible=icon]:justify-center"
            aria-expanded={open}
            aria-controls="sales-purchase-submenu"
          >
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Sales & Purchase</span>
            </div>
            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform group-data-[collapsible=icon]:hidden ${open ? "-rotate-180" : "rotate-0"}`} />
          </button>
        </SidebarMenuItem>
      </SidebarMenu>

      {open ? (
        <SidebarMenuSub>
          <SidebarMenuSubItem>
            <SidebarMenuSubButton href="/dashboard/admin/invoices/builder" isActive={isInvoicesBuilderActive}>
              <FileText className="h-4 w-4" />
              <span>Invoice Builder</span>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        </SidebarMenuSub>
      ) : null}
    </SidebarGroupContent>
  )
}

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: SidebarUser }) {
  const pathname = usePathname()

  const isDashboardActive = !!pathname && pathname.startsWith("/dashboard") && !pathname.startsWith("/dashboard/admin")
  const isReportsActive = !!pathname && pathname.startsWith("/dashboard/reports")
  const isNotificationsActive = !!pathname && pathname.startsWith("/dashboard/notifications")
  const isUsersActive = !!pathname && pathname.startsWith("/dashboard/admin/users")
  const isCompaniesActive = !!pathname && pathname.startsWith("/dashboard/admin/companies")
  const isLedgerGroupsActive = !!pathname && pathname.startsWith("/dashboard/admin/ledger-groups")
  const isLedgersActive = !!pathname && pathname.startsWith("/dashboard/admin/ledgers")
  const isVouchersActive = !!pathname && pathname.startsWith("/dashboard/admin/vouchers")
  const isSalesPurchaseActive = !!pathname && pathname.startsWith("/dashboard/admin/invoices")
  const isInvoicesBuilderActive = !!pathname && pathname.startsWith("/dashboard/admin/invoices/builder")
  const isUnitsActive = !!pathname && pathname.startsWith("/dashboard/admin/units")
  const isCategoriesActive = !!pathname && pathname.startsWith("/dashboard/admin/categories")
  const isStockGroupsActive = !!pathname && pathname.startsWith("/dashboard/admin/stock-groups")
  const isProductsActive = !!pathname && pathname.startsWith("/dashboard/admin/products")
  const isWarehousesActive = !!pathname && pathname.startsWith("/dashboard/admin/warehouses")
  const isTransactionsActive = !!pathname && pathname.startsWith("/dashboard/admin/transactions")
  const isStockOnHandActive = !!pathname && pathname.startsWith("/dashboard/admin/stock-on-hand")
  const isInventoryActive = isUnitsActive || isCategoriesActive || isStockGroupsActive || isProductsActive || isWarehousesActive || isTransactionsActive || isStockOnHandActive

  return (
    <>
        <Sidebar collapsible="icon" {...props}>
          <SidebarHeader>
            <Link href="/dashboard" className="flex items-center justify-center gap-2 rounded-md px-3 py-3 text-sm font-semibold transition-all group-data-[collapsible=icon]:justify-center">
              <GalleryVerticalEnd className="h-5 w-5 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Cyber Tally</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Overview</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isDashboardActive} tooltip="Dashboard">
                      <Link href="/dashboard">
                        <PieChart />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Reports & Alerts</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isReportsActive} tooltip="Reports">
                      <Link href="/dashboard/reports">
                        <FileText />
                        <span>Reports</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isNotificationsActive} tooltip="Notifications">
                      <Link href="/dashboard/notifications">
                        <Bell />
                        <span>Notifications</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {user.role === "admin" ? (
              <>
                <SidebarGroup>
                  <SidebarGroupLabel>Users & Companies</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isUsersActive} tooltip="Users">
                          <Link href="/dashboard/admin/users">
                            <Users />
                            <span>Users</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isCompaniesActive} tooltip="Companies">
                          <Link href="/dashboard/admin/companies">
                            <Building />
                            <span>Companies</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                  <SidebarGroupLabel>Ledger & Voucher</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isLedgerGroupsActive} tooltip="Ledger Groups">
                          <Link href="/dashboard/admin/ledger-groups">
                            <BookOpen />
                            <span>Ledger Groups</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isLedgersActive} tooltip="Ledgers">
                          <Link href="/dashboard/admin/ledgers">
                            <AudioWaveform />
                            <span>Ledgers</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isVouchersActive} tooltip="Voucher Engine">
                          <Link href="/dashboard/admin/vouchers">
                            <FileText />
                            <span>Voucher Engine</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                  <SidebarGroupLabel>Sales & Purchase</SidebarGroupLabel>
                  <SalesPurchaseCollapsible
                    isSalesPurchaseActive={isSalesPurchaseActive}
                    isInvoicesBuilderActive={isInvoicesBuilderActive}
                  />
                </SidebarGroup>
                <SidebarGroup>
                  <SidebarGroupLabel>Inventory</SidebarGroupLabel>
                  <InventoryCollapsible
                    isInventoryActive={isInventoryActive}
                    isUnitsActive={isUnitsActive}
                    isCategoriesActive={isCategoriesActive}
                    isStockGroupsActive={isStockGroupsActive}
                    isProductsActive={isProductsActive}
                    isWarehousesActive={isWarehousesActive}
                    isTransactionsActive={isTransactionsActive}
                    isStockOnHandActive={isStockOnHandActive}
                  />
                </SidebarGroup>
              </>
            ) : null}
          </SidebarContent>
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
        <SidebarRail />
        </Sidebar>
        <HeaderCalculator />
    </>
  )
}
