"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
// use native select element

export function CreateUserForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("employee")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      })

      const body = await res.json()

      if (!res.ok) {
        setError(body.error || "Unable to create user")
        return
      }

      // Clear and optionally refresh
      setName("")
      setEmail("")
      setPassword("")
      setRole("employee")
      router.refresh()
    } catch (err) {
      setError("Unable to create user right now.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={className} {...props}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Full name</FieldLabel>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <FieldDescription className="text-sm">Minimum 8 characters</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="role">Role</FieldLabel>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-md border px-2 py-1">
              <option value="employee">Employee</option>
              <option value="accountant">Accountant</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          {error ? <div className="text-destructive">{error}</div> : null}
          <Field>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create user"}</Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
