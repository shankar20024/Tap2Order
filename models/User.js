import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["admin", "user"], default: "user" },
  tableLimit: { type: Number, default: 10, min: 1 },
  tables: [Number],
  menu: [
    {
      name: String,
      price: Number,
      available: Boolean,
      category: String,
    },
  ],
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model("User", userSchema);
