import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ["veg", "non-veg", "jain", "beverages", "none"], default: "veg", required: true },
  available: { type: Boolean, default: true },
  
  // Unit and sizing system
  unit: { 
    type: String, 
    enum: ["piece", "plate", "bowl", "liter", "ml", "kg", "gram", "serving"], 
    default: "piece",
    required: true 
  },
  
  // Pricing structure - supports multiple sizes with different prices
  pricing: [{
    size: { 
      type: String, 
      required: true // e.g., "half", "full", "0.5L", "1L", "2L", "small", "medium", "large"
    },
    price: { 
      type: Number, 
      required: true 
    },
    description: { 
      type: String // e.g., "Half Plate", "1 Liter Bottle"
    }
  }],
  
  // Fallback for simple items with single price
  price: { type: Number },
  
  // Additional fields for better organization
  subcategory: { type: String }, // e.g., "beverages", "main-course", "desserts"
  spicyLevel: { 
    type: String, 
    enum: ["mild", "medium", "spicy", "extra-spicy"],
    required: false
  },
  preparationTime: { type: Number }, // in minutes
  
}, { timestamps: true });

const MenuItem = mongoose.models.MenuItem || mongoose.model("MenuItem", menuItemSchema);
export default MenuItem;
