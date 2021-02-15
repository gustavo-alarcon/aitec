import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ShoppingCartComponent } from './shopping-cart.component';
import { PaymentSuccessComponent } from './payment-success/payment-success.component';
import { PaymentErrorComponent } from './payment-error/payment-error.component';

const routes: Routes = [
  {
    path: '',
    component: ShoppingCartComponent,
    /* children: [
      {
        path: 'payment',
        loadChildren: () => import('./payment/payment.module').then(mod => mod.PaymentModule)
      },
    ] */
  },
  {
    path: 'success',
    component: PaymentSuccessComponent
  },
  {
    path: 'error',
    component: PaymentErrorComponent
  }
]
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ShoppingCartRoutingModule { }
