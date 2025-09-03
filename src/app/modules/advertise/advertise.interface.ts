export interface IAdvertise {
  image: string;
  status: 'active' | 'inactive';
  link?: string;
  isDeleted?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
