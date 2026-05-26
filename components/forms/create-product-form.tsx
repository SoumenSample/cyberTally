"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function CreateProductForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [sku, setSku] = useState("")
  const [hsn, setHsn] = useState("")
  const [rate, setRate] = useState(0)
  const [unit, setUnit] = useState("")
  const [category, setCategory] = useState("")
  const [group, setGroup] = useState("")
  const [openingQty, setOpeningQty] = useState(0)
  const [openingWarehouse, setOpeningWarehouse] = useState("")
  const [units, setUnits] = useState<any[]>([])
  const [cats, setCats] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchLists = async () => {
      const [uRes, cRes, gRes, wRes] = await Promise.all([
        fetch('/api/admin/inventory/units'),
        fetch('/api/admin/inventory/categories'),
        fetch('/api/admin/inventory/stock-groups'),
        fetch('/api/admin/inventory/warehouses'),
      ])
      const [uB, cB, gB, wB] = await Promise.all([uRes.json(), cRes.json(), gRes.json(), wRes.json()])
      if (uRes.ok) setUnits(uB.units || [])
      if (cRes.ok) setCats(cB.categories || [])
      if (gRes.ok) setGroups(gB.groups || [])
      if (wRes.ok) setWarehouses(wB.warehouses || [])
    }
    fetchLists()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!name) return setError("Name required")
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/inventory/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, sku, hsnCode: hsn, unit, category, group, rate: Number(rate), openingStock: { qty: Number(openingQty), warehouse: openingWarehouse } })
      })
      if (!res.ok) {
        const b = await res.json()
        setError(b.error || 'Unable to create product')
        return
      }
      setName('')
      setSku('')
      setHsn('')
      setRate(0)
      setUnit('')
      setCategory('')
      setGroup('')
      setOpeningQty(0)
      setOpeningWarehouse('')
      router.refresh()
    } catch (err) {
      setError('Unable to create product')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={className} {...props}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Product name</FieldLabel>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="sku">SKU</FieldLabel>
            <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="hsn">HSN Code</FieldLabel>
            <Input id="hsn" value={hsn} onChange={(e) => setHsn(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="rate">Rate</FieldLabel>
            <Input id="rate" type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
          </Field>
          <Field>
            <FieldLabel htmlFor="unit">Unit</FieldLabel>
            <select id="unit" value={unit} onChange={(e) => setUnit(e.target.value)} className="h-8 w-full rounded-lg border px-2">
              <option value="">-- select --</option>
              {units.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="category">Category</FieldLabel>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="h-8 w-full rounded-lg border px-2">
              <option value="">-- select --</option>
              {cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="group">Stock group</FieldLabel>
            <select id="group" value={group} onChange={(e) => setGroup(e.target.value)} className="h-8 w-full rounded-lg border px-2">
              <option value="">-- select --</option>
              {groups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="openingQty">Opening stock (qty)</FieldLabel>
            <Input id="openingQty" type="number" value={openingQty} onChange={(e) => setOpeningQty(Number(e.target.value))} />
          </Field>
          <Field>
            <FieldLabel htmlFor="openingWarehouse">Opening warehouse</FieldLabel>
            <select id="openingWarehouse" value={openingWarehouse} onChange={(e) => setOpeningWarehouse(e.target.value)} className="h-8 w-full rounded-lg border px-2">
              <option value="">-- select --</option>
              {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
          </Field>
          {error ? <div className="text-destructive">{error}</div> : null}
          <Field>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create product'}</Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
