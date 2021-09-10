import { Kardex } from "./kardex.model";
import { Product } from "./product.model";
import { Sale } from "./sale.model";
import { User } from "./user.model";
import { Warehouse } from "./warehouse.model";

//El numero de serie solo esta figurando en barcode
//productList/productId/series
export interface SerialNumber {     
  id: string;
  productId: string;
  warehouseId: string;
  barcode: string;  //SKU+NUM serie
  sku: string;      //codigo de color
  color: {
    color: string,
    name: string
  };
  status: "stored"|"sold";
  createdAt: Date;
  createdBy: User;
  editedAt: Date;
  editedBy: User;
}

export interface SerialNumberWithPrice {
  list: SerialNumber[] | string[],
  cost: number,
  product: Product,
  warehouse: Warehouse
}

//seriesPreprocessingRef: `db/aitec/seriesPreprocessingRef`= `db/aitec/seriesPreprocessingRef`
export interface serialProcess {
  id: string;
  invoice: string;        //Comprobante
  waybill: string;        //GR
  type: "Ingreso de Productos" | "Retiro de Productos" | "Venta" | "Retiro por Guía de Remisión"
  changeVirtualStock ?: boolean;
  list: SerialNumberWithPrice[];
  sale: Sale;
  kardexType: Kardex["type"];
  kardexOperationType: Kardex["operationType"];
  observations: string;
  createdBy: User;
  createdAt: Date;
}