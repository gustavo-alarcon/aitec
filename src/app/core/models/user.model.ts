export interface User {
  uid?: string;
  email?: string;
  nci?: string;
  contact?: {
    phone?: number;
    ci?: number
  }
  location?: {
    address: string;
    reference: string;
    coord: { lat: number; lng: number };
  };
  photoURL?: string;
  name?: string;
  lastName1?: string;
  lastName2?: string;

  lastLogin?: Date;
  lastBrowser?: string[]
  lastPassDate?: Date;
}