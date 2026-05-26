import mongoose from "mongoose"

const LedgerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LedgerGroup",
      required: true,
    },
    openingBalance: { type: Number, default: 0 },
    balanceType: { type: String, enum: ["debit", "credit"], default: "debit" },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
  },
  { timestamps: true }
)

export default mongoose.models.Ledger || mongoose.model("Ledger", LedgerSchema)
