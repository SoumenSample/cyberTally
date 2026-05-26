"use client"

import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import { Printer, Plus, RefreshCw, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  calculateInvoiceDocument,
  getInvoiceSummaryLabel,
  invoiceTypes,
  type CalculatedInvoiceItem,
  type InvoiceItemInput,
  type InvoiceType,
} from "@/lib/invoice"
import { createEmptyGstReport, roundCurrency, summarizeGstInvoices, type GstReportSummary } from "@/lib/gst"

type LedgerOption = {
  _id: string
  name: string
  company?: { _id?: string; companyName?: string } | string
}

type InvoiceRow = {
  _id: string
  invoiceType: InvoiceType
  invoiceNumber: string
  invoiceDate?: string
  partyName?: string
  partyGstin?: string
  partyState?: string
  placeOfSupply?: string
  gstMode?: "intra" | "inter"
  reportSign?: number
  taxableValue?: number
  cgstAmount?: number
  sgstAmount?: number
  igstAmount?: number
  totalGst?: number
  grandTotal?: number
  stockEffect?: number
  notes?: string
  items?: CalculatedInvoiceItem[]
  partyLedger?: { _id?: string; name?: string; company?: { _id?: string; companyName?: string } | string } | string
}

type InvoiceWorkbenchView = "overview" | "builder" | "returns" | "live-preview" | "gst-engine" | "reports" | "recent-docs"

type InvoiceWorkbenchProps = {
  companyId: string
  companyName: string
  companyState?: string
  initialLedgers?: LedgerOption[]
  initialInvoices?: InvoiceRow[]
  initialReport?: GstReportSummary
  view?: InvoiceWorkbenchView
}

type InvoiceFormState = {
  invoiceType: InvoiceType
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  partyLedger: string
  partyGstin: string
  partyState: string
  placeOfSupply: string
  notes: string
  items: InvoiceItemInput[]
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(roundCurrency(Number(value || 0)))
}

function createEmptyForm(invoiceDate = new Date().toISOString().slice(0, 10)): InvoiceFormState {
  return {
    invoiceType: "Sales Invoice",
    invoiceNumber: "",
    invoiceDate,
    dueDate: invoiceDate,
    partyLedger: "",
    partyGstin: "",
    partyState: "",
    placeOfSupply: "",
    notes: "",
    items: [{ description: "", hsnCode: "", quantity: 1, unit: "Nos", rate: 0, discount: 0, gstRate: 18 }],
  }
}

function getLedgerCompany(ledger?: LedgerOption | null) {
  const company = ledger?.company
  if (!company) return "Unknown company"
  if (typeof company === "string") return company
  return company.companyName || company._id || "Unknown company"
}

