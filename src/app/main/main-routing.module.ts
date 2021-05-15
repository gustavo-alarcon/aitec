import { NgModule } from '@angular/core';
import { MainComponent } from './main.component';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('./landing/landing.module').then(mod => mod.LandingModule)
      },
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
        path: 'productos/:id/:cat',
        loadChildren: () => import('./store/store.module').then(mod => mod.StoreModule)
      },
      {
        path: 'productos/:id/:cat/:sub',
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
      },
      {
        path: 'mispedidos',
        loadChildren: () => import('./sales/sales.module').then(mod => mod.SalesModule)
      },
      {
        path: 'favoritos',
        loadChildren: () => import('./favorites/favorites.module').then(mod => mod.FavoritesModule)
      },
      {
        path: 'preguntas',
        loadChildren: () => import('./questions/questions.module').then(mod => mod.QuestionsModule)
      }
    ]
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainRoutingModule { }
