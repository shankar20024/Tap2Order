import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";

const uri = `mongodb+srv://Shankar:Shankar%409702525966@tap2order.rqgxvsv.mongodb.net/tap2order?retryWrites=true&w=majority&appName=Tap2Order`;

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
