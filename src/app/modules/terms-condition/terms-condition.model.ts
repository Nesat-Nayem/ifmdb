import mongoose, { Schema } from 'mongoose';
import { ITermsCondition } from './terms-condition.interface';

const TermsConditionSchema: Schema = new Schema(
  {
    content: { 
      type: String, 
      required: true,
      default: '<p>Terms & Conditions content goes here.</p>'
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

export const TermsCondition = mongoose.model<ITermsCondition>('TermsCondition', TermsConditionSchema);