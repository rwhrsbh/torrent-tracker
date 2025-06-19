import mongoose from 'mongoose';

interface IComment {
  user: mongoose.Types.ObjectId;
  game: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new mongoose.Schema<IComment>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GameTorrent',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Comment || mongoose.model<IComment>('Comment', commentSchema);