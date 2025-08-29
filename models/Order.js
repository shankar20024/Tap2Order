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
        category: {
          type: String,
          enum: ["veg", "non-veg", "jain", "beverages", "none"],
          default: "veg",
        },
        status: {
          type: String,
          enum: ["pending", "preparing", "ready", "served", "completed", "cancelled"],
          default: "pending",
          validate: {
            validator: function(status) {
              // Get the parent order document
              const order = this.parent();
              
              // If this is a beverages item, restrict status options
              if (this.category === 'beverages') {
                const allowedStatuses = ['pending', 'served', 'completed', 'cancelled'];
                return allowedStatuses.includes(status);
              }
              
              // For food items, all statuses are allowed
              return true;
            },
            message: 'Beverages items can only have pending, served, completed, or cancelled status'
          }
        },
        preparedAt: {
          type: Date,
        },
        readyAt: {
          type: Date,
        },
        servedAt: {
          type: Date,
        },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "served", "completed", "cancelled"],
      default: "pending",
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
    gstDetails: {
      subtotal: {
        type: Number,
        default: 0,
        min: 0
      },
      cgstRate: {
        type: Number,
        default: 9, // 9% CGST (can be configured)
        min: 0,
        max: 50
      },
      sgstRate: {
        type: Number,
        default: 9, // 9% SGST (can be configured)
        min: 0,
        max: 50
      },
      cgstAmount: {
        type: Number,
        default: 0,
        min: 0
      },
      sgstAmount: {
        type: Number,
        default: 0,
        min: 0
      },
      totalGst: {
        type: Number,
        default: 0,
        min: 0
      },
      grandTotal: {
        type: Number,
        default: 0,
        min: 0
      },
      taxRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 28
      },
      isGstApplicable: {
        type: Boolean,
        default: true
      }
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

// Add pre-save middleware to handle beverages item status
OrderSchema.pre('save', function(next) {
  // Handle individual item status for beverages - only prevent invalid statuses
  if (this.items && this.items.length > 0) {
    for (let item of this.items) {
      if (item.category === 'beverages') {
        // Prevent beverages items from having preparing/ready status
        if (item.status === 'preparing' || item.status === 'ready') {
          item.status = 'pending';
        }
      }
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
