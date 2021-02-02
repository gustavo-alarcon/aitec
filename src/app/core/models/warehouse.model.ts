import { User } from "./user.model";

export interface Warehouse {
  id: string;
  department: string;
  providence: string;
  district: string;
  address: string;
  name: string;
  createdAt: Date;
  createdBy: User;
  editedAt: Date;
  editedBy: User;
}