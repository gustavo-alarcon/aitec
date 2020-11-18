import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { GoogleMapsModule } from '@angular/google-maps';

import { WebRoutingModule } from './web-routing.module';
import { WebComponent } from './web.component';
import { BannerComponent } from './banner/banner.component';
import { CreateEditBannerComponent } from './create-edit-banner/create-edit-banner.component';
import { ContactComponent } from './contact/contact.component';
import { LandingComponent } from './landing/landing.component';

@NgModule({
  declarations: [
    WebComponent,
    BannerComponent,
    CreateEditBannerComponent,
    ContactComponent,
    LandingComponent,
  ],
  imports: [
    CommonModule,
    WebRoutingModule,
    MatIconModule,
    MatToolbarModule,
    MatMenuModule,
    MatSidenavModule,
    MatProgressBarModule,
    MatButtonModule,
    MatDividerModule,
    MatDialogModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    FormsModule,
    MatCheckboxModule,
    MatInputModule,
    MatBadgeModule,
    MatTabsModule,
    GoogleMapsModule
  ],
})
export class WebModule {}
