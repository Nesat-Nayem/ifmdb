import mongoose, { Document, Schema } from 'mongoose';

export interface IEventType extends Document {
  title: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const eventTypeSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Event type title is required'],
      trim: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

eventTypeSchema.index({ isActive: 1 });

const EventType = mongoose.model<IEventType>('EventType', eventTypeSchema);

export default EventType;
