import { Document } from 'mongoose';

export interface IAboutUs extends Document {
  content: string;
  updatedAt: Date;
  createdAt: Date;
}
