import { Document } from 'mongoose';

export type BannerType = 'home' | 'film_mart' | 'events' | 'watch_movies';
export type BannerPlatform = 'web' | 'mobile' | 'both';

export interface IBanner extends Document {
  title: string;
  image: string;
  bannerType: BannerType;
  platform: BannerPlatform;
  isActive: boolean;
  order: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}




