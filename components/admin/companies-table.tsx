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

export function CompaniesTable() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  const fetchCompanies = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/companies')
      const b = await res.json()
      if (res.ok) setCompanies(b.companies || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCompanies() }, [])

  const startEdit = (c: any) => { setEditingId(c._id); setEditingName(c.companyName) }
  const cancelEdit = () => setEditingId(null)
  const saveEdit = async () => {
    if (!editingId) return
    const res = await fetch(`/api/admin/companies/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyName: editingName }) })
    if (res.ok) { await fetchCompanies(); cancelEdit() } else { const b = await res.json(); alert(b.error || 'Unable to update') }
  }

  const deleteCompany = async (id: string) => {
    if (!confirm('Delete this company?')) return
    const res = await fetch(`/api/admin/companies/${id}`, { method: 'DELETE' })
    if (res.ok) fetchCompanies(); else { const b = await res.json(); alert(b.error || 'Unable to delete') }
  }

  return (
    <div>
      <div className="mb-4">
        <Button onClick={fetchCompanies} variant="secondary">Refresh</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>GST</TableHead>
            <TableHead>Financial Year</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((c) => (
            <TableRow key={c._id}>
              <TableCell>{editingId === c._id ? <input value={editingName} onChange={(e) => setEditingName(e.target.value)} /> : c.companyName}</TableCell>
              <TableCell>{c.gstNumber}</TableCell>
              <TableCell>{c.financialYearStart} - {c.financialYearEnd}</TableCell>
              <TableCell>
                {editingId === c._id ? (
                  <div className="flex gap-2"><Button size="sm" onClick={saveEdit}>Save</Button><Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button></div>
                ) : (
                  <div className="flex gap-2"><Button size="sm" onClick={() => startEdit(c)}>Edit</Button><Button size="sm" variant="destructive" onClick={() => deleteCompany(c._id)}>Delete</Button></div>
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
