import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuantityDivComponent } from './quantity-div.component';



@NgModule({
  declarations: [QuantityDivComponent],
  imports: [
    CommonModule
  ],
  exports:[
    QuantityDivComponent
  ]
})
export class QuantityDivModule { }
