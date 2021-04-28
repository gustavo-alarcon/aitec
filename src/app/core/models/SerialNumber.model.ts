import { User } from "./user.model";
//Dentro de cada warehouseproduct
///db/aitec/warehouses/lujOB8TwOHuI2EuSUr9w/products/N1mAlubvitsj76J9emPv/series

//El numero de serie solo esta figurando en barcode
export interface SerialNumber {     
  id: string;
  productId: string;
  warehouseId: string;
  barcode: string;  //SKU+NUM serie
  sku: string;      //codigo de color
  color: {
    color: string,
    name: string
  };
  status: "stored"|"sold";
  createdAt: Date;
  createdBy: User;
  editedAt: Date;
  editedBy: User;
}