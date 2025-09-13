import mongoose, { Schema, Document } from 'mongoose';

export interface IMovieCategory extends Document {
  title: string;
  status: 'active' | 'inactive';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MovieCategorySchema: Schema = new Schema(
  {
    title: { type: String, required: true, unique: true, trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const MovieCategory = mongoose.model<IMovieCategory>('MovieCategory', MovieCategorySchema);
