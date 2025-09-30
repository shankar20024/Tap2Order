import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // Make optional for global sections
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  displayOrder: { 
    type: Number, 
    default: 0 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  color: { 
    type: String, 
    default: "#f59e0b" // Default amber color
  },
  icon: { 
    type: String, 
    default: "🍽️" // Default food emoji
  }
}, { timestamps: true });

// Unique index to ensure unique section names globally
sectionSchema.index({ name: 1 }, { unique: true });

const Section = mongoose.models.Section || mongoose.model("Section", sectionSchema);
export default Section;
