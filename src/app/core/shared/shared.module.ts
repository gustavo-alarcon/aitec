import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductPricePipe } from './product-price.pipe';
import { SalePricePipe } from './sale-price.pipe';
import { TotalQuantityPipe } from './total-quantity.pipe';



@NgModule({
  declarations: [
    SalePricePipe,
    ProductPricePipe,
    TotalQuantityPipe
  ],
  imports: [
    CommonModule
  ],
  exports: [
    SalePricePipe,
    ProductPricePipe,
    TotalQuantityPipe,
    CommonModule,
  ]
})
export class SharedModule { }
