"use client"

import * as React from "react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
// use native select element
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"

type User = {
  _id: string
  id?: string
  name: string
  email: string
  role: string
  createdAt?: string
  companies?: any[]
  activeCompany?: any
}

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<string>("employee")
  const [editingName, setEditingName] = useState<string>("")
  const [editingCompanies, setEditingCompanies] = useState<string[]>([])
  const [editingActiveCompany, setEditingActiveCompany] = useState<string | null>(null)
  const [companies, setCompanies] = useState<any[]>([])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/users")
      const body = await res.json()
      if (res.ok) setUsers(body.users || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    ;(async () => {
      const r = await fetch('/api/admin/companies')
      const b = await r.json()
      if (r.ok) setCompanies(b.companies || [])
    })()
  }, [])

  const startEdit = (u: User) => {
    setEditingId(u._id || u.id || null)
    setEditingRole(u.role)
    setEditingName(u.name)
    const compIds = (u.companies || []).map((c: any) => (c._id ? c._id : c))
    setEditingCompanies(compIds)
    const active = u.activeCompany ? (u.activeCompany._id ? u.activeCompany._id : u.activeCompany) : null
    setEditingActiveCompany(active)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveEdit = async () => {
    if (!editingId) return
    const res = await fetch(`/api/admin/users/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingName, role: editingRole, companies: editingCompanies, activeCompany: editingActiveCompany }),
    })

    if (res.ok) {
      await fetchUsers()
      cancelEdit()
    } else {
      const b = await res.json()
      alert(b.error || "Unable to update user")
    }
  }

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user?")) return
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" })
    if (res.ok) {
      await fetchUsers()
    } else {
      const b = await res.json()
      alert(b.error || "Unable to delete user")
    }
  }

  return (
    <div>
      <div className="mb-4">
        <Button onClick={fetchUsers} variant="secondary">Refresh</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u._id || u.id}>
              <TableCell>
                {editingId === (u._id || u.id) ? (
                  <input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                ) : (
                  u.name
                )}
              </TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>
                {editingId === (u._id || u.id) ? (
                  <div className="flex flex-col gap-2">
                    <select value={editingRole} onChange={(e) => setEditingRole(e.target.value)} className="rounded-md border px-2 py-1">
                      <option value="employee">Employee</option>
                      <option value="accountant">Accountant</option>
                      <option value="admin">Admin</option>
                    </select>
                    <select multiple value={editingCompanies} onChange={(e) => setEditingCompanies(Array.from(e.target.selectedOptions).map(o => o.value))} className="rounded-md border px-2 py-1">
                      {companies.map((c) => (
                        <option key={c._id} value={c._id}>{c.companyName}</option>
                      ))}
                    </select>
                    <select value={editingActiveCompany ?? ""} onChange={(e) => setEditingActiveCompany(e.target.value || null)} className="rounded-md border px-2 py-1">
                      <option value="">-- active company --</option>
                      {editingCompanies.map(cid => {
                        const co = companies.find(c => c._id === cid)
                        return co ? <option key={cid} value={cid}>{co.companyName}</option> : null
                      })}
                    </select>
                  </div>
                ) : (
                  <div>{u.role}{u.activeCompany ? ` — ${u.activeCompany.companyName}` : ''}</div>
                )}
              </TableCell>
              <TableCell>
                {editingId === (u._id || u.id) ? (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => startEdit(u)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteUser(u._id || u.id!)}>Delete</Button>
                  </div>
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
