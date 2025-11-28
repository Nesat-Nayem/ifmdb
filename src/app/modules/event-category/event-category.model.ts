import mongoose, { Document, Schema } from 'mongoose';

export interface IEventCategory extends Document {
  name: string;
  image: string;
  isMusicShow: boolean;
  isComedyShow: boolean;
  isActive: boolean;
  eventCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const eventCategorySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true
    },
    image: {
      type: String,
      required: [true, 'Category image is required']
    },
    isMusicShow: {
      type: Boolean,
      default: false
    },
    isComedyShow: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    eventCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexes
eventCategorySchema.index({ name: 1 });
eventCategorySchema.index({ isMusicShow: 1 });
eventCategorySchema.index({ isComedyShow: 1 });
eventCategorySchema.index({ isActive: 1 });

const EventCategory = mongoose.model<IEventCategory>('EventCategory', eventCategorySchema);

export default EventCategory;
