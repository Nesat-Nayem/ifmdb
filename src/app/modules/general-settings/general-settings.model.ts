import mongoose, { Schema } from 'mongoose';
import { IGeneralSettings } from './general-settings.interface';

const GeneralSettingsSchema: Schema = new Schema(
  {
    number: { type: String, default: '' },
    email: { type: String, default: '' },
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
    youtube: { type: String, default: '' },
    favicon: { type: String, default: '' },
    logo: { type: String, default: '' },
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

export const GeneralSettings = mongoose.model<IGeneralSettings>('GeneralSettings', GeneralSettingsSchema);
