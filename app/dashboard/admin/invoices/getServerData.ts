import { redirect } from "next/navigation"

import { getCurrentUserRecord, getDefaultCompanyIdForCurrentUser } from "@/lib/session"
import { hasRole } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import Company from "@/models/Company"
import Ledger from "@/models/Ledger"
import Invoice from "@/models/Invoice"
import { summarizeGstInvoices } from "@/lib/gst"

export async function getInvoiceAdminServerData() {
  const user = await getCurrentUserRecord()

  if (!user || !hasRole(user, "admin")) {
    redirect("/dashboard")
  }

  const companyId = (await getDefaultCompanyIdForCurrentUser()) ?? ""

  await connectDB()

  const [company, ledgers, invoices] = await Promise.all([
    companyId ? Company.findById(companyId).select("companyName gstNumber address").lean() : null,
    companyId ? Ledger.find({ company: companyId }).sort({ name: 1 }).lean() : [],
    companyId
      ? Invoice.find({ company: companyId })
          .populate({ path: "partyLedger", select: "name company" })
          .sort({ invoiceDate: -1, createdAt: -1 })
          .lean()
      : [],
  ])

  const serializedInvoices = JSON.parse(JSON.stringify(invoices))
  const serializedLedgers = JSON.parse(JSON.stringify(ledgers))

  const initialReport = summarizeGstInvoices(
    serializedInvoices.map((invoice: any) => ({
      invoiceType: invoice.invoiceType,
      taxableValue: Number(invoice.taxableValue || 0),
      cgstAmount: Number(invoice.cgstAmount || 0),
      sgstAmount: Number(invoice.sgstAmount || 0),
      igstAmount: Number(invoice.igstAmount || 0),
      totalGst: Number(invoice.totalGst || 0),
      grandTotal: Number(invoice.grandTotal || 0),
      reportSign: Number(invoice.reportSign || 1),
    }))
  )

  const sidebarUser = { name: user.name, email: user.email, role: user.role }

  return {
    user,
    sidebarUser,
    companyId,
    company,
    serializedLedgers,
    serializedInvoices,
    initialReport,
  }
}
