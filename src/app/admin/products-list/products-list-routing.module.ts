import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CreateEditProductComponent } from './create-edit-product/create-edit-product.component';
import { ProductsListComponent } from './products-list.component';


const routes: Routes = [
  
  {
    path: '',
    component: ProductsListComponent
  },
  {
    path: 'create',
    component: CreateEditProductComponent
  },
  {
    path: 'edit/:id',
    component: CreateEditProductComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductsListRoutingModule { }
