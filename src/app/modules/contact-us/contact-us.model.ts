import mongoose, { Schema } from 'mongoose';
import { IContactUs } from './contact-us.interface';

const ContactUsSchema: Schema = new Schema(
  {
    content: { 
      type: String, 
      required: true,
      default: '<p>Contact Us content goes here.</p>'
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

export const ContactUs = mongoose.model<IContactUs>('ContactUs', ContactUsSchema);
