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

type VoucherRow = {
  _id: string
  voucherNumber: string
  voucherType: string
  voucherDate?: string
  narration?: string
  totalDebit?: number
  totalCredit?: number
}

export function VouchersTable() {
  const [vouchers, setVouchers] = useState<VoucherRow[]>([])
  const [loading, setLoading] = useState(false)

  const fetchVouchers = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/vouchers")
      const body = await res.json()
      if (res.ok) {
        setVouchers(body.vouchers || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void (async () => {
      setLoading(true)

      try {
        const res = await fetch("/api/admin/vouchers")
        const body = await res.json()
        if (res.ok) {
          setVouchers(body.vouchers || [])
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const deleteVoucher = async (id: string) => {
    if (!confirm("Delete this voucher?")) return

    const res = await fetch(`/api/admin/vouchers/${id}`, { method: "DELETE" })
    if (res.ok) {
      fetchVouchers()
      return
    }

    const body = await res.json()
    alert(body.error || "Unable to delete voucher")
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button onClick={fetchVouchers} variant="secondary">Refresh</Button>
        <div className="text-sm text-muted-foreground">Balanced voucher records with type, number and date.</div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Voucher</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Debit</TableHead>
            <TableHead>Credit</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vouchers.map((voucher) => (
            <TableRow key={voucher._id}>
              <TableCell>
                <div className="font-medium">{voucher.voucherNumber}</div>
                <div className="text-xs text-muted-foreground">{voucher.narration || "No narration"}</div>
              </TableCell>
              <TableCell>{voucher.voucherType}</TableCell>
              <TableCell>{voucher.voucherDate ? new Date(voucher.voucherDate).toLocaleDateString() : ""}</TableCell>
              <TableCell>{Number(voucher.totalDebit || 0).toFixed(2)}</TableCell>
              <TableCell>{Number(voucher.totalCredit || 0).toFixed(2)}</TableCell>
              <TableCell>
                <span className={Number(voucher.totalDebit || 0) === Number(voucher.totalCredit || 0) ? "text-emerald-600" : "text-destructive"}>
                  {Number(voucher.totalDebit || 0) === Number(voucher.totalCredit || 0) ? "Balanced" : "Mismatch"}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={() => deleteVoucher(voucher._id)}>Delete</Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {loading ? <div className="mt-2 text-sm">Loading...</div> : null}
    </div>
  )
}
