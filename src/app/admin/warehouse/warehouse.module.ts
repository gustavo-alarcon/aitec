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
import { ReactiveFormsModule,FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { Ng2ImgMaxModule } from 'ng2-img-max';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { MatStepperModule } from '@angular/material/stepper';
import { MatRadioModule } from '@angular/material/radio';
import { MatNativeDateModule } from '@angular/material/core';
import { NgxPrintModule } from 'ngx-print';


import { WarehouseRoutingModule } from './warehouse-routing.module';
import { WarehouseComponent } from './warehouse.component';
import { ListDialogComponent } from './list-dialog/list-dialog.component';
import { WarehouseListComponent } from './warehouse-list/warehouse-list.component';
import { WarehouseInventoryComponent } from './warehouse-inventory/warehouse-inventory.component';
import { WarehouseCreateEditComponent } from './warehouse-create-edit/warehouse-create-edit.component';
import { WarehouseProductsEntryComponent } from './warehouse-products-entry/warehouse-products-entry.component';
import { ReferralGuideDialogComponent } from './referral-guide-dialog/referral-guide-dialog.component';
import { SelectSeriesComponent } from './select-series/select-series.component';
import { WarehouseProductsTakeOutComponent } from './warehouse-products-take-out/warehouse-products-take-out.component';
import { SharedModule } from 'src/app/core/shared/shared.module';
import { ListSeriesComponent } from './list-series/list-series.component';
import { MatListModule } from '@angular/material/list';
import { KardexDialogComponent } from './kardex-dialog/kardex-dialog.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DatePipe } from '@angular/common';
import { MovementsComponent } from './movements/movements.component';
import { MovementsDetailDialogComponent } from './movements-detail-dialog/movements-detail-dialog.component';
import { TakeOutConfirmDialogComponent } from './take-out-confirm-dialog/take-out-confirm-dialog.component';


@NgModule({
  declarations: [
    WarehouseComponent,
    ListDialogComponent,
    WarehouseListComponent,
    WarehouseInventoryComponent,
    WarehouseCreateEditComponent,
    WarehouseProductsEntryComponent,
    ReferralGuideDialogComponent,
    SelectSeriesComponent,
    WarehouseProductsTakeOutComponent,
    ListSeriesComponent,
    KardexDialogComponent,
    MovementsComponent,
    MovementsDetailDialogComponent,
    TakeOutConfirmDialogComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    WarehouseRoutingModule,
    MatMenuModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatListModule,
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
    MatCheckboxModule,
    MatCardModule,
    MatStepperModule,
    MatRadioModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    FormsModule,
    NgxPrintModule, 
  ],
  exports: [
    ReferralGuideDialogComponent,
    MatFormFieldModule,
    CommonModule
  ],
  providers: [DatePipe],
})
export class WarehouseModule { }
