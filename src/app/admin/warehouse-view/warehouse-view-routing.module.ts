import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WarehouseViewComponent } from './warehouse-view.component';

const routes: Routes = [
  {
    path: '',
    component: WarehouseViewComponent,

  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class WarehouseViewRoutingModule { }
