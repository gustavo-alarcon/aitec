import { User } from 'src/app/core/models/user.model';
import { Product, unitProduct, Zone } from './product.model';
import { Package } from './package.model';
import { Coupon } from './coupon.model';
import { Stores } from './stores.model';
import { Payments } from './payments.model';
import { Adviser } from './adviser.model';
import { Waybill } from './waybill.model';

export class saleStatusOptions {
  requesting = 'Solicitando';               //Estado a espera de confirmación de cloud function
  failed = 'Error';                         //Estado de rechazo de confirmación de cloud function
  paying = 'Pagando';                       //Estado de confirmación de cloud function. Stock separado, se espera pago. Usuario se marcará con pendingPayment

  requested = 'Solicitado';                 //Venta confirmada por cloud function y pagada
  attended = 'Atendido';
  //Fecha asignada y tracking
  confirmedRequest = 'Solicitud Confirmada';  
  //Aca recien aparece n° de comprobante      //can be confirmed only when voucher is valid
  confirmedDocument = 'Comprobante Confirmado'; //Recien pasan a almacen
  confirmedDelivery = 'Delivery Confirmado';
  // driverAssigned = 'Conductor Asignado'; Para despacho
  finished = 'Entregado';
  cancelled = 'Anulado'
}

type FilterFlags<Base, Condition, Data> =
  Base extends Condition ? Data : never
  ;

export interface SaleRequestedProducts {
  product: Product //| Package;
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
  user: User;                   //requesting user

  status: saleStatusOptions[keyof saleStatusOptions]
  requestedProducts: SaleRequestedProducts[];

  // Delivery data
  deliveryPickUp: boolean;  //Whether it is pickup or delivery (sent)
  delivery: Zone | Stores;   //Product zone in case of delivery, stores in pickup. When empty means a coordinar
  observation: string;
  location: User["location"][0]             //In case of delivery and valid zone
  deliveryPrice: number;                  //0 when pickup. In case of delivery, has price from zone

  //Coupon data
  coupon:Coupon;
  couponDiscount: number       //Discount applied at creatinon

  //Payment data
  document: "Boleta"| "Factura",             //tipo de comprobante
  documentInfo: {
    number: string,
    name: string
    address?: string          //Only in "Factura"
  } 
  
  payType: Payments

  adviser: Adviser;

  //Here comes things that will be editted
  additionalPrice?: number;

  voucher: {
    voucherPhoto: string,
    voucherPath: string
  }[]

  // voucherChecked: boolean,      //done by admin. needed to confirmedDelivery
  // voucherActionBy?: User,
  // voucherActionAt?: Date,

  attendedData?: {             //Can go only when Atendido or more
    attendedBy: User,
    attendedAt: Date,
  }

  confirmedRequestData?: {        //only when confirmedRequest or more
    assignedDate: Date,           //Fecha asignada por admin
    trackingCode: string,
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
    referralGuide: Waybill,          //referralGuideDate is the date when referral

    deliveryUser: User,

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

export interface SaleEmailData {
  adviser: boolean;
  adviserNumber: string;
  adviserMail: string;

  correlative: string;    //#000005 correlativeType+correlative
  createdAt: string;      //20 diciembre, 2020
  paymentMethod: string;  //Tarjeta

  document: string;   //Boleta/Factura
  documentInfoNumber: string; //DNI/RUC
  documentInfoName: string;      //NOmbre apellido / razon social
  documentInfoAddress: string;      //Only in case of factura

  deliveryType: string;         //Recojo en Tienda, Envío, A Coordinar (here the next won't apply)
  departamento: string;
  provincia: string;
  distrito: string;
  address: string;

  productData: {
    description: string;
    quantity: number;
    total: string;
  }[]

  subTotal: string;
  igv: string;
  sum: string;    //subTotal + igv
  promotionalDiscount: string;
  delivery: string;
  total: string;
}