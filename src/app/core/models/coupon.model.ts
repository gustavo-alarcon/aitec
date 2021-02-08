export interface Coupon {
  id: string;
  name: string;
  redirectTo: string;
  discount: number;
  category: string;
  brand: string;
  startDate?: Date;
  endDate?: Date;
  limitDate: boolean;
  limit: number;
  type: number;
  createdAt: Date;
  users?: string[];
  count?: number;
  from: number;
}