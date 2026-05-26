import mongoose from "mongoose"

const VoucherEntrySchema = new mongoose.Schema(
  {
    ledger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ledger",
      required: true,
    },
    side: {
      type: String,
      enum: ["debit", "credit"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0.01 },
    narration: { type: String, trim: true, default: "" },
  },
  { _id: false }
)

const VoucherSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    voucherType: {
      type: String,
      enum: [
        "Contra",
        "Payment",
        "Receipt",
        "Journal",
        "Sales",
        "Purchase",
        "Credit Note",
        "Debit Note",
      ],
      required: true,
    },
    voucherNumber: { type: String, required: true, trim: true },
    voucherDate: { type: Date, required: true },
    narration: { type: String, trim: true, default: "" },
    entries: {
      type: [VoucherEntrySchema],
      validate: {
        validator(entries: Array<{ side?: string; amount?: number }>) {
          return Array.isArray(entries) && entries.length >= 2
        },
        message: "At least two voucher entries are required",
      },
      required: true,
    },
    totalDebit: { type: Number, required: true, min: 0 },
    totalCredit: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
)

VoucherSchema.index({ company: 1, voucherType: 1, voucherNumber: 1 }, { unique: true })

export default mongoose.models.Voucher || mongoose.model("Voucher", VoucherSchema)
