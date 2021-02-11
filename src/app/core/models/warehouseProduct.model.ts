import { User } from "./user.model";

export interface WarehouseProduct {
  id: string;
  description: string;
  sku: string;
  createdAt: Date;
  createdBy: User;
  editedAt: Date;
  editedBy: User;
}