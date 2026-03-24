import { Document } from 'mongoose';

export interface IHomepageCategory extends Document {
  title: string;
  image: string;
  link: string;
  order: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
