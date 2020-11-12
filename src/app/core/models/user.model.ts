export interface User {
  uid?: string;
  email: string;
  location?: {
    address: string;
    reference: string;
    coord: { lat: number; lng: number };
  };

  type: string;
  name: string;
  lastName: string;
  dni: number;
  phone: string;
  business: string;
  ruc: number;
  address: string;
  feed: boolean;


  lastLogin?: Date;
  lastBrowser?: string[]
}