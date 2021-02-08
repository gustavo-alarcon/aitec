import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WarehouseInventoryComponent } from './warehouse-inventory/warehouse-inventory.component';
import { WarehouseListComponent } from './warehouse-list/warehouse-list.component';

const routes: Routes = [
  {
    path: 'list',
    component: WarehouseListComponent
  },
  {
    path: 'inventory',
    component: WarehouseInventoryComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WarehouseRoutingModule { }
