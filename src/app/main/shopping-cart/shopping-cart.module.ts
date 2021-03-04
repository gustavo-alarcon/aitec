import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRadioModule } from '@angular/material/radio';
import { GoogleMapsModule } from '@angular/google-maps';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatListModule } from '@angular/material/list';
import { Ng2ImgMaxModule } from 'ng2-img-max';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NgxPaginationModule } from 'ngx-pagination';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';

import { ShoppingCartRoutingModule } from './shopping-cart-routing.module';
import { ShoppingCartComponent } from './shopping-cart.component';
import { ShoppingListComponent } from './shopping-list/shopping-list.component';
import { QuantityDivModule } from '../quantity-div/quantity-div.module';
import { SaleDialogComponent } from './sale-dialog/sale-dialog.component';
import { ShoppingListMobileComponent } from './shopping-list-mobile/shopping-list-mobile.component';
import { LocationDialogComponent } from './location-dialog/location-dialog.component';
import { PaymentComponent } from './payment/payment.component';

import { HttpClientModule } from '@angular/common/http';
import { PaymentErrorComponent } from './payment-error/payment-error.component';

@NgModule({
  declarations: [
    ShoppingCartComponent,
    //ShoppingListComponent,
    SaleDialogComponent,
    ShoppingListMobileComponent,
    LocationDialogComponent,
    PaymentComponent,
    PaymentErrorComponent,
  ],
  imports: [
    CommonModule,
    ShoppingCartRoutingModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatDividerModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatCardModule,
    MatExpansionModule,
    ReactiveFormsModule,
    FormsModule,
    MatRadioModule,
    GoogleMapsModule,
    MatAutocompleteModule,
    MatListModule,
    Ng2ImgMaxModule,
    MatDatepickerModule,
    QuantityDivModule,
    LazyLoadImageModule,
    MatProgressSpinnerModule,
    NgxPaginationModule,
    MatStepperModule,
    HttpClientModule
  ],
})
export class ShoppingCartModule { }
