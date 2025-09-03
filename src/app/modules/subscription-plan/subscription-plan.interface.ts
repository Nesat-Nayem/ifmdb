export interface ISubscriptionPlan {
  planName: string;
  planCost: number;
  planInclude: string[];
  metaTitle?: string;
  metaTag?: string[];
  metaDescription?: string;
  isDeleted?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
