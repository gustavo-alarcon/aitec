export interface Payments {
  account: string;  //Es una descripcion
  createdAt: Date;
  id: string;
  name: string;           //If it is tarjeta, will include word arjeta
  voucher: boolean        //To incluide voucher photo
  type?: 1|2|3             //1 When no voucher no tarjeta, 3 when voucher, 2 tarjeta
                            //Not saved on db, but calculated in dbs. Only present on sales
}