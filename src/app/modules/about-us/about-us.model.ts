import mongoose, { Schema } from 'mongoose';
import { IAboutUs } from './about-us.interface';

const AboutUsSchema: Schema = new Schema(
  {
    content: { 
      type: String, 
      required: true,
      default: '<p>About Us content goes here.</p>'
    }
  },
  { 
    timestamps: true,
    toJSON: { 
      transform: function(doc: any, ret: any) {
        ret.createdAt = new Date(ret.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        ret.updatedAt = new Date(ret.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        return ret;
      }
    }
  }
);

export const AboutUs = mongoose.model<IAboutUs>('AboutUs', AboutUsSchema);
