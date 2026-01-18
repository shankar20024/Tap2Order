import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: { 
    type: String, 
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: { 
    type: String, 
    enum: ["admin", "user"], 
    default: "user" 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  
  // Multi-tenant fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SuperAdmin',
    required: true,
  },
  
  // Hotel Code - Unique identifier for each hotel (only for hotel owners)
  hotelCode: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
    uppercase: true,
    match: /^[A-Z]\d{4}$/,  // Format: A1234
    index: true,
    validate: {
      validator: function(value) {
        // Skip validation if role is not set yet (during initial creation)
        if (!this.role) return true;
        
        // Hotel code is required for user role
        if (this.role === 'user') {
          return value != null && value !== '';
        }
        
        // Admin users should not have a hotel code
        if (this.role === 'admin') {
          return value == null || value === '';
        }
        
        return true;
      },
      message: function(props) {
        if (props.reason === 'required') {
          return 'Hotel code is required for hotel owners (user role)';
        }
        return 'Invalid hotel code validation';
      }
    }
},
  
  // Hotel/Business Information
  businessName: {
    type: String,
    required: true,
    trim: true,
  },
  businessType: {
    type: String,
    enum: ["restaurant", "cafe", "hotel", "bar", "other"],
    default: "restaurant",
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: "India" },
  },
  phone: {
    type: String,
    trim: true,
  },
  // Optional hotel contact number (distinct from owner phone)
  hotelPhone: {
    type: String,
    trim: true,
  },
  
  // GST and Tax Information
  gstDetails: {
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      match: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    },
    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
      match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    },
    tradeName: {
      type: String,
      trim: true,
    },
    gstRegistrationDate: {
      type: Date,
    },
    taxRate: {
      type: Number,
      default: "",
      min: 0,
      max: 28,
    },
  },
  
  // FSSAI and Food Safety Information
  fssaiDetails: {
    fssaiNumber: {
      type: String,
      trim: true,
      match: /^[0-9]{14}$/,
    },
    fssaiExpiryDate: {
      type: Date,
    },
    foodCategory: {
      type: String,
      enum: ["restaurant", "cafe", "bakery", "sweet_shop", "catering", "other"],
    },
    licenseType: {
      type: String,
      enum: ["basic", "state", "central"],
    },
  },
  
  // Additional Business Information
  businessDetails: {
    website: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    establishedYear: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear(),
    },
    cuisineType: [{
      type: String,
      enum: ["indian", "chinese", "continental", "italian", "mexican", "thai", "japanese", "fast_food", "beverages", "desserts", "other"],
    }],
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String,
    },
  },
  
  // Staff Management
  staffLimit: { 
    type: Number, 
    default: 5, 
    min: 1,
    max: 50,
  },
  currentStaffCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  staff: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
  }],
  
  // Table Management (existing)
  tableLimit: { 
    type: Number, 
    default: 10, 
    min: 1 
  },
  tables: [Number],
  
  // Menu Management (existing)
  menu: [
    {
      name: String,
      price: Number,
      available: Boolean,
      category: String,
    },
  ],
  
  // Subscription & Billing
  subscriptionStatus: {
    type: String,
    enum: ["active", "inactive", "suspended", "trial"],
    default: "trial",
  },
  subscriptionExpiry: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
  },
  
  // Security & Tracking
  lastLogin: {
    type: Date,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
  },
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ createdBy: 1 });
userSchema.index({ businessName: 1 });
userSchema.index({ subscriptionStatus: 1 });
// Remove duplicate hotelCode index - it's already defined in schema with index: true

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Check if user can add more staff
userSchema.methods.canAddStaff = function() {
  return this.currentStaffCount < this.staffLimit;
};

// Virtual for remaining staff slots
userSchema.virtual('remainingStaffSlots').get(function() {
  return Math.max(0, this.staffLimit - this.currentStaffCount);
});

// Virtual for subscription status
userSchema.virtual('isSubscriptionActive').get(function() {
  return this.subscriptionStatus === 'active' && 
         (!this.subscriptionExpiry || this.subscriptionExpiry > new Date());
});

// Account locking logic
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: new Date() }
  });
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.loginAttempts;
  delete user.lockUntil;
  return user;
};

export const User = mongoose.models.User || mongoose.model("User", userSchema);
