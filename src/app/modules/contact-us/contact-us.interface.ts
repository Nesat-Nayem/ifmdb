import { Document } from 'mongoose';

export interface IContactUs extends Document {
  content: string;
  updatedAt: Date;
  createdAt: Date;
}
