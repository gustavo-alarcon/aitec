import { Product } from "./product.model";
import { User } from "./user.model";

export interface SerialItem {
  barcode: string;    //color+barcode
  sku: string;        //refers to color
  color: {
    color: string,
    name: string
  };
  product: Product
}