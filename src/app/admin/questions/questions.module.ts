import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';



import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatBadgeModule } from '@angular/material/badge';
import { MatAutocompleteModule } from '@angular/material/autocomplete';



import { QuestionsRoutingModule } from './questions-routing.module';
import { AnswerComponent } from './answer/answer.component';


@NgModule({
  declarations: [AnswerComponent],
  imports: [
    CommonModule,
    QuestionsRoutingModule,
    MatIconModule,
    MatDividerModule,
    MatMenuModule,
    MatPaginatorModule,
    MatTableModule,

   /*  MatSidenavModule,
    MatProgressBarModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatDialogModule,
    MatButtonModule,
    ReactiveFormsModule, 
    FormsModule ,
    MatSlideToggleModule ,
    MatCheckboxModule ,
    MatInputModule,
    MatBadgeModule,
    MatAutocompleteModule */

  ]
})
export class QuestionsModule { }
