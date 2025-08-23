import mongoose, { Schema } from 'mongoose';
import { IHelpCenter } from './help-center.interface';

const HelpCenterSchema: Schema = new Schema(
  {
    content: {
      type: String,
      required: true,
      default: '<p>Help Center content goes here.</p>',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret: any) {
        if (ret.createdAt) ret.createdAt = new Date(ret.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        if (ret.updatedAt) ret.updatedAt = new Date(ret.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      },
    },
  }
);

export const HelpCenter = mongoose.model<IHelpCenter>('HelpCenter', HelpCenterSchema);
