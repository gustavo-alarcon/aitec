import { NgModule } from '@angular/core';
import { CommonModule, DatePipe  } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatBadgeModule } from '@angular/material/badge';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';

import { AdminComponent } from './admin.component';
import { AdminRoutingModule } from './admin-routing-module';
import { DeleteConfiDialogComponent } from './delete-confi-dialog/delete-confi-dialog.component';

@NgModule({
  declarations: [
    AdminComponent,
    ConfirmationDialogComponent,
    DeleteConfiDialogComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    MatIconModule,
    MatToolbarModule,
    MatMenuModule,
    MatSidenavModule,
    MatProgressBarModule,
    MatButtonModule,
    MatDividerModule,
    MatDialogModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    FormsModule,
    MatCheckboxModule,
    MatInputModule,
    MatBadgeModule,
    MatAutocompleteModule
  ],
  providers: [
    ConfirmationDialogComponent,
    DatePipe
  ]
})
export class AdminModule { }
