import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  available: { type: Boolean, default: true },
  category: { type: String, enum: ["veg", "non-veg"], default: "veg" , required: true},
}, { timestamps: true });

const MenuItem = mongoose.models.MenuItem || mongoose.model("MenuItem", menuItemSchema);
export default MenuItem;
