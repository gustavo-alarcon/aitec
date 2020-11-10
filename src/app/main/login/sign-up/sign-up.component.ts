import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
    private auth: AuthService,
    private activatedRoute: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    let providerType = this.activatedRoute.snapshot.queryParams["providerType"];
    let email = this.activatedRoute.snapshot.queryParams["email"];
    this.initForm(providerType, email)
  }
  

  initForm(providerType: string, email: string){
    //Por definir providerForm
    this.providerForm = this.fb.control(
      providerType ? providerType : this.providerType[0], 
      Validators.required)
    this.emailForm = this.fb.group({
      //Falta chequear rellenado con email FALTAAAAAAA
      email: this.fb.control(
        email ? email : "", [Validators.required, Validators.email], this.emailRepeatedValidator()
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
        {value: null, disable: true}, Validators.required
      ),
      ruc: this.fb.control(
        {value: null, disable: true}, Validators.required
      ),
      address: this.fb.control(
        {value: null, disable: true}, Validators.required
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
      const parent = control.parent;
      const providerTypeForm = this.providerForm.value;

      if(!parent) return null

      return of(email).pipe(
        debounceTime(500),
        switchMap(res => (this.auth.emailMethod(res))),
        switchMap(res => {
          parent.get('pass').disable()
          parent.get('repeatedPass').disable()

          //El metodo de email es google
          switch(res[0]) {
            case 'google.com':
              //El formulario no está seleccionado con google
              if(providerTypeForm != 'google'){
                return of({wrongProvider: 'google'})
              }
              //El formulario esta seleccionado con google
              return this.auth.getUserByEmail(email).pipe(
                map(user => {
                  //Usuario registrado en DB
                  if(user){
                    return {repeatedUser: true}
                  } else {
                  //Usuario no registrado en db
                    return null
                  }
                })
              )
            //El método de email es facebook
            case 'facebook.com':
              //El formulario no está seleccionado con facebook
              if(providerTypeForm != 'facebook'){
                return of({wrongProvider: 'facebook'})
              }
              //El formulario esta seleccionado con facebook
              return this.auth.getUserByEmail(email).pipe(
                map(user => {
                  //Usuario registrado en DB
                  if(user){
                    return {repeatedUser: true}
                  } else {
                  //Usuario no registrado en db
                    return null
                  }
                })
              )
            //El método de email es email
            case 'email':
              //El formulario no está seleccionado con email
              if(providerTypeForm != 'email'){
                return of({wrongProvider: 'email'})
              }
              //El formulario esta seleccionado con email
              return this.auth.getUserByEmail(email).pipe(
                map(user => {
                  //Usuario registrado en DB
                  if(user){
                    return {repeatedUser: true}
                  } else {
                    parent.get('pass').enable()
                    parent.get('repeatedPass').enable()                    //Usuario no registrado en db
                    return null
                  }
                })
              )
            default: 
              //usuario no registrado. Continuar
              parent.get('pass').enable()
              parent.get('repeatedPass').enable() 
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
          return pass == repeatedPass ? null:{noRepeatedPass: true}
        }
      }
      return null
    }
  }

}
