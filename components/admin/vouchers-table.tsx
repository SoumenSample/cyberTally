"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  const [deleting, setDeleting] = useState(false)
  const [selectedVoucher, setSelectedVoucher] =
    useState<VoucherRow | null>(null)

  const fetchVouchers = async () => {
    setLoading(true)

    try {
      const res = await fetch("/api/admin/vouchers")

      const body = await res.json()

      if (res.ok) {
        setVouchers(body.vouchers || [])
      }
    } catch {
      toast.error("Failed to load vouchers")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVouchers()
  }, [])

  useEffect(() => {
    const refresh = () => fetchVouchers()

    window.addEventListener(
      "voucher-created",
      refresh
    )

    return () => {
      window.removeEventListener(
        "voucher-created",
        refresh
      )
    }
  }, [])

  const deleteVoucher = async () => {
    if (!selectedVoucher) return

    try {
      setDeleting(true)

      const res = await fetch(
        `/api/admin/vouchers/${selectedVoucher._id}`,
        {
          method: "DELETE",
        }
      )

      const body = await res.json()

      console.log("DELETE RESPONSE", body)

      if (!res.ok) {
        toast.error(
          body.error || "Unable to delete voucher"
        )
        return
      }

      setVouchers((prev) =>
        prev.filter(
          (v) => v._id !== selectedVoucher._id
        )
      )

      toast.success(
        "Voucher deleted successfully"
      )

      setSelectedVoucher(null)
    } catch (err) {
      console.error(err)

      toast.error(
        "Unable to delete voucher"
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button
          onClick={fetchVouchers}
          variant="secondary"
        >
          Refresh
        </Button>

        <div className="text-sm text-muted-foreground">
          Balanced voucher records with type,
          number and date.
        </div>
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
                <div className="font-medium">
                  {voucher.voucherNumber}
                </div>

                <div className="text-xs text-muted-foreground">
                  {voucher.narration ||
                    "No narration"}
                </div>
              </TableCell>

              <TableCell>
                {voucher.voucherType}
              </TableCell>

              <TableCell>
                {voucher.voucherDate
                  ? new Date(
                      voucher.voucherDate
                    ).toLocaleDateString()
                  : ""}
              </TableCell>

              <TableCell>
                {Number(
                  voucher.totalDebit || 0
                ).toFixed(2)}
              </TableCell>

              <TableCell>
                {Number(
                  voucher.totalCredit || 0
                ).toFixed(2)}
              </TableCell>

              <TableCell>
                <span
                  className={
                    Number(
                      voucher.totalDebit || 0
                    ) ===
                    Number(
                      voucher.totalCredit || 0
                    )
                      ? "text-emerald-600"
                      : "text-destructive"
                  }
                >
                  {Number(
                    voucher.totalDebit || 0
                  ) ===
                  Number(
                    voucher.totalCredit || 0
                  )
                    ? "Balanced"
                    : "Mismatch"}
                </span>
              </TableCell>

              <TableCell>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    setSelectedVoucher(voucher)
                  }
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {loading && (
        <div className="mt-2 text-sm">
          Loading...
        </div>
      )}

      <AlertDialog
        open={!!selectedVoucher}
        onOpenChange={() =>
          setSelectedVoucher(null)
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Voucher?
            </AlertDialogTitle>

            <AlertDialogDescription>
              This action cannot be undone.

              <br />
              <br />

              Voucher:
              <strong>
                {" "}
                {selectedVoucher?.voucherNumber}
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={deleteVoucher}
              disabled={deleting}
            >
              {deleting
                ? "Deleting..."
                : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}