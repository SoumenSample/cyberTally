import mongoose from "mongoose"

const LedgerGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["Assets", "Liabilities", "Income", "Expenses", "Bank Accounts", "Cash-in-Hand", "Sales Accounts", "Purchase Accounts"],
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LedgerGroup",
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
  },
  { timestamps: true }
)

export default mongoose.models.LedgerGroup || mongoose.model("LedgerGroup", LedgerGroupSchema)
