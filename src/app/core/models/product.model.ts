import { User } from './user.model';
import { Unit } from './unit.model';

export interface Product {
  package?: false;
  id: string;
  description: string;
  additionalDescription: string;
  sku: string;
  category: string;  
  subcategory?:string;
  subsubcategory?:string;
  guarantee:boolean;
  timeguarantee:number;
  weight:number;
  code:string;
  model:string;
  colors:Array<Color>;
  price?: number;      //Should this price be with IGV?
  priceMin:number;
  priceMay:number;       
  realStock: number;  //Real stock will be amounted here after accepting a product in the log sect
  virtualStock: number;  //To check the virtual we will use another collection
  //sellMinimum: number;    //The minimum by which, we should top selling to the public
  //alertMinimum: number;   //Minimum by which one should get an alert to request more 
  photoURL: string;
  gallery:Array<string>;
  promo: boolean;           //Indicates wheter there is a promo
  promoData?: PromoData;
  published?: boolean;
  priority?: number;
  createdAt: Date;
  createdBy: User;
  editedAt: Date;
  editedBy: User;
  brand?:string;
  purchaseNumber: number;  //Número total de compras
  warehouse:Array<any>
}

interface PromoData {
  quantity: number;
  promoPrice: number;
  offer?:number;
}

interface Gallery {
  photoURL: string;
  photoPath: string;
}

interface Color {
  name: string;
  color: string;
  sku?:string;
}

export interface Brand {
  id:string;
  createdAt:Date;
  name:string;
  photoURL: string;
  photoPath:string
}

export interface MermaTransfer {
  id: string;
  productId: string;
  toMerma: boolean;         //From stock toMerma or from merma to stock
  quantity: number;
  date: Date;
  user: User;
  observations: string;
}

export interface MermaTransferWithProduct extends MermaTransfer, Product {} 