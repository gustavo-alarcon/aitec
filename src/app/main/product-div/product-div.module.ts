import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductDivComponent } from './product-div.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { QuantityDivModule } from '../quantity-div/quantity-div.module';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { MatDialogModule } from '@angular/material/dialog';


@NgModule({
  declarations: [ProductDivComponent],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    QuantityDivModule,
    LazyLoadImageModule,
    MatDialogModule 
  ],
  exports:[
    ProductDivComponent
  ]
})
export class ProductDivModule { }
