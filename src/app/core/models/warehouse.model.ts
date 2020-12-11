import { User } from "./user.model";

export interface Warehouse {
  providence: string;
  department: string;
  city: string;
  address: string;
  name: string;
  createdAt: Date;
  createdBy: User;
}