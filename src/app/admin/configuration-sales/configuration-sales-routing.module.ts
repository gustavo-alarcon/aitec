import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdvisersComponent } from './advisers/advisers.component';
import { BrandsViewComponent } from './brands-view/brands-view.component';
import { CategoriesComponent } from './categories/categories.component';
import { ConfigurationSalesComponent } from './configuration-sales.component';
import { ContactSaleComponent } from './contact-sale/contact-sale.component';
import { CouponViewComponent } from './coupon-view/coupon-view.component';
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
        path: 'cupones',
        component: CouponViewComponent,
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
      },
      {
        path: 'contacto-ventas',
        component: ContactSaleComponent
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConfigurationSalesRoutingModule { }
