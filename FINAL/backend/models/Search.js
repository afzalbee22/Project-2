import mongoose from 'mongoose';

const searchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  query: String,
  response: String,
  documentIds: [String],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Search', searchSchema);
