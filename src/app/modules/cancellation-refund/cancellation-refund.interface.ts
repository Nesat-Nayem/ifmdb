import { Document } from 'mongoose';

export interface ICancellationRefund extends Document {
  content: string;
  updatedAt: Date;
  createdAt: Date;
}
