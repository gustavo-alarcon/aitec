import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ContactComponent } from './contact/contact.component';
import { BannerComponent } from './banner/banner.component';
import { WebComponent } from './web.component';
import { LandingComponent } from './landing/landing.component';

const routes: Routes = [
  {
    path: '',
    component: WebComponent,
    children: [
      {
        path: 'banners',
        component: BannerComponent,
      },
      {
        path: 'contacto',
        component: ContactComponent,
      },
      {
        path: 'landing',
        component: LandingComponent,
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WebRoutingModule {}
