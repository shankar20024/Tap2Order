import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: false
    },
    customerInfo: {
      name: {
        type: String,
        required: false,
        default: 'Guest'
      },
      phone: {
        type: String,
        required: false,
        default: ''
      },
      ip: {
        type: String,
        required: false
      }
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
        subcategory: {
          type: String,
          default: "",
        },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "served", "completed", "cancelled"],
      default: "pending",
      validate: {
        validator: function(status) {
          // Beverages orders cannot have preparing or ready status
          if (this.orderType === 'beverages' && (status === 'preparing' || status === 'ready')) {
            return false;
          }
          return true;
        },
        message: 'Beverages orders cannot have preparing or ready status'
      }
    },
    orderType: {
      type: String,
      enum: ["food", "beverages"],
      default: "food",
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
    cancellationReason: {
      type: String,
      default: "", // Reason for cancellation if applicable
    },
    notes: {
      type: String,
      default: "",
    },
    orderMessage: {
      type: String,
      default: ''
    }
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
  // Model cache clear attempt failed
}

// Add validation for beverages orders
OrderSchema.pre('save', function(next) {
  if (this.orderType === 'beverages') {
    const invalidStatuses = ['preparing', 'ready'];
    if (invalidStatuses.includes(this.status)) {
      const error = new Error('Beverages orders cannot have preparing or ready status');
      return next(error);
    }
  }
  next();
});

// Index for efficient queries
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ userId: 1, tableNumber: 1 });
OrderSchema.index({ userId: 1, status: 1 });
OrderSchema.index({ customerId: 1, createdAt: -1 });

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
