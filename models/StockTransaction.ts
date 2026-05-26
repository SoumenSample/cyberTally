import mongoose from "mongoose"

const StockTransactionSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    qty: { type: Number, required: true },
    rate: { type: Number, default: 0 },
    type: { type: String, enum: ["in", "out", "adjustment", "transfer", "opening"], required: true },
    warehouseFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
    warehouseTo: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
    reference: { type: String },
    meta: { type: Object },
  },
  { timestamps: true }
)

export default mongoose.models.StockTransaction || mongoose.model("StockTransaction", StockTransactionSchema)
