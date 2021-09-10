import { Pipe, PipeTransform } from '@angular/core';
import { Product } from '../models/product.model';

@Pipe({
  name: 'productStock'
})
export class ProductStockPipe implements PipeTransform {

  transform(product: Product, realStock: boolean, colorSku?: string): number {

    let colors = colorSku ? product.products.filter(el => el.sku == colorSku) : product.products

    return colors.reduce((prev, curr)=> {
      return prev + (realStock ? curr.realStock : curr.virtualStock)
    }, 0)

  }

}
