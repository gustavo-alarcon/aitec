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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NgxSummernoteModule } from 'ngx-summernote';
import { HttpClientModule } from '@angular/common/http';

import { ProductsListRoutingModule } from './products-list-routing.module';
import { ProductsListComponent } from './products-list.component';
import { CreateEditProductComponent } from './create-edit-product/create-edit-product.component';
import { ProductEditPromoComponent } from './product-edit-promo/product-edit-promo.component';
import { DeleteProductComponent } from './delete-product/delete-product.component';
import { SharedModule } from 'src/app/core/shared/shared.module';


@NgModule({
  declarations: [ProductsListComponent, CreateEditProductComponent, ProductEditPromoComponent, DeleteProductComponent],
  imports: [
    CommonModule,
    SharedModule,
    ProductsListRoutingModule,
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
    MatRadioModule,
    MatCheckboxModule,
    NgxSummernoteModule,
    HttpClientModule
  ]
})
export class ProductsListModule { }
