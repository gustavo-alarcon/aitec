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
import { MatRadioModule } from '@angular/material/radio';
import { MatChipsModule } from '@angular/material/chips';
import { Ng2ImgMaxModule } from 'ng2-img-max';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { LazyLoadImageModule } from 'ng-lazyload-image';

import { WebRoutingModule } from './web-routing.module';
import { WebComponent } from './web.component';
import { BannerComponent } from './banner/banner.component';
import { CreateEditBannerComponent } from './create-edit-banner/create-edit-banner.component';
import { ContactComponent } from './contact/contact.component';
import { LandingComponent } from './landing/landing.component';
import { CreatEditTestimonyComponent } from './creat-edit-testimony/creat-edit-testimony.component';
import { NewsComponent } from './news/news.component';

@NgModule({
  declarations: [
    WebComponent,
    BannerComponent,
    CreateEditBannerComponent,
    ContactComponent,
    LandingComponent,
    CreatEditTestimonyComponent,
    NewsComponent
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
    GoogleMapsModule,
    MatRadioModule,
    MatChipsModule,
    Ng2ImgMaxModule,
    MatAutocompleteModule,
    DragDropModule,
    SlickCarouselModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    LazyLoadImageModule
  ],
})
export class WebModule { }
