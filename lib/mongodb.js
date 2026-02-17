// lib/mongodb.js
import mongoose from "mongoose";

const {
  DB_USER,
  DB_PASS,
  DB_CLUSTER,
  DB_NAME,
  DB_APP_NAME
} = process.env;

const uri = `mongodb+srv://${DB_USER}:${DB_PASS}@${DB_CLUSTER}/${DB_NAME}?retryWrites=true&w=majority&appName=${DB_APP_NAME}`;

// console.log("MongoDB URI components:", {
//   DB_USER: !!DB_USER,
//   DB_PASS: !!DB_PASS,
//   DB_CLUSTER,
//   DB_NAME,
//   DB_APP_NAME
// });

if (!uri) {
  throw new Error("MongoDB URI not set in environment");
}

let cached = global.mongoose || { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const mongoUri = process.env.MONGODB_URI || uri;
    if (!mongoUri) {
      throw new Error("MongoDB URI not set in environment");
    }
    
    cached.promise = mongoose.connect(mongoUri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }

  try {
    cached.conn = await cached.promise;
    // console.log("MongoDB connected successfully");
    return cached.conn;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}
