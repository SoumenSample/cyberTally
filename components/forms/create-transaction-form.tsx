"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function CreateTransactionForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter()
  const [product, setProduct] = useState("")
  const [qty, setQty] = useState(0)
  const [rate, setRate] = useState(0)
  const [type, setType] = useState<"in"|"out"|"adjustment"|"transfer">("in")
  const [warehouseFrom, setWarehouseFrom] = useState("")
  const [warehouseTo, setWarehouseTo] = useState("")
  const [reference, setReference] = useState("")
  const [products, setProducts] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchLists = async () => {
      const [pRes, wRes] = await Promise.all([
        fetch('/api/admin/inventory/products'),
        fetch('/api/admin/inventory/warehouses'),
      ])
      const [pB, wB] = await Promise.all([pRes.json(), wRes.json()])
      if (pRes.ok) setProducts(pB.products || [])
      if (wRes.ok) setWarehouses(wB.warehouses || [])
    }
    fetchLists()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!product) return setError('Product required')
    if (!qty) return setError('Quantity required')
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/inventory/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, qty: Number(qty), rate: Number(rate), type, warehouseFrom, warehouseTo, reference })
      })
      if (!res.ok) {
        const b = await res.json()
        setError(b.error || 'Unable to create transaction')
        return
      }
      setProduct('')
      setQty(0)
      setRate(0)
      setType('in')
      setWarehouseFrom('')
      setWarehouseTo('')
      setReference('')
      router.refresh()
    } catch (err) {
      setError('Unable to create transaction')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={className} {...props}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="product">Product</FieldLabel>
            <select id="product" value={product} onChange={(e) => setProduct(e.target.value)} className="h-8 w-full rounded-lg border px-2">
              <option value="">-- select --</option>
              {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="qty">Quantity</FieldLabel>
            <Input id="qty" type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          </Field>
          <Field>
            <FieldLabel htmlFor="rate">Rate</FieldLabel>
            <Input id="rate" type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
          </Field>
          <Field>
            <FieldLabel htmlFor="type">Type</FieldLabel>
            <select id="type" value={type} onChange={(e) => setType(e.target.value as any)} className="h-8 w-full rounded-lg border px-2">
              <option value="in">In</option>
              <option value="out">Out</option>
              <option value="adjustment">Adjustment</option>
              <option value="transfer">Transfer</option>
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="warehouseFrom">Warehouse from</FieldLabel>
            <select id="warehouseFrom" value={warehouseFrom} onChange={(e) => setWarehouseFrom(e.target.value)} className="h-8 w-full rounded-lg border px-2">
              <option value="">-- select --</option>
              {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="warehouseTo">Warehouse to</FieldLabel>
            <select id="warehouseTo" value={warehouseTo} onChange={(e) => setWarehouseTo(e.target.value)} className="h-8 w-full rounded-lg border px-2">
              <option value="">-- select --</option>
              {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="reference">Reference</FieldLabel>
            <Input id="reference" value={reference} onChange={(e) => setReference(e.target.value)} />
          </Field>
          {error ? <div className="text-destructive">{error}</div> : null}
          <Field>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Create transaction'}</Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
