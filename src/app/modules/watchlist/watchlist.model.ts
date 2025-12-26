import mongoose, { Document, Schema } from 'mongoose';

export interface IWatchlistItem extends Document {
  userId: mongoose.Types.ObjectId;
  itemType: 'watch-video' | 'movie' | 'event';
  itemId: mongoose.Types.ObjectId;
  addedAt: Date;
}

const WatchlistSchema = new Schema<IWatchlistItem>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    itemType: {
      type: String,
      enum: ['watch-video', 'movie', 'event'],
      required: true
    },
    itemId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'itemType'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure unique watchlist items per user
WatchlistSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });

// Index for faster queries
WatchlistSchema.index({ userId: 1, addedAt: -1 });

export const Watchlist = mongoose.model<IWatchlistItem>('Watchlist', WatchlistSchema);
