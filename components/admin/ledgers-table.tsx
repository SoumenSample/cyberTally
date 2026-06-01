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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function LedgersTable() {
  const [ledgers, setLedgers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchLedgers = async () => {
    setLoading(true)

    try {
      const res = await fetch("/api/admin/ledgers", {
        cache: "no-store",
      })

      const data = await res.json()

      if (res.ok) {
        setLedgers(data.ledgers || [])
      } else {
        toast.error(data.error || "Failed to load ledgers")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to load ledgers")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLedgers()

    const handleLedgerCreated = () => {
      fetchLedgers()
    }

    window.addEventListener("ledger-created", handleLedgerCreated)

    return () => {
      window.removeEventListener(
        "ledger-created",
        handleLedgerCreated
      )
    }
  }, [])

  const startEdit = (ledger: any) => {
    setEditingId(ledger._id)
    setEditingName(ledger.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingName("")
  }

  const saveEdit = async () => {
    if (!editingId) return

    try {
      const res = await fetch(
        `/api/admin/ledgers/${editingId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editingName,
          }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Unable to update ledger")
        return
      }

      toast.success("Ledger updated successfully")

      await fetchLedgers()
      cancelEdit()
    } catch (error) {
      console.error(error)
      toast.error("Update failed")
    }
  }

  const deleteLedger = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/ledgers/${id}`, {
        method: "DELETE",
        cache: "no-store",
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Unable to delete ledger")
        return
      }

      setLedgers((prev) =>
        prev.filter((ledger) => ledger._id !== id)
      )

      toast.success("Ledger deleted successfully")

      await fetchLedgers()
    } catch (error) {
      console.error(error)
      toast.error("Delete failed")
    }
  }

  return (
    <div>
      <div className="mb-4">
        <Button
          onClick={fetchLedgers}
          variant="secondary"
        >
          Refresh
        </Button>
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
          {ledgers.length > 0 ? (
            ledgers.map((ledger) => (
              <TableRow key={ledger._id}>
                <TableCell>
                  {editingId === ledger._id ? (
                    <input
                      value={editingName}
                      onChange={(e) =>
                        setEditingName(e.target.value)
                      }
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    ledger.name
                  )}
                </TableCell>

                <TableCell>
                  {ledger.group?.name || ""}
                </TableCell>

                <TableCell>
                  {ledger.openingBalance}
                </TableCell>

                <TableCell>
                  {ledger.balanceType}
                </TableCell>

                <TableCell>
                  {editingId === ledger._id ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={saveEdit}
                      >
                        Save
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          startEdit(ledger)
                        }
                      >
                        Edit
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              setDeleteId(ledger._id)
                            }
                          >
                            Delete
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you sure?
                            </AlertDialogTitle>

                            <AlertDialogDescription>
                              This action cannot be undone.
                              <br />
                              <br />
                              The ledger will be permanently
                              deleted from the system.
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              Cancel
                            </AlertDialogCancel>

                            <AlertDialogAction
                              onClick={() => {
                                if (deleteId) {
                                  deleteLedger(deleteId)
                                }
                              }}
                            >
                              Yes, Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-6"
              >
                No ledgers found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {loading && (
        <div className="mt-3 text-sm text-muted-foreground">
          Loading...
        </div>
      )}
    </div>
  )
}