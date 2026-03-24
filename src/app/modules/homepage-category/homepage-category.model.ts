import mongoose, { Schema } from 'mongoose';
import { IHomepageCategory } from './homepage-category.interface';

const HomepageCategorySchema: Schema = new Schema(
  {
    title: { 
      type: String, 
      required: true,
      trim: true
    },
    image: { 
      type: String, 
      required: true 
    },
    link: {
      type: String,
      default: ''
    },
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isDeleted: { 
      type: Boolean, 
      default: false 
    },
  },
  { 
    timestamps: true,
    toJSON: { 
      transform: function(doc, ret: any) {
        ret.createdAt = new Date(ret.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        ret.updatedAt = new Date(ret.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      }
    }
  }
);

export const HomepageCategory = mongoose.model<IHomepageCategory>('HomepageCategory', HomepageCategorySchema);
