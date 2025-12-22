import { Document } from 'mongoose';

export interface IPartnerTerms extends Document {
  content: string;
  updatedAt: Date;
  createdAt: Date;
}
