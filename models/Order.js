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
        size: {
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
    preparingAt: {
      type: Date,
    },
    servedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    specialRequests: {
      type: String,
      default: "",
    },
    isTakeAway: {
      type: Boolean,
      default: false,
    },
    customerName: {
      type: String,
      default: '',
    },
    customerPhone: {
      type: String,
      default: '',
    },
    cancellationReason: {
      type: String,
      default: "", // Reason for cancellation if applicable
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Clear any existing model cache to ensure schema changes are applied
try {
  if (mongoose.models.Order) {
    delete mongoose.models.Order;
  }
  if (mongoose.connection.models && mongoose.connection.models.Order) {
    delete mongoose.connection.models.Order;
  }
} catch (error) {
  console.log('Model cache clear attempt:', error.message);
}

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
