import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './admin.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      
      {
        path: 'web',
        loadChildren: () => import('./web/web.module').then(mod => mod.WebModule)
      },
      /*
      {
        path: 'login',
        loadChildren: () => import('./login/login.module').then(mod => mod.LoginModule),
        //canActivate: [AuthGuard]
      },
      {
        path: 'productos',
        loadChildren: () => import('./store/store.module').then(mod => mod.StoreModule)
      },
      {
        path: 'productos/:id',
        loadChildren: () => import('./store/store.module').then(mod => mod.StoreModule)
      },
      {
        path: 'producto/:id',
        loadChildren: () => import('./product-detail/product-detail.module').then(mod => mod.ProductDetailModule)
      },
      {
        path: 'contactanos',
        loadChildren: () => import('./contact/contact.module').then(mod => mod.ContactModule)
      },
      {
        path: 'carrito',
        loadChildren: () => import('./shopping-cart/shopping-cart.module').then(mod => mod.ShoppingCartModule)
      },*/
    ]
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
