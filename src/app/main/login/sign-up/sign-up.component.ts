import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { BehaviorSubject, from, Observable, of } from 'rxjs';
import { debounceTime, map, switchMap } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit {

  providerType:["email", "gmail", "facebok"]= ["email", "gmail", "facebok"];
  personalInfoType:["natural", "juridica"]

  registerLogin$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false) //true when email already exist, so you need to login

  
  providerForm: FormControl;
  emailForm: FormGroup;
  personalInfoForm: FormGroup;
  feedForm: FormControl;
  conditionForm: FormControl;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService
  ) { }

  ngOnInit(): void {
    this.providerForm = this.fb.control(null, Validators.required)
    this.emailForm = this.fb.group({
      //Falta chequear rellenado con email FALTAAAAAAA
      email: this.fb.control(
        {value: null}, [Validators.required, Validators.email]
      ),
      pass: this.fb.control(
        {value: null}, [Validators.required, Validators.email]
      ),
      repeatedPass: this.fb.control(
        {value: null}, [Validators.required, Validators.email]
      ),
    })
    this.personalInfoForm = this.fb.group({
      type: this.fb.control(
        {value: this.personalInfoType[0]}, [Validators.required]
      ),
      name: this.fb.control(
        {value: null}, Validators.required
      ),
      dni: this.fb.control(
        {value: null}, [Validators.required, Validators.maxLength(8)]
      ),
      phone: this.fb.control(
        {value: null}, [Validators.required]
      ),
      business: this.fb.control(
        {value: null}, Validators.required
      ),
      ruc: this.fb.control(
        {value: null}, Validators.required
      ),
      address: this.fb.control(
        {value: null}, Validators.required
      ),
    })
    this.feedForm = this.fb.control(
      {value: false}
    )
    this.conditionForm = this.fb.control(
      {value: false}, Validators.requiredTrue
    )
  }

  emailRepeatedValidator() {
    return (control: AbstractControl): Observable<ValidationErrors|null> => {
      const email = control.value;
      return of(email).pipe(
        debounceTime(500),
        switchMap(res => from(this.auth.emailMethod(res))),
        map(res => {
          control.parent.get('pass').enable()
          switch(res[0]) {
            case 'google.com':
              control.parent.get('pass').disable()
              return {googleLogin: true}
            case 'facebook.com':
              control.parent.get('pass').disable()
              return {facebookLogin: true}
            case 'email':
              control.parent.get('pass').disable()
              return {emailLogin: true}
            default: 
              return null
          }
        }
      ))
    }
  }

  samePassValidator() {
    return (control: AbstractControl): ValidationErrors|null => {
      let parent = control.parent;
      let pass: string = null;
      let repeatedPass: string = null;
      if(parent){
        pass = parent.get('pass').value;
        repeatedPass = parent.get('repeatedPass').value
        if(pass && repeatedPass){
          return {noRepeatedPass: true}
        }
      }
      return null
    }
  }

}
