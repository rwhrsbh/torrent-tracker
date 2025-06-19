import mongoose from 'mongoose';

interface IGameTorrent {
  title: string;
  cleanTitle?: string;
  version?: string;
  genres: string[];
  likes: number;
  likedBy: mongoose.Types.ObjectId[];
  comments: mongoose.Types.ObjectId[];
  sources: {
    name: string;
    uris: string[];
    uploadDate: Date;
    fileSize: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const gameTorrentSchema = new mongoose.Schema<IGameTorrent>({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  cleanTitle: {
    type: String,
    required: false,
  },
  version: {
    type: String,
    required: false,
  },
  genres: [{
    type: String,
    default: [],
  }],
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
  }],
  sources: [{
    name: {
      type: String,
      required: true,
    },
    uris: [{
      type: String,
      required: true,
    }],
    uploadDate: {
      type: Date,
      required: true,
    },
    fileSize: {
      type: String,
      required: true,
    },
  }],
}, {
  timestamps: true,
});

gameTorrentSchema.index({ title: 'text' });

export default mongoose.models.GameTorrent || mongoose.model<IGameTorrent>('GameTorrent', gameTorrentSchema);