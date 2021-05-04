import { SerialNumber } from "./SerialNumber.model";
import { User } from "./user.model";
import { Warehouse } from "./warehouse.model";

export interface Waybill {
  id: string;
  orderCode: string;      //Cambiar a Nro de Guia de remisión
  saleOrder?: string;
  addressee: string;      //Destinatario
  dni: string;
  transferDate: Date;
  startingPoint: string;
  arrivalPoint: string;
  transferReason: typeof TRANSFER_REASON[number];
  observations: string;
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

export const TRANSFER_REASON = <const>[
  "venta",
  "venta sujeta a confirmación del comprador",
  "compra",
  "consignación",
  "devolución",
  "traslado entre establecimientos de la misma empresa",
  "traslado de bienes para transformación",
  "recojo de bienes",
  "traslado por emisor itinerante de comprobantes de pago",
  "traslado zona primaria",
  "importación",
  "exportación",
  "venta con entrega a terceros",
  "otros no incluidos en los puntos anteriores tales como exhibición, demostración, etc."
]