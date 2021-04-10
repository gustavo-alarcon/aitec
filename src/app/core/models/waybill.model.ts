import { SerialNumber } from "./SerialNumber.model";
import { User } from "./user.model";
import { Warehouse } from "./warehouse.model";

export interface Waybill {
  id: string;
  orderCode: string;      //Cambiar a Nro de Guia de remisión
  saleOrder?: string;
  addressee: string;
  dni: string;
  transferDate: Date;
  startingPoint: string;
  arrivalPoint: string;
  transferReason: string;
  observations: string;
  warehouse: Warehouse;
  productList: Array<WaybillProductList>;
  createdAt: Date;
  createdBy: User;
  editedAt: Date;
  editedBy: User;
}

export interface WaybillProductList{
  mainCode: string;
  description: string;
  invoice: string;
  waybill: string;
  productId: string;
  warehouseId: string;
  serialList: Array<SerialNumber>;
  quantity: number;
  unit: string;
  totalWeight?: number;
}