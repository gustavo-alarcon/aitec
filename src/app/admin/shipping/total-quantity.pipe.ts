import { Pipe, PipeTransform } from '@angular/core';
import { Sale } from 'src/app/core/models/sale.model';

@Pipe({
  name: 'totalQuantity'
})
export class TotalQuantityPipe implements PipeTransform {

  transform(sale: Sale): number {
    return sale.requestedProducts.reduce((prev, curr) => {
      return curr.quantity + prev
    }, 0)
  }

}
