import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, from, Observable, of } from 'rxjs';
import { debounceTime, map, startWith, switchMap, tap } from 'rxjs/operators';
import { User } from 'src/app/core/models/user.model';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit {
  userRedirect$: Observable<User>;

  providerType:["email", "google", "facebook"]= ["email", "google", "facebook"];
  personalInfoType:["natural", "juridica"] = ["natural", "juridica"]

  providerTypeParam: string = null;
  emailParam: string = null;

  registerLogin$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false) //true when email already exist, so you need to login
  providerType$: Observable<boolean>;
  personalInfoType$: Observable<boolean>;

  hidePass: boolean = true;
  hideRepeatedPass: boolean = true;


  
  providerForm: FormControl;
  emailForm: FormGroup;
  personalInfoForm: FormGroup;
  feedForm: FormControl;
  conditionForm: FormControl;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private activatedRoute: ActivatedRoute,
    private snackbar: MatSnackBar,
    public router: Router
  ) { }

  ngOnInit(): void {
    this.userRedirect$ = this.auth.user$.pipe(
      debounceTime(500),
      tap(user => {
      if(user){
        this.snackbar.open("Bienvenido", "Aceptar")
        this.router.navigateByUrl('/main')
      }
    }))

    this.providerTypeParam = 
      this.activatedRoute.snapshot.queryParams["providerType"] == "google.com" ? "google" :
      this.activatedRoute.snapshot.queryParams["providerType"] == "facebook.com" ? "facebook":null;
    this.emailParam = this.activatedRoute.snapshot.queryParams["email"];
    console.log(this.providerTypeParam,this.emailParam);
    this.initForms(this.providerTypeParam, this.emailParam);
    this.initObservables()
  }
  deb(){
    console.log(this.providerForm)
    console.log(this.emailForm)
    console.log(this.personalInfoForm)
  }
  
  initForms(providerType: string, email: string){
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
        {value: null, disabled: (providerType == this.providerType[1] ||
          providerType == this.providerType[2])
        }, [Validators.required, this.samePassValidator()]
      ),
      repeatedPass: this.fb.control(
        {value: null, disabled: (providerType == this.providerType[1] ||
          providerType == this.providerType[2])
        }, [Validators.required, this.samePassValidator()]
      ),
    })
    this.personalInfoForm = this.fb.group({
      type: this.fb.control(
        this.personalInfoType[0], [Validators.required]
      ),
      name: this.fb.control(
        null, Validators.required
      ),
      lastName: this.fb.control(
        null, Validators.required
      ),
      dni: this.fb.control(
        null, [Validators.required, Validators.maxLength(8), Validators.minLength(8)]
      ),
      phone: this.fb.control(
        null, [Validators.required]
      ),
      business: this.fb.control(
        {value: null, disabled: true}, Validators.required
      ),
      ruc: this.fb.control(
        {value: null, disabled: true}, Validators.required
      ),
      address: this.fb.control(
        {value: null, disabled: true}, Validators.required
      ),
    })
    this.feedForm = this.fb.control(
      false
    )
    this.conditionForm = this.fb.control(
      false, Validators.requiredTrue
    )
  }

  initObservables(){
    this.providerType$ = this.providerForm.valueChanges.pipe(
      map((res: "email"| "google"| "facebook") => {
        this.emailForm.get("email").reset("");
        if(res == "google" || res =="facebook"){
          this.emailForm.get("pass").disable()
          this.emailForm.get("repeatedPass").disable()
          return false
        } else {
          this.emailForm.get("pass").enable()
          this.emailForm.get("repeatedPass").enable()
          return true
        }
      }),
      startWith(this.providerForm.value == "email")
    );

    this.personalInfoType$ = this.personalInfoForm.get("type").valueChanges.pipe(
      map((res: "natural"| "juridica") => {
        if(res == "natural"){
          this.personalInfoForm.get("business").disable()
          this.personalInfoForm.get("ruc").disable()
          this.personalInfoForm.get("address").disable()
          return false
        } else {
          this.personalInfoForm.get("business").enable()
          this.personalInfoForm.get("ruc").enable()
          this.personalInfoForm.get("address").enable()
          return true
        }
      })
    )
  }

  registerUser(){
    this.emailForm.markAsPending();
    let user = {
      email: this.emailForm.get("email").value,
      ...this.personalInfoForm.value,
      feed: this.feedForm.value,
    };

    this.auth.registerUser(user, this.emailForm.get("pass").enabled ? 
      this.emailForm.get("pass").value:null).subscribe(
        res => {
          this.snackbar.open("Registro exitoso! Por favor, inicie sesión.", "Aceptar");
          this.router.navigateByUrl("/main/login/signIn")
        },
        err => {
          this.snackbar.open("Ocurrió un error. Vuelva a intentarlo.", "Aceptar");
          console.log(err);
        }
      );
  }

  signInProvider(type: "facebook"|"google") {
    this.auth.signIn(type)
    .catch(error => {
      this.snackbar.open('Parece que hubo un error ...', 'Cerrar');
      console.log(error);
    });;
  }

  emailRepeatedValidator() {
    return (control: AbstractControl): 
      Observable<{wrongProvider: string}|
                  {repeatedUser: boolean }|null> => {
      const email = control.value;
      const parent = control.parent;
      const providerTypeForm = this.providerForm.value;

      if(!parent) return of(null)

      return of(email).pipe(
        debounceTime(500),
        switchMap(res => (this.auth.emailMethod(res))),
        switchMap(res => {
          parent.get('pass').disable()
          parent.get('repeatedPass').disable()

          console.log(res[0])
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
                    if(Object.keys(user).length != 2){
                      return {repeatedUser: true}
                    }
                  } 
                  //Usuario no registrado en db
                  return null
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
                    if(Object.keys(user).length != 2){
                      return {repeatedUser: true}
                    }
                  } 
                  //Usuario no registrado en db
                  return null
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
                    if(Object.keys(user).length != 2){
                      return {repeatedUser: true}
                    }
                  } 
                  //Usuario no registrado en db
                  return null
                })
              )
            default: 
              console.log("no registrado")
              //usuario no registrado. Continuar
              parent.get('pass').enable()
              parent.get('repeatedPass').enable() 
              return of(null)
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
