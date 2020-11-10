import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ShoppingHistoryRoutingModule } from './shopping-history-routing.module';
import { ShoppingHistoryComponent } from './shopping-history.component';


@NgModule({
  declarations: [ShoppingHistoryComponent],
  imports: [
    CommonModule,
    ShoppingHistoryRoutingModule
  ]
})
export class ShoppingHistoryModule { }
