import mongoose from "mongoose"

const StockGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "StockGroup" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.models.StockGroup || mongoose.model("StockGroup", StockGroupSchema)
