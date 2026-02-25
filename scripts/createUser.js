import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";

// Use same DB variables as lib/mongodb.js
const {
  DB_USER,
  DB_PASS,
  DB_CLUSTER,
  DB_NAME,
  DB_APP_NAME
} = process.env;

const uri = `mongodb+srv://${DB_USER}:${DB_PASS}@${DB_CLUSTER}/${DB_NAME}?retryWrites=true&w=majority&appName=${DB_APP_NAME}`;

async function createAdmin() {
  await mongoose.connect(uri);
  
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const user = new User({
    name: "Admin User",
    email: "admin@tap2order.com",
    password: hashedPassword,
    role: "admin"
  });

  await user.save();
  mongoose.disconnect();
}

createAdmin();
