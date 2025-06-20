import Table from "@/models/Table";
import { connectDB } from "./mongodb";

export async function setTableOccupied(userId, tableNumber) {
  await connectDB();
  await Table.findOneAndUpdate({ userId, tableNumber }, { status: "occupied" });
}

export async function setTableFree(userId, tableNumber) {
  await connectDB();
  await Table.findOneAndUpdate({ userId, tableNumber }, { status: "free" });
}
