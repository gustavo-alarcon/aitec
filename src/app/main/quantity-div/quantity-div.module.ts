import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuantityDivComponent } from './quantity-div.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
@NgModule({
  declarations: [QuantityDivComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSnackBarModule,
    FormsModule
  ],
  exports:[
    QuantityDivComponent
  ]
})
export class QuantityDivModule { }