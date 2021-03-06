import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login.component';
import { LoginRoutingModule } from './login-routing.module';
import { SignInComponent } from './sign-in/sign-in.component';
import { SignUpComponent } from './sign-up/sign-up.component';

//Material
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import {MatRadioModule} from '@angular/material/radio';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { TermsComponent } from '../terms/terms.component';
import { RecommendationComponent } from './recommendation/recommendation.component';
import { LazyLoadImageModule } from 'ng-lazyload-image';


@NgModule({
  declarations: [
    LoginComponent,
    SignInComponent,
    SignUpComponent,
    TermsComponent,
    RecommendationComponent
  ],
  imports: [
    CommonModule,
    LoginRoutingModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatDividerModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    FormsModule,
    MatInputModule,
    MatRadioModule,
    MatCheckboxModule,
    MatDialogModule,
    MatDividerModule,
    LazyLoadImageModule,

  ], 
  entryComponents: [
    TermsComponent
  ]
})
export class LoginModule { }
