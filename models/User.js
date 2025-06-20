import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["admin", "user"], default: "user" }, 
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
