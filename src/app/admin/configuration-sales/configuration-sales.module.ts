import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatExpansionModule } from '@angular/material/expansion';
import { Ng2ImgMaxModule } from 'ng2-img-max';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';

import { ConfigurationSalesRoutingModule } from './configuration-sales-routing.module';
import { ConfigurationSalesComponent } from './configuration-sales.component';
import { CategoriesComponent } from './categories/categories.component';
import { StoreDialogComponent } from './dialogs/store-dialog/store-dialog.component';
import { BrandComponent } from './dialogs/brand/brand.component';
import { BrandsViewComponent } from './brands-view/brands-view.component';
import { CuponDialogComponent } from './dialogs/cupon-dialog/cupon-dialog.component';
import { AsesoresDialogComponent } from './dialogs/asesores-dialog/asesores-dialog.component';
import { PaymentMethodDialogComponent } from './dialogs/payment-method-dialog/payment-method-dialog.component';
import { StoresComponent } from './stores/stores.component';
import { AdvisersComponent } from './advisers/advisers.component';
import { PaymentViewComponent } from './payment-view/payment-view.component';
import { CouponViewComponent } from './coupon-view/coupon-view.component';
import { CategoryDialogComponent } from './dialogs/category-dialog/category-dialog.component';
import { ContactSaleComponent } from './contact-sale/contact-sale.component';
import { CreateCategoryGeneralComponent } from './dialogs/create-category-general/create-category-general.component';

@NgModule({
  declarations: [
    ConfigurationSalesComponent,
    CategoriesComponent,
    StoreDialogComponent,
    BrandComponent,
    BrandsViewComponent,
    CuponDialogComponent,
    AsesoresDialogComponent,
    PaymentMethodDialogComponent,
    StoresComponent,
    AdvisersComponent,
    PaymentViewComponent,
    CouponViewComponent,
    CategoryDialogComponent,
    ContactSaleComponent,
    CreateCategoryGeneralComponent
  ],
  imports: [
    CommonModule,
    ConfigurationSalesRoutingModule,
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
    MatAutocompleteModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatExpansionModule,
    Ng2ImgMaxModule,
    LazyLoadImageModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    MatTooltipModule,
    MatCardModule
  ],
  providers: [
    DatePipe
  ],
})
export class ConfigurationSalesModule { }
