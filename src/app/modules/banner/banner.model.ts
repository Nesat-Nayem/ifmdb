import mongoose, { Schema } from 'mongoose';
import { IBanner, BannerType, BannerPlatform } from './banner.interface';

const BannerSchema: Schema = new Schema(
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
    bannerType: {
      type: String,
      enum: ['home', 'film_mart', 'events', 'watch_movies'] as BannerType[],
      required: true,
      default: 'home'
    },
    platform: {
      type: String,
      enum: ['web', 'mobile', 'both'] as BannerPlatform[],
      required: true,
      default: 'both'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    },
    isDeleted: { 
      type: Boolean, 
      default: false 
    },
  },
  
  { 
    timestamps: true,
    toJSON: { 
      transform: function(doc, ret:any) {
        ret.createdAt = new Date(ret.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        ret.updatedAt = new Date(ret.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      }
    }
  }
);

export const Banner = mongoose.model<IBanner>('Banner', BannerSchema);
