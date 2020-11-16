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
import { ShoppingCartRoutingModule } from './shopping-cart-routing.module';
import { ShoppingCartComponent } from './shopping-cart.component';
import { ShoppingListComponent } from './shopping-list/shopping-list.component';
import { DeliveryComponent } from './delivery/delivery.component';
import { PaymentMethodComponent } from './payment-method/payment-method.component';
import { Ng2ImgMaxModule } from 'ng2-img-max';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { QuantityDivModule } from '../quantity-div/quantity-div.module';
@NgModule({
  declarations: [
    ShoppingCartComponent,
    ShoppingListComponent,
    DeliveryComponent,
    PaymentMethodComponent,
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
  ],
})
export class ShoppingCartModule {}
