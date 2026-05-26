import mongoose from "mongoose"

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true, index: true },
    hsnCode: { type: String, trim: true },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "StockGroup" },
    rate: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    meta: { type: Object },
  },
  { timestamps: true }
)

export default mongoose.models.Product || mongoose.model("Product", ProductSchema)
