import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: Number,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User ',
      required: true,
    },
    items: [
      {
        menuItemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MenuItem',
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        notes: {
          type: String,
          default: "",
        },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "preparing", "served", "completed", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "wallet"],
      default: "cash",
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0, // Ensure total amount is non-negative
    },
    specialRequests: {
      type: String,
      default: "",
    },
    isTakeAway: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date, // Timestamp for when the order is completed
      default: null,
    },
    cancellationReason: {
      type: String,
      default: "", // Reason for cancellation if applicable
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
