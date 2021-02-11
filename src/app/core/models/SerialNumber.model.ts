import { User } from "./user.model";

export interface SerialNumber {
  id: string;
  barcode: string;
  sku: string;
  color: {
    color: string,
    name: string
  };
  status: string;
  createdAt: Date;
  createdBy: User;
  editedAt: Date;
  editedBy: User;
}