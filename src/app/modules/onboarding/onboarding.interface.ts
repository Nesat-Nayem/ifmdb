export interface IOnboarding {
  title: string;
  subtitle?: string;
  image: string; // banner image URL
  status: 'active' | 'inactive';
  metaTitle?: string;
  metaTags?: string[];
  metaDescription?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
