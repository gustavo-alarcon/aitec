import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';


import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { NgxPaginationModule } from 'ngx-pagination';
import {MatCardModule} from '@angular/material/card';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatTooltipModule} from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Ng2ImgMaxModule } from 'ng2-img-max';
import {LazyLoadImageModule} from 'ng-lazyload-image';
import { MatNativeDateModule } from '@angular/material/core';
import { GoogleMapsModule } from '@angular/google-maps';

import { WarehouseViewComponent } from './warehouse-view.component';
import { WarehouseViewMasterComponent } from './warehouse-view-master/warehouse-view-master.component';
import { WarehouseViewDetailComponent } from './warehouse-view-detail/warehouse-view-detail.component';
import { WarehouseViewRoutingModule } from './warehouse-view-routing.module'
import { WarehouseModule } from '../warehouse/warehouse.module';
import { WarehouseInventoryComponent } from '../warehouse/warehouse-inventory/warehouse-inventory.component';
import { WarehouseViewReferralGuideDialogComponent } from './warehouse-view-referral-guide-dialog/warehouse-view-referral-guide-dialog.component';




@NgModule({
  declarations: [
    WarehouseViewComponent, 
    WarehouseViewMasterComponent, 
    WarehouseViewDetailComponent,
    WarehouseViewReferralGuideDialogComponent
  ],
  imports: [
    CommonModule,
    WarehouseModule,
    WarehouseViewRoutingModule,
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
  ]
})
export class WarehouseViewModule { }
