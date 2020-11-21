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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';

import { ConfigurationSalesRoutingModule } from './configuration-sales-routing.module';
import { ConfigurationSalesComponent } from './configuration-sales.component';
import { CategoriesComponent } from './categories/categories.component';
import { DeliveryStoresComponent } from './delivery-stores/delivery-stores.component';
import { DepartmentDialogComponent } from './dialogs/department-dialog/department-dialog.component';
import { ProvinceDialogComponent } from './dialogs/province-dialog/province-dialog.component';
import { DeliveryDialogComponent } from './dialogs/delivery-dialog/delivery-dialog.component';
import { StoreDialogComponent } from './dialogs/store-dialog/store-dialog.component';
import { BrandComponent } from './dialogs/brand/brand.component';
import { GeneralComponent } from './general/general.component';


@NgModule({
  declarations: [ConfigurationSalesComponent, CategoriesComponent, DeliveryStoresComponent, DepartmentDialogComponent, ProvinceDialogComponent, DeliveryDialogComponent, StoreDialogComponent, BrandComponent, GeneralComponent],
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
    MatPaginatorModule
  ]
})
export class ConfigurationSalesModule { }
