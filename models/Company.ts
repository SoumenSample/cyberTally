import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    gstNumber: { type: String, trim: true },
    address: {
      line1: { type: String },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String },
    },
    phone: { type: String },
    email: { type: String },
    // Financial year start and end dates (month-day format or ISO)
    financialYearStart: { type: String },
    financialYearEnd: { type: String },
    // Optional flag for default/active
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Company ||
  mongoose.model("Company", CompanySchema);