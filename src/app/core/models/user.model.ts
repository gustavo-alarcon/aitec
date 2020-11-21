export interface User {
  uid?: string;
  email: string;
  location?: {
    address: string;
    reference: string;
    coord: { lat: number; lng: number };
  };

  personData: naturalPerson | businessPerson;

  lastLogin?: Date;
  lastBrowser?: string[]
  fcmTokens?: {
    [token: string]: true
  }
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