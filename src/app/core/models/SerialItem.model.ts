import { User } from "./user.model";

export interface SerialItem {
  barcode: string;
  sku: string;
  color: {
    color: string,
    name: string
  };
}