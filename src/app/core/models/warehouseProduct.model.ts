import { User } from "./user.model";

export interface WarehouseProduct {
  id: string;
  description: string;
  sku: string;
  skuArray: Array<{
    sku: string,
    color: {
      color: string,
      name: string
    }
  }>
  createdAt: Date;
  createdBy: User;
  editedAt: Date;
  editedBy: User;
}