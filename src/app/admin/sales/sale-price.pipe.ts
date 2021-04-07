import { Pipe, PipeTransform } from '@angular/core';
import { Product } from 'src/app/core/models/product.model';
import { Sale } from 'src/app/core/models/sale.model';
import { User } from 'src/app/core/models/user.model';
import { DatabaseService } from 'src/app/core/services/database.service';

@Pipe({
  name: 'salePrice'
})
export class SalePricePipe implements PipeTransform {
  constructor(
    private dbs: DatabaseService
  ){}

  transform(requestedProducts: {product: Product, quantity: number}[], 
            user: User): number {
    let price = this.dbs.giveProductPriceOfSale(requestedProducts, user)
    return price
  }

}
