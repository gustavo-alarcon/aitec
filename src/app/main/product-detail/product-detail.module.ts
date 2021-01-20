import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProductDivModule } from '../product-div/product-div.module';
import { GalleryModule } from 'ng-gallery';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { ProductDetailRoutingModule } from './product-detail-routing.module';
import { ProductDetailComponent } from './product-detail.component';
import { QuantityDivModule } from '../quantity-div/quantity-div.module';
import { QuestionsComponent } from './questions/questions.component';
import { WebViewComponent } from './web-view/web-view.component';
import { MatSelectModule } from '@angular/material/select';
import { LayoutModule } from '@angular/cdk/layout';
import { NoLoginDialogComponent } from './no-login-dialog/no-login-dialog.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductCategoryComponent } from './product-category/product-category.component';

@NgModule({
  declarations: [
    ProductDetailComponent,
    QuestionsComponent,
    WebViewComponent,
    NoLoginDialogComponent,
    ProductCategoryComponent],
  imports: [
    CommonModule,
    ProductDetailRoutingModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDividerModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    MatCardModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    ProductDivModule,
    GalleryModule,
    SlickCarouselModule,
    QuantityDivModule,
    LazyLoadImageModule,
    MatSelectModule,
    LayoutModule,
    MatProgressSpinnerModule
  ]
})
export class ProductDetailModule { }
