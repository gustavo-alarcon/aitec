import { Pipe, PipeTransform } from '@angular/core';
import { BuyRequestedProduct } from 'src/app/core/models/buy.model';
import { Product, unitProduct } from 'src/app/core/models/product.model';
import { Sale, SaleRequestedProducts } from 'src/app/core/models/sale.model';
import { User } from 'src/app/core/models/user.model';
import { DatabaseService } from 'src/app/core/services/database.service';

@Pipe({
  name: 'productPrice'
})
export class ProductPricePipe implements PipeTransform {
  constructor(
    private dbs: DatabaseService
  ){}

  transform(item: {product: Product, chosenProduct: unitProduct, quantity: number}, user: User): unknown {
    let reqProduct: SaleRequestedProducts = {
      ...item,
      color: null,
      price: null
    }

    return this.dbs.giveProductPrice(reqProduct, user.customerType)
  }

}
