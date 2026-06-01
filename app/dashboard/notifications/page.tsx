import { redirect } from "next/navigation"
import { Bell, CalendarClock, TriangleAlert } from "lucide-react"

import { AppSidebar } from "@/app/dashboard/components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentUserRecord, getDefaultCompanyIdForCurrentUser } from "@/lib/session"
import { hasRole } from "@/lib/auth"
import { getNotificationCenterData } from "@/lib/notifications"
import { NotificationDismissButton } from "@/components/dashboard/notification-dismiss-button"

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(value: string) {
  return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value)) : ""
}

type PageProps = {
  searchParams?: Promise<Record<string, string>> | Record<string, string>
}

export default async function Page({ searchParams }: PageProps) {
  const user = await getCurrentUserRecord()

  if (!user || !hasRole(user, ["admin", "accountant", "employee"])) {
    redirect("/login")
  }

  const sidebarUser = { name: user.name, email: user.email, role: user.role }
  await Promise.resolve(searchParams ?? {})
  const companyId = await getDefaultCompanyIdForCurrentUser()
  const dismissedNotificationIds = Array.isArray(user.dismissedNotifications)
    ? (user.dismissedNotifications as Array<{ notificationId?: string | null }>)
        .map((entry) => entry?.notificationId)
        .filter((value): value is string => Boolean(value))
    : []
  const notificationData = companyId ? await getNotificationCenterData(companyId, dismissedNotificationIds) : null

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
                  <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Notifications</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
          <div className="rounded-2xl border bg-linear-to-br from-background via-background to-muted/40 p-6 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Notifications</p>
                <h1 className="text-3xl font-semibold tracking-tight">
                  {notificationData ? `${notificationData.totalCount} active alerts` : "No company selected"}
                </h1>
                <p className="max-w-3xl text-sm text-muted-foreground">
                  Payment reminders are generated from invoice due dates, and low-stock alerts come from the live inventory snapshot.
                </p>
              </div>
            </div>
          </div>

          {notificationData ? (
            <div className="grid gap-3 md:grid-cols-3">
              <Card size="sm">
                <CardHeader>
                  <CardDescription className="flex items-center gap-2"><Bell className="h-4 w-4" /> Total alerts</CardDescription>
                  <CardTitle>{notificationData.totalCount}</CardTitle>
                </CardHeader>
              </Card>
              <Card size="sm">
                <CardHeader>
                  <CardDescription className="flex items-center gap-2"><CalendarClock className="h-4 w-4" /> Payment reminders</CardDescription>
                  <CardTitle>{notificationData.reminderCount}</CardTitle>
                </CardHeader>
              </Card>
              <Card size="sm">
                <CardHeader>
                  <CardDescription className="flex items-center gap-2"><TriangleAlert className="h-4 w-4" /> Low stock alerts</CardDescription>
                  <CardTitle>{notificationData.lowStockCount}</CardTitle>
                </CardHeader>
              </Card>
            </div>
          ) : null}

          {notificationData ? (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>All notifications</CardTitle>
                  <CardDescription>Critical payment reminders and inventory warnings, sorted by severity.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Priority</TableHead>
                        <TableHead className="text-right">Remove</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notificationData.items.length ? (
                        notificationData.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.kind === "payment-reminder" ? "Payment reminder" : "Low stock"}</TableCell>
                            <TableCell className="font-medium">{item.title}</TableCell>
                            <TableCell>{item.message}</TableCell>
                            <TableCell>{formatDate(item.date)}</TableCell>
                            <TableCell className="text-right">{item.severity}</TableCell>
                            <TableCell className="text-right"><NotificationDismissButton notificationId={item.id} /></TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No notifications were generated.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment reminders</CardTitle>
                    <CardDescription>Invoices due within 7 days or already overdue.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Due</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {notificationData.reminders.length ? (
                          notificationData.reminders.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.invoiceNumber || "Invoice"}</TableCell>
                              <TableCell>{item.invoiceType || "Invoice"}</TableCell>
                              <TableCell>
                                {item.daysUntilDue !== undefined
                                  ? item.daysUntilDue < 0
                                    ? `${Math.abs(item.daysUntilDue)} day(s) overdue`
                                    : `Due in ${item.daysUntilDue} day(s)`
                                  : formatDate(item.date)}
                              </TableCell>
                              <TableCell className="text-right">{formatMoney(item.amount || 0)}</TableCell>
                              <TableCell className="text-right"><NotificationDismissButton notificationId={item.id} /></TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-emerald-600">
                              No payment reminders are due right now.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Low stock alerts</CardTitle>
                    <CardDescription>Inventory items at or below the minimum stock threshold.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Threshold</TableHead>
                          <TableHead className="text-right">Remove</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {notificationData.lowStockAlerts.length ? (
                          notificationData.lowStockAlerts.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.productName}</TableCell>
                              <TableCell className="text-right text-destructive">{item.quantity}</TableCell>
                              <TableCell className="text-right">{item.threshold}</TableCell>
                              <TableCell className="text-right"><NotificationDismissButton notificationId={item.id} /></TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-emerald-600">
                              No low-stock alerts at the moment.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border bg-card/60 p-6">
              <h2 className="text-lg font-semibold">No company selected</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Create a company and set it as the active company to view payment reminders and low-stock alerts.
              </p>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
