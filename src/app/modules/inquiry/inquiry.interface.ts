export interface IInquiry {
  name: string;
  email: string;
  phone: string;
  purpose: string;
  message: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
