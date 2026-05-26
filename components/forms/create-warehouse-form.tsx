"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function CreateWarehouseForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [address, setAddress] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!name) return setError("Name required")
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/inventory/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code, address })
      })
      if (!res.ok) {
        const b = await res.json()
        setError(b.error || 'Unable to create warehouse')
        return
      }
      setName('')
      setCode('')
      setAddress('')
      router.refresh()
    } catch (err) {
      setError('Unable to create warehouse')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={className} {...props}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Warehouse name</FieldLabel>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="code">Code</FieldLabel>
            <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="address">Address</FieldLabel>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
          {error ? <div className="text-destructive">{error}</div> : null}
          <Field>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create warehouse'}</Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
