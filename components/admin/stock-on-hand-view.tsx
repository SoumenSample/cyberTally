"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

export function StockOnHandView() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/inventory/stock-on-hand')
      const b = await res.json()
      if (res.ok) setItems(b.stockOnHand || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button className="rounded-md border px-3 py-1" onClick={fetchItems}>Refresh</button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Qty</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((r, i) => (
            <TableRow key={i}>
              <TableCell>{r.product?.name || r.product?._id}</TableCell>
              <TableCell>{r.warehouse ? r.warehouse.name : 'Global'}</TableCell>
              <TableCell>{r.qty}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {loading ? <div className="mt-2 text-sm">Loading...</div> : null}
    </div>
  )
}
