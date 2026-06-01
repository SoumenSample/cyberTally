"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { voucherTypes, type VoucherType } from "@/lib/voucher"

type VoucherEntry = {
  ledger: string
  side: "debit" | "credit"
  amount: string
  narration: string
}

type LedgerOption = {
  _id: string
  name: string
  company?: { _id?: string } | string
}

function formatToday() {
  return new Date().toISOString().slice(0, 10)
}

export function CreateVoucherForm({ className, companyId, ...props }: React.ComponentProps<"div"> & { companyId?: string }) {
  const router = useRouter()
  const [voucherType, setVoucherType] = useState<VoucherType>("Journal")
  const [voucherNumber, setVoucherNumber] = useState("")
  const [voucherDate, setVoucherDate] = useState(formatToday())
  const [narration, setNarration] = useState("")
  const [entries, setEntries] = useState<VoucherEntry[]>([
    { ledger: "", side: "debit", amount: "", narration: "" },
    { ledger: "", side: "credit", amount: "", narration: "" },
  ])
  const [ledgers, setLedgers] = useState<LedgerOption[]>([])
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/ledgers")
        const body = await res.json()
        if (res.ok) {
          setLedgers(body.ledgers || [])
        }
      } catch {
        setLedgers([])
      }
    })()
  }, [])

  const companyLedgers = useMemo(
    () => ledgers.filter((ledger) => {
      if (!companyId) return true
      const ledgerCompany = typeof ledger.company === "string" ? ledger.company : ledger.company?._id
      return String(ledgerCompany) === companyId
    }),
    [ledgers, companyId]
  )

  const totals = useMemo(() => {
    return entries.reduce(
      (acc, entry) => {
        const amount = Number(entry.amount || 0)
        if (entry.side === "debit") acc.debit += amount
        if (entry.side === "credit") acc.credit += amount
        return acc
      },
      { debit: 0, credit: 0 }
    )
  }, [entries])

  const addEntry = () => {
    setEntries((current) => [...current, { ledger: "", side: "debit", amount: "", narration: "" }])
  }

  const updateEntry = (index: number, field: keyof VoucherEntry, value: string) => {
    setEntries((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, [field]: value } : entry))
  }

  const removeEntry = (index: number) => {
    if (entries.length <= 2) return
    setEntries((current) => current.filter((_, entryIndex) => entryIndex !== index))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")

    if (!companyId) {
      setError("Company required")
      return
    }

    if (entries.length < 2) {
      setError("Add at least two voucher entries")
      return
    }

    if (totals.debit <= 0 || totals.credit <= 0 || totals.debit !== totals.credit) {
      setError("Debit and credit totals must match")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch("/api/admin/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: companyId,
          voucherType,
          voucherNumber: voucherNumber || undefined,
          voucherDate,
          narration,
          entries: entries.map((entry) => ({
            ledger: entry.ledger,
            side: entry.side,
            amount: Number(entry.amount),
            narration: entry.narration,
          })),
        }),
      })

      const body = await res.json()

      if (!res.ok) {
        setError(body.error || "Unable to create voucher")
        return
      }

      setVoucherType("Journal")
      setVoucherNumber("")
      setVoucherDate(formatToday())
      setNarration("")
      setEntries([
        { ledger: "", side: "debit", amount: "", narration: "" },
        { ledger: "", side: "credit", amount: "", narration: "" },
      ])
      router.refresh()
    } catch {
      setError("Unable to create voucher")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={className} {...props}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="voucherType">Voucher type</FieldLabel>
            <select id="voucherType" value={voucherType} onChange={(event) => setVoucherType(event.target.value as VoucherType)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {voucherTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="voucherNumber">Voucher number</FieldLabel>
            <Input id="voucherNumber" value={voucherNumber} onChange={(event) => setVoucherNumber(event.target.value)} placeholder="Auto-generate if blank" />
          </Field>
          <Field>
            <FieldLabel htmlFor="voucherDate">Voucher date</FieldLabel>
            <Input id="voucherDate" type="date" value={voucherDate} onChange={(event) => setVoucherDate(event.target.value)} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="narration">Narration</FieldLabel>
            <Input id="narration" value={narration} onChange={(event) => setNarration(event.target.value)} placeholder="Short voucher narration" />
          </Field>
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium">Double entry lines</h3>
                <p className="text-xs text-muted-foreground">Debit and credit totals must balance before saving.</p>
              </div>
              <Button type="button" variant="secondary" onClick={addEntry}>Add line</Button>
            </div>
            <div className="grid gap-3">
              {entries.map((entry, index) => (
                <div key={index} className="grid gap-3 rounded-md border bg-muted/20 p-3 md:grid-cols-[minmax(0,1.5fr)_140px_120px_minmax(0,1fr)_auto] md:items-end">
                  <Field>
                    <FieldLabel htmlFor={`ledger-${index}`}>Ledger</FieldLabel>
                    <select id={`ledger-${index}`} value={entry.ledger} onChange={(event) => updateEntry(index, "ledger", event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">Select ledger</option>
                      {companyLedgers.map((ledger) => (
                        <option key={ledger._id} value={ledger._id}>{ledger.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`side-${index}`}>Side</FieldLabel>
                    <select id={`side-${index}`} value={entry.side} onChange={(event) => updateEntry(index, "side", event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`amount-${index}`}>Amount</FieldLabel>
                    <Input id={`amount-${index}`} type="number" min="0" step="0.01" value={entry.amount} onChange={(event) => updateEntry(index, "amount", event.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`entryNarration-${index}`}>Line narration</FieldLabel>
                    <Input id={`entryNarration-${index}`} value={entry.narration} onChange={(event) => updateEntry(index, "narration", event.target.value)} />
                  </Field>
                  <div className="flex md:justify-end">
                    <Button type="button" variant="ghost" disabled={entries.length <= 2} onClick={() => removeEntry(index)}>Remove</Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-background px-3 py-2 text-sm">
              <span>Debit total: {totals.debit.toFixed(2)}</span>
              <span>Credit total: {totals.credit.toFixed(2)}</span>
              <span className={totals.debit === totals.credit ? "text-emerald-600" : "text-destructive"}>
                {totals.debit === totals.credit ? "Balanced" : "Unbalanced"}
              </span>
            </div>
          </div>
          {error ? <div className="text-destructive">{error}</div> : null}
          <Field>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create voucher"}</Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
