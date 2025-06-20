import mongoose from 'mongoose';

interface ISource {
  title: string;
  description: string;
  url: string;
  gamesCount: string;
  status: string[];
  addedDate: string;
  lastFetched?: Date;
  lastGameCount?: number;
}

const sourceSchema = new mongoose.Schema<ISource>({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  gamesCount: {
    type: String,
    required: true,
  },
  status: [{
    type: String,
    required: true,
  }],
  addedDate: {
    type: String,
    required: true,
  },
  lastFetched: {
    type: Date,
    default: null,
  },
  lastGameCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Source || mongoose.model<ISource>('Source', sourceSchema);