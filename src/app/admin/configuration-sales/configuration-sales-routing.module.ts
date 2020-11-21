import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CategoriesComponent } from './categories/categories.component';
import { ConfigurationSalesComponent } from './configuration-sales.component';
import { DeliveryStoresComponent } from './delivery-stores/delivery-stores.component';
import { GeneralComponent } from './general/general.component';

const routes: Routes = [
  {
    path: '',
    component: ConfigurationSalesComponent,
    children: [
      {
        path: 'categorias',
        component: CategoriesComponent,
      },
      {
        path: 'delivery',
        component: DeliveryStoresComponent,
      },
      {
        path: 'general',
        component: GeneralComponent,
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConfigurationSalesRoutingModule { }
