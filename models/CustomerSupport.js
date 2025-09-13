const mongoose = require('mongoose');

const customerSupportSchema = new mongoose.Schema({
  // Customer Information
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  
  // Hotel Information
  hotelOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hotelName: {
    type: String,
    required: true
  },
  hotelCode: {
    type: String,
    required: true
  },
  
  // Support Request Details
  issueType: {
    type: String,
    enum: ['technical', 'billing', 'service', 'feature_request', 'complaint', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  
  // Status and Resolution
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  assignedTo: {
    type: String,
    trim: true
  },
  resolution: {
    type: String,
    trim: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  },
  
  // Additional Information
  orderNumber: {
    type: String,
    trim: true
  },
  tableNumber: {
    type: Number
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Internal Notes
  internalNotes: [{
    note: String,
    addedBy: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
customerSupportSchema.index({ hotelOwner: 1, status: 1 });
customerSupportSchema.index({ createdAt: -1 });
customerSupportSchema.index({ priority: 1, status: 1 });
customerSupportSchema.index({ issueType: 1 });

// Update the updatedAt field on save
customerSupportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
  next();
});

// Virtual for response time calculation
customerSupportSchema.virtual('responseTime').get(function() {
  if (this.resolvedAt) {
    return Math.ceil((this.resolvedAt - this.createdAt) / (1000 * 60 * 60)); // hours
  }
  return Math.ceil((new Date() - this.createdAt) / (1000 * 60 * 60)); // hours since creation
});

const CustomerSupport = mongoose.models.CustomerSupport || mongoose.model('CustomerSupport', customerSupportSchema);

export { CustomerSupport };
