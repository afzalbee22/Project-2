import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: String,
  originalName: String,
  fileType: String,
  content: String,
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Document', documentSchema);
