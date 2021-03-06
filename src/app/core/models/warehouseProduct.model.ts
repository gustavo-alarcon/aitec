import { User } from "./user.model";

export interface WarehouseProduct {
  id: string;
  description: string;
  sku: string;      //codigo de existencia
  skuArray: Array<{
    sku: string,    //Codigo de colores
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