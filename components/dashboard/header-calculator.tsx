"use client"

import * as React from "react"
import { Calculator, Delete, Equal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Operator = "+" | "-" | "*" | "/"
type UnaryPrefix = "u-" | "sqrt"
type UnaryPostfix = "%"
type Token = number | Operator | "(" | ")" | UnaryPrefix | UnaryPostfix

const keypadRows = [
  ["C", "%", "√", "DEL"],
  ["7", "8", "9", "/"],
  ["4", "5", "6", "*"],
  ["1", "2", "3", "-"],
  ["0", ".", "=", "+"],
]

const isOperator = (token: Token): token is Operator =>
  token === "+" || token === "-" || token === "*" || token === "/"

const isUnaryPrefix = (token: Token): token is UnaryPrefix => token === "u-" || token === "sqrt"

function tokenize(expression: string): Token[] {
  const tokens: Token[] = []
  let current = ""

  const pushNumber = () => {
    if (!current) {
      return
    }
    const parsed = Number(current)
    if (!Number.isFinite(parsed)) {
      throw new Error("Invalid number")
    }
    tokens.push(parsed)
    current = ""
  }

  for (let i = 0; i < expression.length; i += 1) {
    const char = expression[i]

    if (/\d|\./.test(char)) {
      current += char
      continue
    }

    if (char === " ") {
      continue
    }

    pushNumber()

    if (char === "(" || char === ")") {
      tokens.push(char)
      continue
    }

    if (char === "%") {
      tokens.push("%")
      continue
    }

    if (char === "√") {
      tokens.push("sqrt")
      continue
    }

    if (expression.slice(i, i + 4).toLowerCase() === "sqrt") {
      tokens.push("sqrt")
      i += 3
      continue
    }

    if (
      char === "-" &&
      (tokens.length === 0 ||
        isOperator(tokens[tokens.length - 1] as Token) ||
        isUnaryPrefix(tokens[tokens.length - 1] as Token) ||
        tokens[tokens.length - 1] === "(")
    ) {
      tokens.push("u-")
      continue
    }

    if (char === "+" || char === "-" || char === "*" || char === "/") {
      tokens.push(char)
      continue
    }

    throw new Error("Invalid character")
  }

  pushNumber()

  return tokens
}

function toRpn(tokens: Token[]): Token[] {
  const output: Token[] = []
  const operators: Token[] = []

  const precedence = (token: Token): number => {
    if (token === "%") {
      return 4
    }
    if (token === "u-") {
      return 3
    }
    if (token === "sqrt") {
      return 3
    }
    if (token === "*" || token === "/") {
      return 2
    }
    if (token === "+" || token === "-") {
      return 1
    }
    return 0
  }

  const isRightAssociative = (token: Token) => token === "u-" || token === "sqrt"

  tokens.forEach((token) => {
    if (typeof token === "number") {
      output.push(token)
      return
    }

    if (token === "(") {
      operators.push(token)
      return
    }

    if (token === ")") {
      while (operators.length > 0 && operators[operators.length - 1] !== "(") {
        output.push(operators.pop() as Token)
      }
      if (operators.length === 0) {
        throw new Error("Mismatched parentheses")
      }
      operators.pop()
      if (operators.length > 0 && isUnaryPrefix(operators[operators.length - 1] as Token)) {
        output.push(operators.pop() as Token)
      }
      return
    }

    while (operators.length > 0) {
      const top = operators[operators.length - 1]
      if (top === "(") {
        break
      }
      const shouldPop = isRightAssociative(token)
        ? precedence(token) < precedence(top)
        : precedence(token) <= precedence(top)
      if (!shouldPop) {
        break
      }
      output.push(operators.pop() as Token)
    }

    operators.push(token)
  })

  while (operators.length > 0) {
    const operator = operators.pop() as Token
    if (operator === "(" || operator === ")") {
      throw new Error("Mismatched parentheses")
    }
    output.push(operator)
  }

  return output
}

function evaluateExpression(expression: string): number {
  const tokens = tokenize(expression)
  const rpn = toRpn(tokens)
  const stack: number[] = []

  rpn.forEach((token) => {
    if (typeof token === "number") {
      stack.push(token)
      return
    }

    if (token === "u-") {
      const value = stack.pop()
      if (value === undefined) {
        throw new Error("Invalid expression")
      }
      stack.push(-value)
      return
    }

    if (token === "sqrt") {
      const value = stack.pop()
      if (value === undefined) {
        throw new Error("Invalid expression")
      }
      if (value < 0) {
        throw new Error("Square root of negative number")
      }
      stack.push(Math.sqrt(value))
      return
    }

    if (token === "%") {
      const value = stack.pop()
      if (value === undefined) {
        throw new Error("Invalid expression")
      }
      stack.push(value / 100)
      return
    }

    const right = stack.pop()
    const left = stack.pop()
    if (right === undefined || left === undefined) {
      throw new Error("Invalid expression")
    }

    if (token === "+") {
      stack.push(left + right)
      return
    }
    if (token === "-") {
      stack.push(left - right)
      return
    }
    if (token === "*") {
      stack.push(left * right)
      return
    }
    if (right === 0) {
      throw new Error("Cannot divide by zero")
    }
    stack.push(left / right)
  })

  if (stack.length !== 1 || !Number.isFinite(stack[0])) {
    throw new Error("Invalid expression")
  }

  return Number(stack[0].toFixed(10))
}

export function HeaderCalculator() {
  const [open, setOpen] = React.useState(false)
  const [expression, setExpression] = React.useState("")
  const [result, setResult] = React.useState<string>("")
  const [error, setError] = React.useState<string>("")
  const panelRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!open || !panelRef.current) {
        return
      }
      if (!panelRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [open])

  const appendValue = (value: string) => {
    setError("")
    setExpression((prev) => `${prev}${value}`)
  }

  const clearAll = () => {
    setExpression("")
    setResult("")
    setError("")
  }

  const deleteLast = () => {
    setError("")
    setExpression((prev) => prev.slice(0, -1))
  }

  const calculate = () => {
    try {
      const evaluated = evaluateExpression(expression)
      const nextValue = `${evaluated}`
      setResult(nextValue)
      setExpression(nextValue)
      setError("")
    } catch (calculationError) {
      const message = calculationError instanceof Error ? calculationError.message : "Invalid expression"
      setError(message)
    }
  }

  const handleKeypadPress = (value: string) => {
    if (value === "C") {
      clearAll()
      return
    }
    if (value === "DEL") {
      deleteLast()
      return
    }
    if (value === "=") {
      calculate()
      return
    }
    if (value === "√") {
      appendValue("sqrt(")
      return
    }
    appendValue(value)
  }

  return (
    <div className="fixed right-4 top-3 z-50" ref={panelRef}>
      <Button
        aria-label="Open calculator"
        variant="outline"
        size="icon-sm"
        className="h-8 w-8 rounded-full shadow-sm"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Calculator className="h-4 w-4" />
      </Button>

      {open ? (
        <Card className="absolute right-0 mt-2 w-72 border bg-background shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Calculator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <Input
              value={expression}
              onChange={(event) => {
                setError("")
                setExpression(event.target.value)
              }}
              placeholder="Type expression"
              className="font-mono"
            />
            <div className="min-h-5 text-right text-xs text-muted-foreground">
              {error ? <span className="text-destructive">{error}</span> : result ? `= ${result}` : "="}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {keypadRows.flat().map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={value === "=" ? "default" : "outline"}
                  onClick={() => handleKeypadPress(value)}
                  className="h-8"
                >
                  {value === "DEL" ? <Delete className="h-3.5 w-3.5" /> : value === "=" ? <Equal className="h-3.5 w-3.5" /> : value}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}