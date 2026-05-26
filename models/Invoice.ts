import mongoose from "mongoose"

const InvoiceItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    hsnCode: { type: String, trim: true, default: "" },
    quantity: { type: Number, required: true, min: 0.0001 },
    unit: { type: String, trim: true, default: "Nos" },
    rate: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    gstRate: { type: Number, required: true, min: 0 },
    taxableValue: { type: Number, required: true, min: 0 },
    cgstAmount: { type: Number, required: true, min: 0 },
    sgstAmount: { type: Number, required: true, min: 0 },
    igstAmount: { type: Number, required: true, min: 0 },
    totalGst: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
)

const InvoiceSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    invoiceType: {
      type: String,
      enum: ["Sales Invoice", "Purchase Invoice", "Sales Return", "Purchase Return", "Credit Note", "Debit Note"],
      required: true,
    },
    invoiceNumber: { type: String, required: true, trim: true },
    invoiceDate: { type: Date, required: true },
    dueDate: { type: Date },
    partyLedger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ledger",
      required: true,
    },
    partyName: { type: String, required: true, trim: true },
    partyGstin: { type: String, trim: true, default: "" },
    partyState: { type: String, trim: true, default: "" },
    placeOfSupply: { type: String, trim: true, default: "" },
    gstMode: { type: String, enum: ["intra", "inter"], default: "intra" },
    reportSign: { type: Number, default: 1 },
    stockEffect: { type: Number, default: 0 },
    items: {
      type: [InvoiceItemSchema],
      validate: {
        validator(items: Array<{ quantity?: number }>) {
          return Array.isArray(items) && items.length > 0
        },
        message: "At least one invoice item is required",
      },
      required: true,
    },
    taxableValue: { type: Number, required: true, min: 0 },
    cgstAmount: { type: Number, required: true, min: 0 },
    sgstAmount: { type: Number, required: true, min: 0 },
    igstAmount: { type: Number, required: true, min: 0 },
    totalGst: { type: Number, required: true, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
)

InvoiceSchema.index({ company: 1, invoiceType: 1, invoiceNumber: 1 }, { unique: true })

export default mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema)
