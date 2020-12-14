import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainRoutingModule } from './main-routing.module';
import { MainComponent } from './main.component';

//material
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { RateDialogComponent } from './rate-dialog/rate-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LazyLoadImageModule } from 'ng-lazyload-image';

@NgModule({
  declarations: [MainComponent, RateDialogComponent],
  imports: [
    CommonModule,
    MainRoutingModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatDividerModule,
    MatAutocompleteModule,
    MatInputModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    LazyLoadImageModule
  ],
  entryComponents: [RateDialogComponent],
})
export class MainModule { }
