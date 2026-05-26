import mongoose from "mongoose"

const WarehouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    address: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.models.Warehouse || mongoose.model("Warehouse", WarehouseSchema)
