export interface User {
  uid?: string;
  email: string;
  role?:string;
  customerType?:string;
  orders?:number;
  location?: {
    address: string;
    reference: string;
    coord: { lat: number; lng: number };
    departamento:string;
    provincia:string;
    distrito:string;
    idDistrito:string;
  }[];

  personData: naturalPerson | businessPerson;
  name?:string;
  lastName?:string;
  lastLogin?: Date;
  lastBrowser?: string[]
  fcmTokens?: {
    [token: string]: true
  };
  favorites?:string[]
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