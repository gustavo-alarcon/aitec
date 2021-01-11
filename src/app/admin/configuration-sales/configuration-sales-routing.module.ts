import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdvisersComponent } from './advisers/advisers.component';
import { BrandsViewComponent } from './brands-view/brands-view.component';
import { CategoriesComponent } from './categories/categories.component';
import { ConfigurationSalesComponent } from './configuration-sales.component';
import { DeliveryStoresComponent } from './delivery-stores/delivery-stores.component';
import { GeneralComponent } from './general/general.component';
import { PaymentViewComponent } from './payment-view/payment-view.component';
import { StoresComponent } from './stores/stores.component';

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
      },
      {
        path: 'marcas',
        component: BrandsViewComponent,
      },
      {
        path: 'stores',
        component: StoresComponent,
      },
      {
        path: 'payments',
        component: PaymentViewComponent,
      },
      {
        path: 'asesores',
        component: AdvisersComponent
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConfigurationSalesRoutingModule { }
