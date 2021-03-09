import { User } from './user.model';

export interface Product {
  package?: false;
  id: string;
  description: string;
  additionalDescription: string;
  idCategory?: string;
  //idCategory will refer to id, category or subcategory. CHeck category
  //in coupon model for more info
  guarantee: boolean;
  timeguarantee: number;
  sku: string;                //Codigo de existencia
  cost: number;
  weight: number;
  model: string;
  brand: Brand;
  products: Array<unitProduct>;       //Diferenciados por color
  price?: number;
  priceMin: number;
  priceMay: number;
  promo: boolean;           //Indicates wheter there is a promo
  promoData?: PromoData;
  published?: boolean;
  priority?: number;
  createdAt: Date;
  createdBy: User;
  editedAt: Date;
  editedBy: User;
  noColor: boolean;
  colors: Array<Color>;//Even if it does not have color, it will still have 1 in products
  gallery: Array<Gallery>;
  indCover: number;
  skuArray: Array<string>;        //SKU por unidad por mismo producto
  warehouse: Array<string>;
  questions?: number;
  realStock: number;
  zones?: Zone[]
}

export interface unitProduct {
  //This SKU refers to the color code, not the SKU of the product
  sku: string;
  color: Color;
  gallery: Array<Gallery>;
  stock?:number;          //NO FUNCIONA
  realStock?: number;
  virtualStock?: number;
}

interface PromoData {
  quantity: number;
  promoPrice: number;
  offer?: number;
  type?: string;
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

interface Zone {
  name: string;
  delivery: number;
}
export interface Brand {
  id: string;
  createdAt: Date;
  name: string;
  photoURL: string;
  photoPath: string
}

