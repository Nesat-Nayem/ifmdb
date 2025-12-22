import mongoose, { Schema } from 'mongoose';
import { IPartnerTerms } from './partner-terms.interface';

const PartnerTermsSchema: Schema = new Schema(
  {
    content: { 
      type: String, 
      required: true,
      default: '<p>Partner Terms and Conditions content goes here.</p>'
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

export const PartnerTerms = mongoose.model<IPartnerTerms>('PartnerTerms', PartnerTermsSchema);
