import mongoose from 'mongoose';

// Bill Counter Schema for daily token tracking
const BillCounterSchema = new mongoose.Schema({
  hotelOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    index: true
  },
  counter: {
    type: Number,
    default: 0,
    required: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
BillCounterSchema.index({ hotelOwner: 1, date: 1 }, { unique: true });

// Complete Bill Schema for all billing details
const BillSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  tokenNumber: {
    type: Number,
    required: false,
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false,
    index: true
  },
  orderType: {
    type: String,
    enum: ['dine-in', 'takeaway', 'billing', 'delivery'],
    default: 'billing'
  },
  tableNumber: {
    type: String,
    default: null
  },
  items: [{
    _id: String,
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    selectedSize: String,
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    category: String,
    subcategory: String
  }],
  customerInfo: {
    name: String,
    phone: String,
    email: String,
    address: String
  },
  pricing: {
    subtotal: {
      type: Number,
      required: true
    },
    gst: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    }
  },
  paymentInfo: {
    method: {
      type: String,
      enum: ['cash', 'card', 'upi', 'online', 'pending'],
      default: 'cash'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'completed'
    },
    transactionId: String
  },
  date: {
    type: String, // YYYY-MM-DD format
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'refunded'],
    default: 'completed'
  },
  notes: String,
  printCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for efficient queries (billNumber already has unique: true, so no separate index needed)
BillSchema.index({ userId: 1, date: -1 });
BillSchema.index({ tokenNumber: 1, date: 1 });
BillSchema.index({ 'customerInfo.phone': 1 });
BillSchema.index({ status: 1 });
BillSchema.index({ orderType: 1 });

// Clear model cache to prevent development issues
if (mongoose.models.BillCounter) {
  delete mongoose.models.BillCounter;
}
if (mongoose.models.Bill) {
  delete mongoose.models.Bill;
}

export const BillCounter = mongoose.model('BillCounter', BillCounterSchema);
export const Bill = mongoose.model('Bill', BillSchema);

// Default export for backward compatibility
export default BillCounter;
