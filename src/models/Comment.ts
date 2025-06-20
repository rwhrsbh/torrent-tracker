import mongoose from 'mongoose';

interface IComment {
  user: mongoose.Types.ObjectId;
  game?: mongoose.Types.ObjectId;
  gameGroup?: string;
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
    required: false,
  },
  gameGroup: {
    type: String,
    required: false,
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

// Custom validation: either game or gameGroup must be provided
commentSchema.path('game').validate(function(value) {
  return this.game || this.gameGroup;
}, 'Comment must be associated with either a game or a game group');

commentSchema.path('gameGroup').validate(function(value) {
  return this.game || this.gameGroup;
}, 'Comment must be associated with either a game or a game group');

export default mongoose.models.Comment || mongoose.model<IComment>('Comment', commentSchema);