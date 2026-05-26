"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const GROUP_TYPES = ["Assets", "Liabilities", "Income", "Expenses", "Bank Accounts", "Cash-in-Hand", "Sales Accounts", "Purchase Accounts"]

export function CreateLedgerGroupForm({ className, companyId, ...props }: React.ComponentProps<"div"> & { companyId?: string }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [type, setType] = useState(GROUP_TYPES[0])
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!name) return setError("Name required")
    if (!companyId) return setError("Company required")
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/ledger-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, company: companyId })
      })
      if (!res.ok) {
        const b = await res.json()
        setError(b.error || 'Unable to create group')
        return
      }
      setName('')
      router.refresh()
    } catch (err) {
      setError('Unable to create group')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={className} {...props}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Group name</FieldLabel>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="type">Type</FieldLabel>
            <select id="type" value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded border px-2 py-1">
              {GROUP_TYPES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          {error ? <div className="text-destructive">{error}</div> : null}
          <Field>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create group'}</Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
