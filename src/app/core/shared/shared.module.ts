import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductPricePipe } from './product-price.pipe';
import { SalePricePipe } from './sale-price.pipe';
import { TotalQuantityPipe } from './total-quantity.pipe';
import { WarehouseStockPipe } from './warehouse-stock.pipe';
import { ProductStockPipe } from './product-stock.pipe';



@NgModule({
  declarations: [
    SalePricePipe,
    ProductPricePipe,
    TotalQuantityPipe,
    WarehouseStockPipe,
    ProductStockPipe
  ],
  imports: [
    CommonModule
  ],
  exports: [
    SalePricePipe,
    ProductPricePipe,
    TotalQuantityPipe,
    WarehouseStockPipe,
    ProductStockPipe,
    CommonModule,
  ]
})
export class SharedModule { }