export function InvoicesWorkbench({
  companyId,
  companyName,
  companyState = "",
  initialLedgers = [],
  initialInvoices = [],
  initialReport,
  view,
}: InvoiceWorkbenchProps) {
  const [ledgers, setLedgers] = useState<LedgerOption[]>(initialLedgers)
  const [invoices, setInvoices] = useState<InvoiceRow[]>(initialInvoices)
  const [report, setReport] = useState<GstReportSummary>(initialReport ?? createEmptyGstReport())
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(initialInvoices[0]?._id ?? null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<InvoiceFormState>(() => createEmptyForm())

  const viewSectionsMap: Record<InvoiceWorkbenchView, InvoiceWorkbenchView[]> = {
    overview: ["overview", "recent-docs"],
    builder: ["builder", "live-preview", "recent-docs"],
    returns: ["returns", "live-preview", "recent-docs"],
    "live-preview": ["live-preview"],
    "gst-engine": ["gst-engine"],
    reports: ["reports"],
    "recent-docs": ["recent-docs"],
  }

  const shouldShow = (section: InvoiceWorkbenchView) => {
    if (!view) return true
    const allowed = viewSectionsMap[view]
    return allowed ? allowed.includes(section) : view === section
  }

  const selectedInvoice = useMemo(
    () => invoices.find((invoice) => invoice._id === selectedInvoiceId) || null,
    [invoices, selectedInvoiceId],
  )

  const draftInvoice = useMemo(
    () =>
      calculateInvoiceDocument({
        invoiceType: form.invoiceType,
        items: form.items,
        companyState,
        partyState: form.partyState,
      }),
    [companyState, form.invoiceType, form.items, form.partyState],
  )

  const previewInvoice = useMemo(() => {
    if (!selectedInvoice) {
      return {
        invoiceType: form.invoiceType,
        invoiceNumber: form.invoiceNumber || "Draft",
        invoiceDate: form.invoiceDate,
        partyGstin: form.partyGstin,
        partyState: form.partyState,
        placeOfSupply: form.placeOfSupply,
        gstMode: draftInvoice.gstMode,
        stockEffect: draftInvoice.stockEffect,
        items: draftInvoice.items,
        taxableValue: draftInvoice.taxableValue,
        cgstAmount: draftInvoice.cgstAmount,
        sgstAmount: draftInvoice.sgstAmount,
        igstAmount: draftInvoice.igstAmount,
        totalGst: draftInvoice.totalGst,
        grandTotal: draftInvoice.grandTotal,
        reportSign: draftInvoice.reportSign,
        notes: form.notes,
      }
    }

    const calculated = calculateInvoiceDocument({
      invoiceType: selectedInvoice.invoiceType,
      items: selectedInvoice.items || [],
      companyState,
      partyState: selectedInvoice.partyState || "",
    })

    return {
      ...selectedInvoice,
      gstMode: selectedInvoice.gstMode || calculated.gstMode,
      stockEffect: selectedInvoice.stockEffect ?? calculated.stockEffect,
      items: selectedInvoice.items || calculated.items,
      taxableValue: selectedInvoice.taxableValue ?? calculated.taxableValue,
      cgstAmount: selectedInvoice.cgstAmount ?? calculated.cgstAmount,
      sgstAmount: selectedInvoice.sgstAmount ?? calculated.sgstAmount,
      igstAmount: selectedInvoice.igstAmount ?? calculated.igstAmount,
      totalGst: selectedInvoice.totalGst ?? calculated.totalGst,
      grandTotal: selectedInvoice.grandTotal ?? calculated.grandTotal,
      reportSign: selectedInvoice.reportSign ?? calculated.reportSign,
    }
  }, [companyState, draftInvoice, form.invoiceDate, form.invoiceNumber, form.invoiceType, form.items, form.notes, form.partyGstin, form.partyState, form.placeOfSupply, selectedInvoice])

  const partyLedgerLabel = useMemo(() => {
    const ledger = ledgers.find((item) => item._id === form.partyLedger)
    return ledger?.name || selectedInvoice?.partyName || ""
  }, [form.partyLedger, ledgers, selectedInvoice?.partyName])

  const ledgerMapping = useMemo(() => {
    const nameMatches = (ledger: LedgerOption | undefined, pattern: RegExp) => !!ledger && pattern.test(ledger.name)

    return {
      outputCgst: ledgers.find((ledger) => nameMatches(ledger, /output.*cgst|cgst.*output/i)),
      outputSgst: ledgers.find((ledger) => nameMatches(ledger, /output.*sgst|sgst.*output/i)),
      outputIgst: ledgers.find((ledger) => nameMatches(ledger, /output.*igst|igst.*output/i)),
      inputCgst: ledgers.find((ledger) => nameMatches(ledger, /input.*cgst|cgst.*input/i)),
      inputSgst: ledgers.find((ledger) => nameMatches(ledger, /input.*sgst|sgst.*input/i)),
      inputIgst: ledgers.find((ledger) => nameMatches(ledger, /input.*igst|igst.*input/i)),
    }
  }, [ledgers])

  const pendingSavedSummary = initialReport ?? createEmptyGstReport()
  const currentReport = report.breakdown.length ? report : pendingSavedSummary
  const formatDraftInvoiceDate = previewInvoice.invoiceDate ? new Date(String(previewInvoice.invoiceDate)) : null

  function handleFieldChange<K extends keyof InvoiceFormState>(field: K, value: InvoiceFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleItemChange(index: number, field: keyof InvoiceItemInput, value: string | number) {
    setForm((current) => {
      const items = current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
      return { ...current, items }
    })
  }

  function addItem() {
    setForm((current) => ({
      ...current,
      items: [...current.items, { description: "", hsnCode: "", quantity: 1, unit: "Nos", rate: 0, discount: 0, gstRate: 18 }],
    }))
  }

  function removeItem(index: number) {
    setForm((current) => {
      const items = current.items.filter((_, itemIndex) => itemIndex !== index)
      return { ...current, items: items.length ? items : [{ description: "", hsnCode: "", quantity: 1, unit: "Nos", rate: 0, discount: 0, gstRate: 18 }] }
    })
  }

  function resetForm() {
    setForm(createEmptyForm())
    setSelectedInvoiceId(null)
  }

  function quickSetInvoiceType(nextType: InvoiceType) {
    setForm((current) => ({ ...current, invoiceType: nextType }))
  }

  async function refreshInvoices() {
    const response = await fetch(`/api/admin/invoices?company=${encodeURIComponent(companyId)}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Failed to refresh invoices")
    }

    setInvoices(data.invoices || [])
    setReport(data.report || createEmptyGstReport())
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSaving(true)

    try {
      const response = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: companyId,
          invoiceType: form.invoiceType,
          invoiceNumber: form.invoiceNumber,
          invoiceDate: form.invoiceDate,
          dueDate: form.dueDate,
          partyLedger: form.partyLedger,
          partyGstin: form.partyGstin,
          partyState: form.partyState,
          placeOfSupply: form.placeOfSupply,
          notes: form.notes,
          items: form.items,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save invoice")
      }

      await refreshInvoices()
      if (data.invoice?._id) {
        setSelectedInvoiceId(data.invoice._id)
      }
      resetForm()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save invoice")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setError(null)
    const response = await fetch(`/api/admin/invoices/${id}`, { method: "DELETE" })
    const data = await response.json()

    if (!response.ok) {
      setError(data.error || "Failed to delete invoice")
      return
    }

    await refreshInvoices()
    if (selectedInvoiceId === id) {
      setSelectedInvoiceId(null)
    }
  }

  function handlePrint() {
    window.print()
  }

  useEffect(() => {
    setLedgers(initialLedgers)
    setInvoices(initialInvoices)
    setReport(initialReport ?? createEmptyGstReport())
    if (!selectedInvoiceId && initialInvoices[0]?._id) {
      setSelectedInvoiceId(initialInvoices[0]._id)
    }
  }, [initialInvoices, initialLedgers, initialReport, selectedInvoiceId])

  const isTwoColumn = view === undefined || view === "builder" || view === "overview" || view === "returns"

  return (
    <div className={`grid gap-6 print:block ${isTwoColumn ? "xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]" : "xl:grid-cols-1"}`}>
      <div className="space-y-6 print:hidden xl:max-h-[calc(100vh-6rem)] xl:overflow-auto overflow-x-auto">
        <div style={{ minWidth: 1100 }}>
        {/* Overview temporarily disabled - kept only Invoice Builder for now
        {shouldShow("overview") && (
          <Card id="sales-purchase-overview" className="border-0 bg-linear-to-br from-background via-background to-muted/30 shadow-sm scroll-mt-24">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                <span>Sales & Purchase</span>
                <span>GST Engine</span>
                <span>Returns</span>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl">Invoice workspace for {companyName}</CardTitle>
                <CardDescription>Create sales invoices, vendor bills, returns, and GST summaries from the same ledger-backed workflow.</CardDescription>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="border"><CardHeader><CardDescription>Outward documents</CardDescription><CardTitle>{currentReport.gstr1.documentCount}</CardTitle></CardHeader></Card>
                <Card className="border"><CardHeader><CardDescription>Input credit</CardDescription><CardTitle>{formatMoney(currentReport.gstr3b.inputTax)}</CardTitle></CardHeader></Card>
                <Card className="border"><CardHeader><CardDescription>Output tax</CardDescription><CardTitle>{formatMoney(currentReport.gstr3b.outwardTax)}</CardTitle></CardHeader></Card>
                <Card className="border"><CardHeader><CardDescription>Net liability</CardDescription><CardTitle className={currentReport.taxSummary.netLiability >= 0 ? "text-emerald-600" : "text-destructive"}>{formatMoney(Math.abs(currentReport.taxSummary.netLiability))}</CardTitle></CardHeader></Card>
              </div>
            </CardHeader>
          </Card>
        )}
        */}

        {shouldShow("builder") && (
          <Card id="invoice-builder" className="scroll-mt-24">
            <CardHeader>
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <CardTitle>Invoice Builder</CardTitle>
                  <CardDescription>Sales invoice, purchase invoice, returns, credit notes, and debit notes all reuse the same item table and GST engine.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => quickSetInvoiceType("Sales Invoice")}>Sales Invoice</Button>
                  <Button type="button" variant="secondary" onClick={() => quickSetInvoiceType("Purchase Invoice")}>Purchase Invoice</Button>
                  <Button type="button" variant="secondary" onClick={() => quickSetInvoiceType("Sales Return")}>Sales Return</Button>
                  <Button type="button" variant="secondary" onClick={() => quickSetInvoiceType("Purchase Return")}>Purchase Return</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-6">
                <FieldGroup className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="invoiceType">Document type</FieldLabel>
                    <select id="invoiceType" value={form.invoiceType} onChange={(event) => handleFieldChange("invoiceType", event.target.value as InvoiceType)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      {invoiceTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="invoiceNumber">Invoice number</FieldLabel>
                    <Input id="invoiceNumber" value={form.invoiceNumber} onChange={(event) => handleFieldChange("invoiceNumber", event.target.value)} placeholder="Auto-generate if blank" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="invoiceDate">Invoice date</FieldLabel>
                    <Input id="invoiceDate" type="date" value={form.invoiceDate} onChange={(event) => handleFieldChange("invoiceDate", event.target.value)} required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="dueDate">Due date</FieldLabel>
                    <Input id="dueDate" type="date" value={form.dueDate} onChange={(event) => handleFieldChange("dueDate", event.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="partyLedger">Customer / vendor ledger</FieldLabel>
                    <select id="partyLedger" value={form.partyLedger} onChange={(event) => handleFieldChange("partyLedger", event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">Select ledger</option>
                      {ledgers.map((ledger) => <option key={ledger._id} value={ledger._id}>{ledger.name}</option>)}
                    </select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="partyGstin">Party GSTIN</FieldLabel>
                    <Input id="partyGstin" value={form.partyGstin} onChange={(event) => handleFieldChange("partyGstin", event.target.value)} placeholder="Optional party GST number" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="partyState">Party state</FieldLabel>
                    <Input id="partyState" value={form.partyState} onChange={(event) => handleFieldChange("partyState", event.target.value)} placeholder="Used for CGST/SGST vs IGST split" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="placeOfSupply">Place of supply</FieldLabel>
                    <Input id="placeOfSupply" value={form.placeOfSupply} onChange={(event) => handleFieldChange("placeOfSupply", event.target.value)} placeholder="State or city" />
                  </Field>
                  <Field className="md:col-span-2">
                    <FieldLabel htmlFor="notes">Notes</FieldLabel>
                    <textarea id="notes" value={form.notes} onChange={(event) => handleFieldChange("notes", event.target.value)} className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Optional invoice narration or document remarks" />
                  </Field>
                </FieldGroup>

                <div className="space-y-3 rounded-2xl border bg-muted/15 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-medium">Item table</h3>
                      <p className="text-xs text-muted-foreground">GST is calculated per line, then split into CGST/SGST or IGST based on state.</p>
                    </div>
                    <Button type="button" variant="secondary" onClick={addItem}><Plus className="mr-2 h-4 w-4" />Add item</Button>
                  </div>

                  <div className="overflow-x-auto">
                    <div className="grid gap-3" style={{ minWidth: 980 }}>
                      {form.items.map((item, index) => {
                      const itemPreview = calculateInvoiceDocument({ invoiceType: form.invoiceType, items: [item], companyState, partyState: form.partyState }).items[0]
                      return (
                        <div key={index} className="grid gap-3 rounded-xl border bg-background p-3 xl:grid-cols-[1.6fr_110px_90px_90px_110px_110px_90px_auto] xl:items-end">
                          <Field><FieldLabel>Description</FieldLabel><Input value={item.description || ""} onChange={(event) => handleItemChange(index, "description", event.target.value)} placeholder="Item description" /></Field>
                          <Field><FieldLabel>HSN</FieldLabel><Input value={item.hsnCode || ""} onChange={(event) => handleItemChange(index, "hsnCode", event.target.value)} placeholder="HSN" /></Field>
                          <Field><FieldLabel>Qty</FieldLabel><Input type="number" min="0" step="0.001" value={item.quantity ?? 1} onChange={(event) => handleItemChange(index, "quantity", Number(event.target.value))} /></Field>
                          <Field><FieldLabel>Unit</FieldLabel><Input value={item.unit || "Nos"} onChange={(event) => handleItemChange(index, "unit", event.target.value)} /></Field>
                          <Field><FieldLabel>Rate</FieldLabel><Input type="number" min="0" step="0.01" value={item.rate ?? 0} onChange={(event) => handleItemChange(index, "rate", Number(event.target.value))} /></Field>
                          <Field><FieldLabel>Discount</FieldLabel><Input type="number" min="0" step="0.01" value={item.discount ?? 0} onChange={(event) => handleItemChange(index, "discount", Number(event.target.value))} /></Field>
                          <Field><FieldLabel>GST %</FieldLabel><Input type="number" min="0" step="0.01" value={item.gstRate ?? 18} onChange={(event) => handleItemChange(index, "gstRate", Number(event.target.value))} /></Field>
                          <div className="flex flex-col gap-2 xl:items-end">
                            <Button type="button" variant="ghost" onClick={() => removeItem(index)} disabled={form.items.length <= 1}>Remove</Button>
                            <div className="text-right text-xs text-muted-foreground"><div>Line total</div><div className="font-medium text-foreground">{formatMoney(itemPreview.lineTotal)}</div></div>
                          </div>
                        </div>
                      )
                      })}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Card className="border"><CardHeader><CardDescription>Taxable value</CardDescription><CardTitle>{formatMoney(draftInvoice.taxableValue)}</CardTitle></CardHeader></Card>
                    <Card className="border"><CardHeader><CardDescription>CGST + SGST</CardDescription><CardTitle>{formatMoney(draftInvoice.cgstAmount + draftInvoice.sgstAmount)}</CardTitle></CardHeader></Card>
                    <Card className="border"><CardHeader><CardDescription>IGST</CardDescription><CardTitle>{formatMoney(draftInvoice.igstAmount)}</CardTitle></CardHeader></Card>
                    <Card className="border"><CardHeader><CardDescription>Stock effect</CardDescription><CardTitle className={draftInvoice.stockEffect < 0 ? "text-destructive" : "text-emerald-600"}>{draftInvoice.stockEffect < 0 ? "Stock decrease" : "Stock increase"}</CardTitle></CardHeader></Card>
                  </div>
                </div>

                {error ? <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div> : null}

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save invoice"}</Button>
                  <Button type="button" variant="secondary" onClick={resetForm}>Reset form</Button>
                  <Button type="button" variant="secondary" onClick={refreshInvoices}><RefreshCw className="mr-2 h-4 w-4" />Refresh documents</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Returns temporarily disabled
        {shouldShow("returns") && (
          <Card id="returns-and-notes" className="scroll-mt-24">
            <CardHeader><CardTitle>Returns and notes</CardTitle><CardDescription>Sales return, purchase return, credit note, and debit note are stored as first-class invoice documents and flow into GST summaries.</CardDescription></CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border bg-background p-3"><div className="text-sm font-medium">Sales return</div><div className="text-xs text-muted-foreground">Reverses outward tax and increases stock back into hand.</div></div>
                <div className="rounded-xl border bg-background p-3"><div className="text-sm font-medium">Purchase return</div><div className="text-xs text-muted-foreground">Reduces vendor liability and lowers input tax credits.</div></div>
                <div className="rounded-xl border bg-background p-3"><div className="text-sm font-medium">Credit note</div><div className="text-xs text-muted-foreground">Useful for sales-side adjustments and credit memos.</div></div>
                <div className="rounded-xl border bg-background p-3"><div className="text-sm font-medium">Debit note</div><div className="text-xs text-muted-foreground">Useful for purchase-side adjustments and supplier notes.</div></div>
              </div>
            </CardContent>
          </Card>
        )}
        */}

        {shouldShow("recent-docs") && (
          <Card>
            <CardHeader><CardTitle>Recent documents</CardTitle><CardDescription>Click a row to load it into the printable preview.</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Party</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice._id} className={selectedInvoiceId === invoice._id ? "bg-muted/40" : ""}>
                      <TableCell><button type="button" className="text-left" onClick={() => setSelectedInvoiceId(invoice._id)}><div className="font-medium">{invoice.invoiceNumber}</div><div className="text-xs text-muted-foreground">{invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString("en-IN") : ""}</div></button></TableCell>
                      <TableCell><button type="button" className="text-left" onClick={() => setSelectedInvoiceId(invoice._id)}><div className="font-medium">{invoice.partyName || "Unnamed party"}</div><div className="text-xs text-muted-foreground">{invoice.partyState || "No state"}</div></button></TableCell>
                      <TableCell>{invoice.invoiceType}</TableCell>
                      <TableCell className="text-right">{formatMoney(Number(invoice.grandTotal || 0))}</TableCell>
                      <TableCell><div className="flex gap-2"><Button type="button" size="sm" variant="ghost" onClick={() => setSelectedInvoiceId(invoice._id)}>Load</Button><Button type="button" size="sm" variant="destructive" onClick={() => handleDelete(invoice._id)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button></div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        </div>
      </div>

      <div className="space-y-6 print:block print:space-y-0 xl:max-h-[calc(100vh-6rem)] xl:overflow-auto">
        {shouldShow("live-preview") && (
          <Card id="live-preview" className="print:shadow-none print:ring-0 scroll-mt-24">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div><CardTitle>Live preview</CardTitle><CardDescription>Print this panel to save a PDF of the active document.</CardDescription></div>
                <div className="flex gap-2"><Button type="button" variant="secondary" onClick={() => setSelectedInvoiceId(null)}>New draft</Button><Button type="button" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" />Print / PDF</Button></div>
              </div>
            </CardHeader>
            <CardContent>
              <style>{`
                /* Print stylesheet for invoice */
                @media print {
                  body * { visibility: hidden; }
                  #invoice-print-preview, #invoice-print-preview * { visibility: visible; }
                  #invoice-print-preview { position: absolute; left: 0; top: 0; width: 210mm; box-shadow: none; }
                }
                @media screen {
                  #invoice-print-preview { background: white; border-radius: 8px; }
                }
                #invoice-print-preview { margin: 0 auto; padding: 16px; }
                .invoice-table { width: 100%; border-collapse: collapse; }
                .invoice-table th, .invoice-table td { border-bottom: 1px solid #e6e6e6; padding: 8px 6px; text-align: left; }
                .invoice-meta { font-size: 0.95rem; }
              `}</style>

              <div id="invoice-print-preview" className="space-y-4 rounded-2xl border bg-background p-4 print:border-0 print:p-0">
                <header className="flex items-start justify-between border-b pb-4">
                  <div>
                    <div className="text-lg font-semibold">{companyName}</div>
                    <div className="text-sm text-muted-foreground">{companyState}</div>
                  </div>
                  <div className="text-right invoice-meta">
                    <div className="text-xl font-semibold">{previewInvoice.invoiceType}</div>
                    <div className="mt-1">Invoice: <strong>{previewInvoice.invoiceNumber}</strong></div>
                    <div>Date: {formatDraftInvoiceDate ? formatDraftInvoiceDate.toLocaleDateString("en-IN") : ""}</div>
                    <div className="text-sm text-muted-foreground">{getInvoiceSummaryLabel(previewInvoice.invoiceType)} | {previewInvoice.gstMode === "inter" ? "IGST" : "CGST + SGST"}</div>
                  </div>
                </header>

                <section className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Bill to</div>
                    <div className="font-medium">{selectedInvoice?.partyName || partyLedgerLabel || "Selected ledger"}</div>
                    <div className="text-sm text-muted-foreground">GSTIN: {previewInvoice.partyGstin || "-"}</div>
                    <div className="text-sm text-muted-foreground">State: {previewInvoice.partyState || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Place of supply</div>
                    <div className="font-medium">{previewInvoice.placeOfSupply || companyState || "Not specified"}</div>
                    <div className="text-sm text-muted-foreground">Stock effect: {previewInvoice.stockEffect < 0 ? "decrease" : "increase"}</div>
                  </div>
                </section>

                <section>
                  <table className="invoice-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>HSN</th>
                        <th className="text-right">Qty</th>
                        <th className="text-right">Rate</th>
                        <th className="text-right">GST</th>
                        <th className="text-right">Line total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewInvoice.items.map((item, index) => (
                        <tr key={`print-${index}`}>
                          <td>{item.description || "Item"}</td>
                          <td>{item.hsnCode || "-"}</td>
                          <td className="text-right">{item.quantity}</td>
                          <td className="text-right">{formatMoney(item.rate)}</td>
                          <td className="text-right">{formatMoney(item.totalGst)}</td>
                          <td className="text-right">{formatMoney(item.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <section className="flex justify-end">
                  <div className="w-72 space-y-2">
                    <div className="flex justify-between"><span>Taxable value</span><span>{formatMoney(previewInvoice.taxableValue)}</span></div>
                    <div className="flex justify-between"><span>CGST</span><span>{formatMoney(previewInvoice.cgstAmount)}</span></div>
                    <div className="flex justify-between"><span>SGST</span><span>{formatMoney(previewInvoice.sgstAmount)}</span></div>
                    <div className="flex justify-between"><span>IGST</span><span>{formatMoney(previewInvoice.igstAmount)}</span></div>
                    <div className="flex justify-between text-base font-semibold"><span>Grand total</span><span>{formatMoney(previewInvoice.grandTotal)}</span></div>
                  </div>
                </section>

                {previewInvoice.notes ? <div className="rounded-xl border bg-background p-3 text-sm"><div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Notes</div><div className="mt-1">{previewInvoice.notes}</div></div> : null}

                <footer className="pt-6 text-sm text-muted-foreground border-t">
                  This is a computer-generated invoice.
                </footer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* GST engine temporarily disabled
        {shouldShow("gst-engine") && (
          <Card id="gst-engine" className="scroll-mt-24">
            <CardHeader><CardTitle>GST engine</CardTitle><CardDescription>CGST, SGST, IGST, and the tax ledger mapping layer used by Module 16.</CardDescription></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border bg-background p-3"><div className="font-medium">CGST / SGST</div><div className="text-muted-foreground">Used for intra-state invoices and split evenly across the two tax heads.</div></div>
                <div className="rounded-xl border bg-background p-3"><div className="font-medium">IGST</div><div className="text-muted-foreground">Used when the company and party states differ.</div></div>
                <div className="rounded-xl border bg-background p-3"><div className="font-medium">GST split</div><div className="text-muted-foreground">The preview and reports use the same GST mode and split calculations.</div></div>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {[["Output CGST", ledgerMapping.outputCgst], ["Output SGST", ledgerMapping.outputSgst], ["Output IGST", ledgerMapping.outputIgst], ["Input CGST", ledgerMapping.inputCgst], ["Input SGST", ledgerMapping.inputSgst], ["Input IGST", ledgerMapping.inputIgst]].map(([label, ledger]) => (
                  <div key={String(label)} className="rounded-xl border bg-background p-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
                    <div className="mt-1 font-medium">{ledger ? ledger.name : "Not mapped"}</div>
                    <div className="text-xs text-muted-foreground">{ledger ? `Ledger linked in ${getLedgerCompany(ledger as LedgerOption)}.` : "Create a matching ledger to complete tax mapping."}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        */}

        {/* Reports temporarily disabled
        {shouldShow("reports") && (
          <Card id="gst-reports" className="scroll-mt-24">
            <CardHeader><CardTitle>GST reports</CardTitle><CardDescription>GSTR-1, GSTR-3B, and tax summary built from the saved invoice register.</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <Card className="border"><CardHeader><CardDescription>GSTR-1 taxable</CardDescription><CardTitle>{formatMoney(currentReport.gstr1.taxableValue)}</CardTitle></CardHeader></Card>
                <Card className="border"><CardHeader><CardDescription>GSTR-3B payable</CardDescription><CardTitle className={currentReport.gstr3b.netTaxPayable >= 0 ? "text-emerald-600" : "text-destructive"}>{formatMoney(Math.abs(currentReport.gstr3b.netTaxPayable))}</CardTitle></CardHeader></Card>
                <Card className="border"><CardHeader><CardDescription>Input tax credit</CardDescription><CardTitle>{formatMoney(currentReport.taxSummary.inputTax)}</CardTitle></CardHeader></Card>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Document</TableHead><TableHead className="text-right">Count</TableHead><TableHead className="text-right">Taxable</TableHead><TableHead className="text-right">Tax</TableHead><TableHead className="text-right">Grand total</TableHead></TableRow></TableHeader>
                <TableBody>{currentReport.breakdown.map((row, i) => (
                  <TableRow key={`${row.invoiceType ?? 'doc'}-${i}`}>
                    <TableCell className="font-medium">{row.invoiceType}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                    <TableCell className="text-right">{formatMoney(row.taxableValue)}</TableCell>
                    <TableCell className="text-right">{formatMoney(row.totalTax)}</TableCell>
                    <TableCell className="text-right">{formatMoney(row.grandTotal)}</TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border bg-background p-3"><div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">CGST</div><div className="mt-1 text-lg font-semibold">{formatMoney(currentReport.taxSummary.cgst)}</div></div>
                <div className="rounded-xl border bg-background p-3"><div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">SGST</div><div className="mt-1 text-lg font-semibold">{formatMoney(currentReport.taxSummary.sgst)}</div></div>
                <div className="rounded-xl border bg-background p-3"><div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">IGST</div><div className="mt-1 text-lg font-semibold">{formatMoney(currentReport.taxSummary.igst)}</div></div>
                <div className="rounded-xl border bg-background p-3"><div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Net liability</div><div className={`mt-1 text-lg font-semibold ${currentReport.taxSummary.netLiability >= 0 ? "text-emerald-600" : "text-destructive"}`}>{formatMoney(Math.abs(currentReport.taxSummary.netLiability))}</div></div>
              </div>
            </CardContent>
          </Card>
        )}
        */}
      </div>
    </div>
  )
}