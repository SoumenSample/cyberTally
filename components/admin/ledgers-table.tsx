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

export function LedgersTable() {
  const [ledgers, setLedgers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  const fetchLedgers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ledgers')
      const b = await res.json()
      if (res.ok) setLedgers(b.ledgers || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLedgers() }, [])

  const startEdit = (c: any) => { setEditingId(c._id); setEditingName(c.name) }
  const cancelEdit = () => setEditingId(null)
  const saveEdit = async () => {
    if (!editingId) return
    const res = await fetch(`/api/admin/ledgers/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editingName }) })
    if (res.ok) { await fetchLedgers(); cancelEdit() } else { const b = await res.json(); alert(b.error || 'Unable to update') }
  }

  const deleteLedger = async (id: string) => {
    if (!confirm('Delete this ledger?')) return
    const res = await fetch(`/api/admin/ledgers/${id}`, { method: 'DELETE' })
    if (res.ok) fetchLedgers(); else { const b = await res.json(); alert(b.error || 'Unable to delete') }
  }

  return (
    <div>
      <div className="mb-4">
        <Button onClick={fetchLedgers} variant="secondary">Refresh</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ledger</TableHead>
            <TableHead>Group</TableHead>
            <TableHead>Opening</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ledgers.map((c) => (
            <TableRow key={c._id}>
              <TableCell>{editingId === c._id ? <input value={editingName} onChange={(e) => setEditingName(e.target.value)} /> : c.name}</TableCell>
              <TableCell>{c.group?.name || ''}</TableCell>
              <TableCell>{c.openingBalance}</TableCell>
              <TableCell>{c.balanceType}</TableCell>
              <TableCell>
                {editingId === c._id ? (
                  <div className="flex gap-2"><Button size="sm" onClick={saveEdit}>Save</Button><Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button></div>
                ) : (
                  <div className="flex gap-2"><Button size="sm" onClick={() => startEdit(c)}>Edit</Button><Button size="sm" variant="destructive" onClick={() => deleteLedger(c._id)}>Delete</Button></div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {loading ? <div className="mt-2 text-sm">Loading...</div> : null}
    </div>
  )
}
