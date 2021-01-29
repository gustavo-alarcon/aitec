import { User } from "./user.model";

export interface Warehouse {
  department: string;
  providence: string;
  city: string;
  address: string;
  name: string;
  createdAt: Date;
  createdBy: User;
  editedAt: Date;
  editedBy: User;
}