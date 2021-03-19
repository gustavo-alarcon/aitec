import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SalesComponent } from './sales.component';
import { SalesRoutingModule } from './sales-routing.module';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { SalesMasterComponent } from './sales-master/sales-master.component';
import { SalesDetailComponent } from './sales-detail/sales-detail.component';
import { MatRippleModule } from '@angular/material/core';
import { NgxPaginationModule } from 'ngx-pagination';
import {MatCardModule} from '@angular/material/card';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatTooltipModule} from '@angular/material/tooltip';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { SalesPhotoDialogComponent } from './sales-photo-dialog/sales-photo-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Ng2ImgMaxModule } from 'ng2-img-max';
import { SalesAddressDialogComponent } from './sales-address-dialog/sales-address-dialog.component';
import {LazyLoadImageModule} from 'ng-lazyload-image';
import { MatNativeDateModule } from '@angular/material/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { SalePricePipe } from './sale-price.pipe';



@NgModule({
  declarations: [
    SalesComponent,
    SalesMasterComponent,
    SalesDetailComponent,
    SalesPhotoDialogComponent,
    SalesAddressDialogComponent,
    SalePricePipe
  ],
  imports: [
    CommonModule,
    SalesRoutingModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDividerModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatRippleModule,
    NgxPaginationModule,
    MatCardModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatDialogModule,
    MatProgressBarModule,
    Ng2ImgMaxModule,
    LazyLoadImageModule,
    MatNativeDateModule,
    GoogleMapsModule
  ],
  providers: [
    DatePipe
  ],
  entryComponents: [
    ConfirmationDialogComponent,
    SalesPhotoDialogComponent,
    SalesAddressDialogComponent
  ]
})
export class SalesModule { }
