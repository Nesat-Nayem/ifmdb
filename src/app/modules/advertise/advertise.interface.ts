export interface IAdvertise {
  image: string;
  status: 'active' | 'inactive';
  isDeleted?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
