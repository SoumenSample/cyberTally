"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"

export function CategoriesTable() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/inventory/categories')
      const b = await res.json()
      if (res.ok) setItems(b.categories || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this category?')) return
    const res = await fetch(`/api/admin/inventory/categories/${id}`, { method: 'DELETE' })
    if (res.ok) fetchItems(); else { const b = await res.json(); alert(b.error || 'Unable to delete') }
  }

  return (
    <div>
      <div className="mb-4">
        <Button onClick={fetchItems} variant="secondary">Refresh</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((c) => (
            <TableRow key={c._id}>
              <TableCell>{c.name}</TableCell>
              <TableCell>{c.description}</TableCell>
              <TableCell>
                <div className="flex gap-2"><Button size="sm" variant="destructive" onClick={() => deleteItem(c._id)}>Delete</Button></div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {loading ? <div className="mt-2 text-sm">Loading...</div> : null}
    </div>
  )
}
