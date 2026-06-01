"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { Dialog } from "radix-ui"

import { Button } from "@/components/ui/button"

type Props = {
  notificationId: string
}

export function NotificationDismissButton({ notificationId }: Props) {
  const router = useRouter()
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()

  const handleDismiss = () => {
    startTransition(async () => {
      await fetch(`/api/dashboard/notifications/${encodeURIComponent(notificationId)}`, {
        method: "DELETE",
      })
      setIsConfirmOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog.Root open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon-xs" disabled={isPending} aria-label="Remove notification">
          <X className="h-4 w-4" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(92vw,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-background p-6 shadow-xl outline-none">
          <Dialog.Title className="text-base font-semibold text-foreground">Remove notification?</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            This will hide the notification from the dashboard. You can regenerate it later if the source data changes.
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm" disabled={isPending}>
                Cancel
              </Button>
            </Dialog.Close>
            <Button variant="destructive" size="sm" disabled={isPending} onClick={handleDismiss}>
              Remove
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}