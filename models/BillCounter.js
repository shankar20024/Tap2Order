import mongoose from 'mongoose';

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

// Clear model cache to prevent development issues
if (mongoose.models.BillCounter) {
  delete mongoose.models.BillCounter;
}

export default mongoose.model('BillCounter', BillCounterSchema);
