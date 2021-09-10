import { Pipe, PipeTransform } from '@angular/core';
import { Product } from 'src/app/core/models/product.model';

@Pipe({
  name: 'warehouseStock'
})
export class WarehouseStockPipe implements PipeTransform {

  transform(product: Product, warehouseId: string): number {
    let stock = product.warehouseStock[warehouseId]
    return stock ? stock : 0;
  }

}
