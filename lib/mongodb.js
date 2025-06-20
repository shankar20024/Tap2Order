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

if (!uri) {
  throw new Error("MongoDB URI not set in environment");
}

let cached = global.mongoose || { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
