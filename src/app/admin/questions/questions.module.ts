import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatFormFieldModule } from '@angular/material/form-field';
import {MatDatepickerModule } from '@angular/material/datepicker';
import {MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';




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
    MatExpansionModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class QuestionsModule { }
