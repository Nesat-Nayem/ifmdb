import mongoose, { Schema } from 'mongoose';
import { ICancellationRefund } from './cancellation-refund.interface';

const CancellationRefundSchema: Schema = new Schema(
  {
    content: { 
      type: String, 
      required: true,
      default: '<p>Cancellation & Refund Policy content goes here.</p>'
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

export const CancellationRefund = mongoose.model<ICancellationRefund>('CancellationRefund', CancellationRefundSchema);
