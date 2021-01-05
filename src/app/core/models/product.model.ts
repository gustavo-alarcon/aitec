import { User } from './user.model';
import { Unit } from './unit.model';

export interface Product {
  package?: false;
  id: string;
  description: string;
  additionalDescription: string;
  category: string;
  subcategory?: string;
  subsubcategory?: string;
  guarantee: boolean;
  timeguarantee: number;
  weight: number;
  sku: string;
  cost: number;
  model: string;
  brand: Brand;
  products: Array<unitProduct>;
  price?: number;      //Should this price be with IGV?
  priceMin: number;
  priceMay: number;
  realStock: number;  //Real stock will be amounted here after accepting a product in the log sect
  virtualStock: number;  //To check the virtual we will use another collection
  //sellMinimum: number;    //The minimum by which, we should top selling to the public
  //alertMinimum: number;   //Minimum by which one should get an alert to request more 
  promo: boolean;           //Indicates wheter there is a promo
  promoData?: PromoData;
  published?: boolean;
  priority?: number;
  createdAt: Date;
  createdBy: User;
  editedAt: Date;
  editedBy: User;
  noColor: boolean;
  colors: Array<Color>;
  gallery: Array<Gallery>;
  indCover: number;
  searchNumber: number;
  purchaseNumber: number;  //Número total de compras
  warehouse: Array<any>;
  skuArray: Array<string>;
  questions?:number;
}

interface unitProduct {
  sku: string;
  color: Color;
  gallery: Array<Gallery>;
  stock: number;
}

interface PromoData {
  quantity: number;
  promoPrice: number;
  offer?: number;
  type?:string;
}

interface Gallery {
  photoURL: string;
  photoPath: string;
  sku: string;
}

interface Color {
  name: string;
  color: string;
}

export interface Brand {
  id: string;
  createdAt: Date;
  name: string;
  photoURL: string;
  photoPath: string
}

