import mongoose from "mongoose"

const UnitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.models.Unit || mongoose.model("Unit", UnitSchema)
