import { User } from 'src/app/core/models/user.model';
import { Product, unitProduct } from './product.model';
import { Package } from './package.model';

export class saleStatusOptions {
  requesting = 'Solicitando';               //Estado a espera de confirmación de cloud function
  failed = 'Error';                         //Estado de rechazo de confirmación de cloud function
  requested = 'Solicitado';                 //Estado de confirmación de cloud function
  attended = 'Atendido';
  confirmedRequest = 'Solicitud Confirmada';        //can be confirmed only when voucher is valid
  confirmedDocument = 'Comprobante Confirmado';
  // confirmedDelivery = 'Delivery Confirmado';
  // driverAssigned = 'Conductor Asignado'; Para despacho
  finished = 'Entregado';
  cancelled = 'Anulado'
}

type FilterFlags<Base, Condition, Data> =
  Base extends Condition ? Data : never
  ;

export interface SaleRequestedProducts {
  product: Product | Package;
  //Product can contain many colors, so we use
  //chosenProduct to get the color
  //This means, a sale can have many products with same id
  //inside requested products, but with different colro (chosen)
  quantity: number;
  chosenProduct: unitProduct;
  chosenOptions?: any;      //I included it only to avoid type errors. Will be fixed when doing sales section
  color: boolean;
  price: number;
}

export interface Sale {
  id: string;
  correlative: number;
  correlativeType: string;
  payType?: any,
  document?: string,             //tipo de comprobante
  location?: {
    address: string,
    district: any,
    coord?: {
      lat: number,
      lng: number,
    },
    reference: string,
    phone: number
  },

  userId?: string;
  user: User;                   //requesting user
  requestDate: Date,            //Fecha deseada por cliente

  idDocument: number;
  documentInfo: any;
  payInfo: any;

  idDelivery: number;
  deliveryType: string;
  deliveryInfo: any;
  payDelivery:boolean;
  observation: string;

  adviser:any;
  coupon:any;
  //A partir de este punto, todo varia de acuerdo
  //a formulario de ventas.
  status: saleStatusOptions[keyof saleStatusOptions]

  requestedProducts: SaleRequestedProducts[];


  deliveryPrice: number;
  total: number;

  voucher: {
    voucherPhoto: string,
    voucherPath: string
  }[]

  voucherChecked: boolean,      //done by admin. needed to confirmedDelivery
  voucherActionBy?: User,
  voucherActionAt?: Date,

  attendedData?: {             //Can go only when Atendido or more
    attendedBy: User,
    attendedAt: Date,
  }

  confirmedRequestData?: {        //only when confirmedRequest or more
    assignedDate: Date,           //Fecha asignada por admin
    requestedProductsId: string[];//Used in virtual stock
    observation: string,

    confirmedBy: User,
    confirmedAt: Date,
  }

  confirmedDocumentData?: {    //This refers to when we give
    documentNumber: string,   //the n° comprobante

    confirmedBy: User,
    confirmedAt: Date,
  }

  confirmedDeliveryData?: {           //To confirme delivery data we need
    deliveryType: "Biker" | "Moto",   //to have the vouchers checked
    deliveryBusiness: any,

    confirmedBy: User,
    confirmedAt: Date
  }

  cancelledData?: {
    cancelledAt: Date,
    cancelledBy: User,
  }

  driverAssignedData?: {
    assignedAt: Date,
    assignedBy: User,
    observation: string,

    assignedDriver: any,
  }

  finishedData?: {
    finishedAt: Date,
    finishedBy: User,
    observation: string
  }

  rateData?: {
    serviceRate: number,
    productRate: number,
    deliveryRate: number,
    observation?: string,
  }

  createdAt: Date,
  createdBy: User,

  editedAt?: Date,
  editedBy?: User

  transactionCliente?: any;
  transactionSale?: any;
}