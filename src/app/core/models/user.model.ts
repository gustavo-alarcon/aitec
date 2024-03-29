import { SaleRequestedProducts } from "./sale.model";

export interface User {
  uid?: string;
  email: string;
  role?:string;     //"admin"

  //customerType?:"Mayorista" | "Minorista";         //'Mayorista'
  orders?:number;

  deliveryUser?: boolean;
  mayoristUser?: boolean;

  location?: {
    address: string;
    reference: string;
    coord: { lat: number; lng: number };
    departamento:{
      id: string
      name: string
    };
    provincia:{
      department_id: string
      id: string
      name: string
    };
    distrito:{
      department_id: string
      id: string
      name: string
      province_id: string
    };
    idDistrito:string;
  }[];

  personData: naturalPerson | businessPerson;
  name?:string;           //Dont use this use natural person interface
  lastName?:string;
  lastLogin?: Date;
  lastBrowser?: string[]
  fcmTokens?: {
    [token: string]: true
  };
  favorites?:string[]

  shoppingCar?: SaleRequestedProducts[]
  pendingPayment?: boolean              //Used to indicate if a payment is expected
  saleNumber?: number                   //Total number of transactions
  
}
interface naturalPerson {
  type:"natural";
  name: string;
  lastName: string;
  dni: number;
  phone: string;
}

interface businessPerson {
  type:"jurídica";
  name: string;         //Social reason
  ruc: number;
  address: string;
  phone: string;
  contactPerson: string;
}