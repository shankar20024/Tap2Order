import mongoose from "mongoose";

const TableSchema = new mongoose.Schema({
  tableNumber: {
    type: Number,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
  type: String,
  enum: ["free", "occupied"],
  default: "free",
},

}, { timestamps: true });

export default mongoose.models.Table || mongoose.model("Table", TableSchema);
