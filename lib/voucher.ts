export const voucherTypes = [
  "Contra",
  "Payment",
  "Receipt",
  "Journal",
  "Sales",
  "Purchase",
  "Credit Note",
  "Debit Note",
] as const

export type VoucherType = (typeof voucherTypes)[number]

export const voucherTypePrefixes: Record<VoucherType, string> = {
  Contra: "CON",
  Payment: "PAY",
  Receipt: "REC",
  Journal: "JRN",
  Sales: "SAL",
  Purchase: "PUR",
  "Credit Note": "CRN",
  "Debit Note": "DBN",
}

export function getVoucherPrefix(type: VoucherType) {
  return voucherTypePrefixes[type]
}
