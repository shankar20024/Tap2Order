import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  employeeId: {
    type: String,
    required: true,
    trim: true,
  },
  
  // 4-digit passcode authentication
  passcode: {
    type: String,
    required: true,
    length: 4,
    match: /^\d{4}$/, // Only 4 digits allowed
  },
  
  // Multi-tenant relationship
  hotelOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Staff Information
  position: {
    type: String,
    enum: ["waiter", "chef", "manager", "cashier", "cleaner", "other"],
    default: "waiter",
  },
  department: {
    type: String,
    enum: ["service", "kitchen", "management", "cleaning", "other"],
    default: "service",
  },
  
  // Contact Information
  phone: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
  },
  
  // Employment Details
  dateOfJoining: {
    type: Date,
    default: Date.now,
  },
  salary: {
    type: Number,
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // Work Schedule
  workingHours: {
    start: {
      type: String, // "09:00"
      default: "09:00",
    },
    end: {
      type: String, // "18:00"
      default: "18:00",
    },
  },
  workingDays: [{
    type: String,
    enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
  }],
  
  // Security & Access Control
  role: {
    type: String,
    default: "staff",
    immutable: true,
  },
  permissions: [{
    type: String,
    enum: [
      "view_orders", 
      "update_order_status", 
      "take_orders", 
      "view_menu", 
      "view_tables",
      "generate_bills"
    ],
    default: ["view_orders", "update_order_status", "take_orders", "view_menu", "view_tables"],
  }],
  
  // Login & Security Tracking
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
  totalLogins: {
    type: Number,
    default: 0,
  },
  
  // Performance Tracking
  ordersHandled: {
    type: Number,
    default: 0,
  },
  tablesServed: [{
    tableNumber: Number,
    date: Date,
  }],
  
  // Emergency Contact
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
  },
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for performance and uniqueness
staffSchema.index({ hotelOwner: 1, passcode: 1 }, { unique: true }); // Unique passcode per hotel
staffSchema.index({ hotelOwner: 1, employeeId: 1 }, { unique: true }); // Unique employee ID per hotel
staffSchema.index({ hotelOwner: 1, isActive: 1 });
staffSchema.index({ position: 1 });

// Note: Passcodes are stored as 4-digit plaintext by explicit request.
// Ensure validation remains enforced by the schema regexp.

// Check if staff account is locked
staffSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Increment login attempts with rate limiting
staffSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 3 failed attempts for 15 minutes (stricter for passcode)
  if (this.loginAttempts + 1 >= 3 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 15 * 60 * 1000 }; // 15 minutes
  }
  
  return this.updateOne(updates);
};

// Reset login attempts and update login stats
staffSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: new Date() },
    $inc: { totalLogins: 1 }
  });
};

// Check if staff has specific permission
staffSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

// Update order handling stats
staffSchema.methods.incrementOrdersHandled = function() {
  return this.updateOne({ $inc: { ordersHandled: 1 } });
};

// Add table served record
staffSchema.methods.addTableServed = function(tableNumber) {
  return this.updateOne({
    $push: {
      tablesServed: {
        tableNumber,
        date: new Date()
      }
    }
  });
};

// Virtual for full name with employee ID
staffSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.employeeId})`;
});

// Virtual for work status
staffSchema.virtual('workStatus').get(function() {
  if (!this.isActive) return 'inactive';
  if (this.isLocked) return 'locked';
  return 'active';
});

// Remove sensitive data from JSON output
staffSchema.methods.toJSON = function() {
  const staff = this.toObject();
  // Keep passcode by request so it can be displayed in staff page.
  delete staff.loginAttempts;
  delete staff.lockUntil;
  delete staff.salary; // Hide salary in general API responses
  return staff;
};

// Static method to find staff by passcode and hotel
staffSchema.statics.findByPasscodeAndHotel = async function(passcode, hotelOwnerId) {
  const staff = await this.findOne({ 
    hotelOwner: hotelOwnerId,
    isActive: true 
  });
  
  if (!staff) return null;
  
  return staff.passcode === passcode ? staff : null;
};

try {
  // If a previous model is cached (with old pre-save hooks), delete it
  if (mongoose.connection?.models?.Staff) {
    delete mongoose.connection.models.Staff;
  }
} catch {}

const Staff = mongoose.model("Staff", staffSchema);
export default Staff;
