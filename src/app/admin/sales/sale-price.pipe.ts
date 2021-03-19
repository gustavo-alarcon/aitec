import { Pipe, PipeTransform } from '@angular/core';
import { Sale } from 'src/app/core/models/sale.model';
import { DatabaseService } from 'src/app/core/services/database.service';

@Pipe({
  name: 'salePrice'
})
export class SalePricePipe implements PipeTransform {
  constructor(
    private dbs: DatabaseService
  ){}

  transform(sale: Sale): number {
    return this.dbs.giveProductPriceOfSale(sale);
  }

}
