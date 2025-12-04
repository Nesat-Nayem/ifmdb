import mongoose, { Document, Schema } from 'mongoose';

export interface IPlatformSettings extends Document {
  key: string;
  value: number;
  label: string;
  description: string;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformSettingsSchema = new Schema<IPlatformSettings>({
  key: { type: String, required: true, unique: true },
  value: { type: Number, required: true, default: 0 },
  label: { type: String, required: true },
  description: { type: String, default: '' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Create default settings if they don't exist
PlatformSettingsSchema.statics.ensureDefaults = async function() {
  const defaults = [
    { key: 'event_platform_fee', value: 20, label: 'Event Platform Fee (%)', description: 'Platform fee percentage for event vendors' },
    { key: 'movie_watch_platform_fee', value: 50, label: 'Movie Watch Platform Fee (%)', description: 'Platform fee percentage for movie watch vendors' },
  ];
  
  for (const setting of defaults) {
    await this.findOneAndUpdate(
      { key: setting.key },
      { $setOnInsert: setting },
      { upsert: true, new: true }
    );
  }
};

export const PlatformSettings = mongoose.model<IPlatformSettings>('PlatformSettings', PlatformSettingsSchema);
