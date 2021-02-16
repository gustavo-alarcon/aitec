import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTabsModule } from '@angular/material/tabs';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { Ng2ImgMaxModule } from 'ng2-img-max';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { MatStepperModule } from '@angular/material/stepper';
import { MatRadioModule } from '@angular/material/radio';

import { WarehouseRoutingModule } from './warehouse-routing.module';
import { WarehouseComponent } from './warehouse.component';
import { ListDialogComponent } from './list-dialog/list-dialog.component';
import { WarehouseListComponent } from './warehouse-list/warehouse-list.component';
import { WarehouseInventoryComponent } from './warehouse-inventory/warehouse-inventory.component';
import { WarehouseCreateEditComponent } from './warehouse-create-edit/warehouse-create-edit.component';
import { WarehouseProductsEntryComponent } from './warehouse-products-entry/warehouse-products-entry.component';


@NgModule({
  declarations: [
    WarehouseComponent,
    ListDialogComponent,
    WarehouseListComponent,
    WarehouseInventoryComponent,
    WarehouseCreateEditComponent,
    WarehouseProductsEntryComponent],
  imports: [
    CommonModule,
    WarehouseRoutingModule,
    MatMenuModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatSlideToggleModule,
    Ng2ImgMaxModule,
    MatDividerModule,
    MatDialogModule,
    MatProgressBarModule,
    MatSelectModule,
    MatDatepickerModule,
    MatChipsModule,
    MatTabsModule,
    MatTooltipModule,
    LazyLoadImageModule,
    MatCardModule,
    MatStepperModule,
    MatRadioModule
  ]
})
export class WarehouseModule { }
