import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, from, Observable, of } from 'rxjs';
import { debounceTime, map, startWith, switchMap, tap } from 'rxjs/operators';
import { User } from 'src/app/core/models/user.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { TermsComponent } from '../../terms/terms.component';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit {
  getUser$: Observable<{ authUser: firebase.default.User, dbUser: User, type: "registered" | "unregistered" | "unexistent" }>;

  providerType: ["email", "google", "facebook"] = ["email", "google", "facebook"];
  personalInfoType: ["natural", "jurídica"] = ["natural", "jurídica"]

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
    private snackbar: MatSnackBar,
    public router: Router,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.initObservables()
  }


  initForms() {
    //Por definir providerForm
    this.providerForm = this.fb.control(
      this.providerType[0],
      Validators.required)
    this.emailForm = this.fb.group({
      //Falta chequear rellenado con email FALTAAAAAAA
      email: this.fb.control(
        "", [Validators.required, Validators.email], this.emailRepeatedValidator()
      ),
      pass: this.fb.control(
        null, [Validators.required, this.samePassValidator()]
      ),
      repeatedPass: this.fb.control(
        null, [Validators.required, this.samePassValidator()]
      ),
    })
    this.personalInfoForm = this.fb.group({
      type: this.fb.control(
        this.personalInfoType[0], [Validators.required]
      ),
      //Person and Business
      name: this.fb.control(
        null, Validators.required
      ),
      phone: this.fb.control(
        null, [Validators.required]
      ),
      //Person
      lastName: this.fb.control(
        null, Validators.required
      ),
      dni: this.fb.control(
        null, [Validators.required, Validators.maxLength(8), Validators.minLength(8)]
      ),
      //Business
      ruc: this.fb.control(
        { value: null, disabled: true }, Validators.required
      ),
      address: this.fb.control(
        { value: null, disabled: true }, Validators.required
      ),
      contactPerson: this.fb.control(
        { value: null, disabled: true }, Validators.required
      ),

    })
    this.feedForm = this.fb.control(
      false
    )
    this.conditionForm = this.fb.control(
      false, Validators.requiredTrue
    )
  }

  termsAndConditions() {
    this.dialog.open(TermsComponent)
  }

  initObservables() {
    this.providerType$ = this.providerForm.valueChanges.pipe(
      startWith(this.providerForm.value),
      map((res: "email" | "google" | "facebook") => {
        if (res == "google" || res == "facebook") {
          this.emailForm.get("pass").disable()
          this.emailForm.get("repeatedPass").disable()
          return false
        } else {
          this.emailForm.get("pass").enable()
          this.emailForm.get("repeatedPass").enable()
          return true
        }
      })
    );

    this.personalInfoType$ = this.personalInfoForm.get("type").valueChanges.pipe(
      startWith(this.personalInfoForm.get("type").value),
      map((res: "natural" | "juridica") => {
        if (res == "natural") {
          this.personalInfoForm.get("lastName").enable()
          this.personalInfoForm.get("dni").enable()

          this.personalInfoForm.get("ruc").disable()
          this.personalInfoForm.get("address").disable()
          this.personalInfoForm.get("contactPerson").disable()
          return false
        } else {
          this.personalInfoForm.get("lastName").disable()
          this.personalInfoForm.get("dni").disable()

          this.personalInfoForm.get("ruc").enable()
          this.personalInfoForm.get("address").enable()
          this.personalInfoForm.get("contactPerson").enable()
          return true
        }
      })
    )

    this.getUser$ = this.auth.getUser$.pipe(
      tap(userData => {
        if (userData) {
          switch (userData.type) {
            case "registered":
              this.snackbar.open("Bienvenido...", "Aceptar")
              this.router.navigateByUrl('/main')
              break;
            case "unregistered":
              switch (userData.authUser.providerData[0].providerId) {
                case 'google.com':
                  this.providerForm.setValue(this.providerType[1])
                  break;
                case 'facebook.com':
                  this.providerForm.setValue(this.providerType[2])
                  break;
              }
              this.emailForm.get("email").setValue(userData.authUser.email)
              this.providerForm.disable()
              break;
            case "unexistent":
              break;
          }
        }
      }))
  }

  registerUser(userData: { authUser: firebase.default.User, dbUser: User, type: "registered" | "unregistered" | "unexistent" }) {
    this.emailForm.markAsPending();
    let user = {
      email: this.emailForm.get("email").value,
      personData: this.personalInfoForm.value,
      feed: this.feedForm.value,
    };

    this.auth.registerUser(userData.authUser, user, this.emailForm.get("pass").enabled ?
      this.emailForm.get("pass").value : null).catch(
        err => {
          this.snackbar.open("Ocurrió un error. Vuelva a intentarlo.", "Aceptar");
          console.log(err);
        }
      );
  }

  signInProvider(type: "facebook" | "google") {
    this.auth.signIn(type)
      .catch(error => {
        this.snackbar.open('Parece que hubo un error ...', 'Cerrar');
        console.log(error);
      });;
  }

  emailRepeatedValidator() {
    return (control: AbstractControl):
      Observable<{ wrongProvider: string } |
      { repeatedUser: boolean } | null> => {
      const email = control.value;
      const parent = control.parent;
      const providerTypeForm = this.providerForm.value;

      if (!parent) return of(null)

      return of(email).pipe(
        debounceTime(500),
        switchMap(res => (this.auth.emailMethod(res))),
        switchMap(res => {
          parent.get('pass').disable()
          parent.get('repeatedPass').disable()

          console.log(res[0])
          //El metodo de email es google
          switch (res[0]) {
            case 'google.com':
              //El formulario no está seleccionado con google
              if (providerTypeForm != 'google') {
                return of({ wrongProvider: 'google' })
              }
              //El formulario esta seleccionado con google
              return this.auth.getUserByEmail(email).pipe(
                map(user => {
                  //Usuario registrado en DB
                  if (user) {
                    return { repeatedUser: true }
                  }
                  //Usuario no registrado en db
                  return null
                })
              )
            //El método de email es facebook
            case 'facebook.com':
              //El formulario no está seleccionado con facebook
              if (providerTypeForm != 'facebook') {
                return of({ wrongProvider: 'facebook' })
              }
              //El formulario esta seleccionado con facebook
              return this.auth.getUserByEmail(email).pipe(
                map(user => {
                  //Usuario registrado en DB
                  if (user) {
                    return { repeatedUser: true }
                  }
                  //Usuario no registrado en db
                  return null
                })
              )
            //El método de email es email
            case 'email':
              //El formulario no está seleccionado con email
              if (providerTypeForm != 'email') {
                return of({ wrongProvider: 'email' })
              }
              //El formulario esta seleccionado con email
              return this.auth.getUserByEmail(email).pipe(
                map(user => {
                  //Usuario registrado en DB
                  if (user) {
                    return { repeatedUser: true }
                  }
                  //Usuario no registrado en db
                  return null
                })
              )
            default:
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
    return (control: AbstractControl): ValidationErrors | null => {
      let parent = control.parent;
      let pass: string = null;
      let repeatedPass: string = null;
      if (parent) {
        pass = parent.get('pass').value;
        repeatedPass = parent.get('repeatedPass').value
        if (pass && repeatedPass) {
          return pass == repeatedPass ? null : { noRepeatedPass: true }
        }
      }
      return null
    }
  }

}
