import mongoose, { Document, Schema } from 'mongoose';

export interface IEventParticipationType extends Document {
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const eventParticipationTypeSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Participation type name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

eventParticipationTypeSchema.index({ isActive: 1 });

const EventParticipationType = mongoose.model<IEventParticipationType>(
  'EventParticipationType',
  eventParticipationTypeSchema
);

export default EventParticipationType;
