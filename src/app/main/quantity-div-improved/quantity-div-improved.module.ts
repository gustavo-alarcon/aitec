import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuantityDivImprovedComponent } from './quantity-div-improved.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
@NgModule({
  declarations: [
    QuantityDivImprovedComponent
  ],
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
    QuantityDivImprovedComponent
  ]
})
export class QuantityDivImprovedModule { }