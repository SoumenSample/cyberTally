"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function CreateLedgerForm({ className, companyId, ...props }: React.ComponentProps<"div"> & { companyId?: string }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [groupId, setGroupId] = useState("")
  const [openingBalance, setOpeningBalance] = useState(0)
  const [balanceType, setBalanceType] = useState("debit")
  const [groups, setGroups] = useState<any[]>([])
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/admin/ledger-groups')
      const b = await res.json()
      if (res.ok) setGroups(b.groups || [])
    } catch (err) {}
  }

  useEffect(() => { fetchGroups() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!name) return setError("Name required")
    if (!groupId) return setError("Group required")
    if (!companyId) return setError("Company required")
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/ledgers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, group: groupId, openingBalance, balanceType, company: companyId })
      })
      if (!res.ok) {
        const b = await res.json()
        setError(b.error || 'Unable to create ledger')
        return
      }
      setName('')
      setGroupId('')
      setOpeningBalance(0)
      router.refresh()
    } catch (err) {
      setError('Unable to create ledger')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={className} {...props}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Ledger name</FieldLabel>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="group">Group</FieldLabel>
            <select id="group" value={groupId} onChange={(e) => setGroupId(e.target.value)} className="w-full rounded border px-2 py-1">
              <option value="">Select group</option>
              {groups.map((g) => <option key={g._id} value={g._id}>{g.name} — {g.type}</option>)}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="opening">Opening balance</FieldLabel>
            <Input id="opening" type="number" value={openingBalance} onChange={(e) => setOpeningBalance(Number(e.target.value))} />
          </Field>
          <Field>
            <FieldLabel htmlFor="balanceType">Balance type</FieldLabel>
            <select id="balanceType" value={balanceType} onChange={(e) => setBalanceType(e.target.value)} className="w-full rounded border px-2 py-1">
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
            </select>
          </Field>
          {error ? <div className="text-destructive">{error}</div> : null}
          <Field>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create ledger'}</Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
