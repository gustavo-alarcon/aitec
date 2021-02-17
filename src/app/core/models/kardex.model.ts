import { User } from "./user.model";

export interface Kardex {
  id: string;
  type: string;
  operationType: string;
  invoice: string;
  waybill: string;
  inflow: number;
  outflow: number;
  createdBy: User;
  createdAt: Date;
  editedBy: User;
  editedAt: Date;
}