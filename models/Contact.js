import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  phone: {
    type: String,
    trim: true,
    required: [true, 'Phone number is required'],
    match: [/^\+?[0-9\s-()]{10,20}$/, 'Please enter a valid phone number']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [2000, 'Message cannot be more than 2000 characters']
  },
  status: {
    type: String,
    enum: ['new', 'in_progress', 'resolved', 'spam'],
    default: 'new'
  },
  read: {
    type: Boolean,
    default: false
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    referrer: String
  }
}, {
  timestamps: true
});

// Add text index for search functionality
contactSchema.index({ name: 'text', email: 'text', message: 'text' });

// Create model if it doesn't exist
export default mongoose.models.Contact || mongoose.model('Contact', contactSchema);
