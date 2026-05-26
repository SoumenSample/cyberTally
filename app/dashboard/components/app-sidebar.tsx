"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
// helper not required here
import {
  AudioWaveform,
  BookOpen,
  Bot,
  FileText,
  Receipt,
  Users,
  Building,
  Frame,
  Layers,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  ChevronDown,
} from "lucide-react"

// nav sections removed per request
import { NavUser } from "@/app/dashboard/components/nav-user"
import { TeamSwitcher } from "@/app/dashboard/components/team-switcher"
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  teams: [
    {
      name: "Cyber Tally",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      roles: ["admin", "employee"],
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

type SidebarUser = {
  name: string
  email: string
  avatar?: string
  role: "admin" | "accountant" | "employee"
}

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: SidebarUser }) {
  const pathname = usePathname()

  const isDashboardActive = !!pathname && pathname.startsWith("/dashboard") && !pathname.startsWith("/dashboard/admin")
  const isUsersActive = !!pathname && pathname.startsWith("/dashboard/admin/users")
  const isCompaniesActive = !!pathname && pathname.startsWith("/dashboard/admin/companies")
  const isLedgerGroupsActive = !!pathname && pathname.startsWith("/dashboard/admin/ledger-groups")
  const isLedgersActive = !!pathname && pathname.startsWith("/dashboard/admin/ledgers")
  const isVouchersActive = !!pathname && pathname.startsWith("/dashboard/admin/vouchers")
  const isInvoicesActive = !!pathname && pathname.startsWith("/dashboard/admin/invoices")
  const isInvoicesOverviewActive = !!pathname && pathname.startsWith("/dashboard/admin/invoices/overview")
  const isInvoicesBuilderActive = !!pathname && pathname.startsWith("/dashboard/admin/invoices/builder")
  const isInvoicesReturnsActive = !!pathname && pathname.startsWith("/dashboard/admin/invoices/returns")
  const isInvoicesGstEngineActive = !!pathname && pathname.startsWith("/dashboard/admin/invoices/gst-engine")
  const isInvoicesReportsActive = !!pathname && pathname.startsWith("/dashboard/admin/invoices/reports")
  const isUnitsActive = !!pathname && pathname.startsWith("/dashboard/admin/units")
  const isCategoriesActive = !!pathname && pathname.startsWith("/dashboard/admin/categories")
  const isStockGroupsActive = !!pathname && pathname.startsWith("/dashboard/admin/stock-groups")
  const isProductsActive = !!pathname && pathname.startsWith("/dashboard/admin/products")
  const isWarehousesActive = !!pathname && pathname.startsWith("/dashboard/admin/warehouses")
  const isTransactionsActive = !!pathname && pathname.startsWith("/dashboard/admin/transactions")
  const isStockOnHandActive = !!pathname && pathname.startsWith("/dashboard/admin/stock-on-hand")
  const isInventoryActive = isUnitsActive || isCategoriesActive || isStockGroupsActive || isProductsActive || isWarehousesActive || isTransactionsActive || isStockOnHandActive
  const isSalesPurchaseActive = isInvoicesActive

  function InventoryCollapsible() {
    const [open, setOpen] = React.useState<boolean>(() => isInventoryActive)

    return (
      <>
        <div>
          <button
            onClick={() => setOpen((v) => !v)}
            className={`inline-flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted ${isInventoryActive ? 'bg-muted font-semibold' : ''}`}
            aria-expanded={open}
            aria-controls="inventory-submenu"
          >
            <div className="inline-flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span>Inventory</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "-rotate-180" : "rotate-0"}`} />
          </button>
        </div>

        {open ? (
          <SidebarGroupContent>
            <SidebarMenu>
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
            </SidebarMenu>
          </SidebarGroupContent>
        ) : null}
      </>
    )
  }

  function SalesPurchaseCollapsible() {
    const [open, setOpen] = React.useState<boolean>(() => isSalesPurchaseActive)

    return (
      <>
        <div>
          <button
            onClick={() => setOpen((v) => !v)}
            className={`inline-flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted ${isSalesPurchaseActive ? 'bg-muted font-semibold' : ''}`}
            aria-expanded={open}
            aria-controls="sales-purchase-submenu"
          >
            <div className="inline-flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              <span>Sales & Purchase</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "-rotate-180" : "rotate-0"}`} />
          </button>
        </div>

        {open ? (
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuSub>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton href="/dashboard/admin/invoices/builder" isActive={isInvoicesBuilderActive}>
                    <FileText className="h-4 w-4" />
                    <span>Invoice Builder</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </SidebarMenu>
          </SidebarGroupContent>
        ) : null}
      </>
    )
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <div className="px-3 py-2 flex flex-col gap-2">
          <a href="/dashboard" className={`inline-flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted ${isDashboardActive ? 'bg-muted font-semibold' : ''}`}>
            <PieChart className="h-4 w-4" />
            Dashboard
          </a>
          {user.role === "admin" ? (
            <>
              <a href="/dashboard/admin/users" className={`inline-flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted ${isUsersActive ? 'bg-muted font-semibold' : ''}`}>
                <Users className="h-4 w-4" />
                Users
              </a>
              <a href="/dashboard/admin/companies" className={`inline-flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted ${isCompaniesActive ? 'bg-muted font-semibold' : ''}`}>
                <Building className="h-4 w-4" />
                Companies
              </a>
              <a href="/dashboard/admin/ledger-groups" className={`inline-flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted ${isLedgerGroupsActive ? 'bg-muted font-semibold' : ''}`}>
                <BookOpen className="h-4 w-4" />
                Ledger Groups
              </a>
              <a href="/dashboard/admin/ledgers" className={`inline-flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted ${isLedgersActive ? 'bg-muted font-semibold' : ''}`}>
                <AudioWaveform className="h-4 w-4" />
                Ledgers
              </a>
              <a href="/dashboard/admin/vouchers" className={`inline-flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted ${isVouchersActive ? 'bg-muted font-semibold' : ''}`}>
                <FileText className="h-4 w-4" />
                Voucher Engine
              </a>
              <SidebarGroup>
                {/* Sales & Purchase group */}
                <SalesPurchaseCollapsible />
              </SidebarGroup>
              <SidebarGroup>
                {/* Collapsible Inventory group */}
                <InventoryCollapsible />
              </SidebarGroup>
            </>
          ) : null}
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
