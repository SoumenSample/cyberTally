"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function CreateCompanyForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [gst, setGst] = useState("")
  const [address, setAddress] = useState({ line1: "", city: "", state: "", postalCode: "", country: "" })
  const [fyStart, setFyStart] = useState("")
  const [fyEnd, setFyEnd] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!name) return setError("Name required")
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: name, gstNumber: gst, address, financialYearStart: fyStart, financialYearEnd: fyEnd })
      })
      if (!res.ok) {
        const b = await res.json()
        setError(b.error || 'Unable to create company')
        return
      }
      setName('')
      setGst('')
      setAddress({ line1: '', city: '', state: '', postalCode: '', country: '' })
      setFyStart('')
      setFyEnd('')
      router.refresh()
    } catch (err) {
      setError('Unable to create company')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={className} {...props}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Company name</FieldLabel>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="gst">GST number</FieldLabel>
            <Input id="gst" value={gst} onChange={(e) => setGst(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="line1">Address line 1</FieldLabel>
            <Input id="line1" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
          </Field>
          <Field>
            <FieldLabel htmlFor="city">City</FieldLabel>
            <Input id="city" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
          </Field>
          <Field>
            <FieldLabel htmlFor="state">State</FieldLabel>
            <Input id="state" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
          </Field>
          <Field>
            <FieldLabel htmlFor="postal">Postal code</FieldLabel>
            <Input id="postal" value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} />
          </Field>
          <Field>
            <FieldLabel htmlFor="country">Country</FieldLabel>
            <Input id="country" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} />
          </Field>
          <Field>
            <FieldLabel htmlFor="fyStart">Financial year start</FieldLabel>
            <Input id="fyStart" placeholder="YYYY-MM-DD or MM-DD" value={fyStart} onChange={(e) => setFyStart(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="fyEnd">Financial year end</FieldLabel>
            <Input id="fyEnd" placeholder="YYYY-MM-DD or MM-DD" value={fyEnd} onChange={(e) => setFyEnd(e.target.value)} />
          </Field>
          {error ? <div className="text-destructive">{error}</div> : null}
          <Field>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create company'}</Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
