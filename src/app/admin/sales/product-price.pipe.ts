import { Pipe, PipeTransform } from '@angular/core';
import { Product, unitProduct } from 'src/app/core/models/product.model';

@Pipe({
  name: 'productPrice'
})
export class ProductPricePipe implements PipeTransform {

  transform(product: Product, chosenProduct: unitProduct, quantity: number, customerType: string): unknown {
    
    return null;
  }

}
