
export interface ReferralSlips{
  uid:string;
  orderCode:string;
  addressee:string;
  DNI:number;
  dateTranfer:Date
  startingPoint:string;
  arrivalPoint:string;
  reasonTransfer:string
  observations:string
  warehouse:string;
  productList:Array<any>;
}