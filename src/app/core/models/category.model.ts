import { Brand } from "./product.model";

export interface Category {
  id: string;
  idCategory: string;
  idSubCategory: string;
  name: string;
  createdAt: Date;
  editedAt: Date;
  completeName?: string;
  brands?: Brand[]
}