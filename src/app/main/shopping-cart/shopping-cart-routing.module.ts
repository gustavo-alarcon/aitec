import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ShoppingCartComponent } from './shopping-cart.component';
import { PaymentSuccessComponent } from './payment-success/payment-success.component';
import { PaymentErrorComponent } from './payment-error/payment-error.component';

const routes: Routes = [
  {
    path: '',
    component: ShoppingCartComponent,
    children: [
      /* {
        path: 'payment',
        loadChildren: () => import('./payment/payment.module').then(mod => mod.PaymentModule)
      }, */
      {
        path: 'success',
        loadChildren: () => import('./payment-success/payment-success.module').then(mod => mod.PaymentSuccessModule)
      },
      {
        path: 'error',
        loadChildren: () => import('./payment-error/payment-error.component').then(mod => mod.PaymentErrorComponent)
      },
    ]
  },
 /*  {
    path: 'success',
    component: PaymentSuccessComponent
  },
  {
    path: 'error',
    component: PaymentErrorComponent
  } */
]
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ShoppingCartRoutingModule { }
