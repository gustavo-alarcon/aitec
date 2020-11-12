import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, from, Observable, of } from 'rxjs';
import { debounceTime, map, switchMap } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent implements OnInit {
  version: string
  
  registerLogin$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false) //true when email already exist, so you need to login
  dataFormGroup: FormGroup;

  hidePass: boolean = true;

  register: boolean = false

  registerForm = new FormControl(false)

  constructor(
    private auth: AuthService,
    private dbs: DatabaseService,
    private snackbar: MatSnackBar,
    private fb: FormBuilder,
  ) { }

  ngOnInit() {
    this.version = this.dbs.version;

    this.dataFormGroup = this.fb.group({
      email: [null, [Validators.required, Validators.email], [this.emailRepeatedValidator()]],
      pass: [null, [Validators.required, Validators.minLength(6)]]
    });

  }

  login(): void {
    this.auth.signInEmail(this.dataFormGroup.get('email').value, this.dataFormGroup.get('pass').value)
      .then(res => {
        this.snackbar.open('¡Bienvenido!', 'Cerrar');
      })
      .catch(err => {
        this.snackbar.open('Parece que hubo un error ...', 'Cerrar');
        console.log(err.message);
      })
  }

  registerUser(): void {
    this.auth.signUp(this.dataFormGroup.value)
      .then(res => {
        this.snackbar.open('¡Bienvenido!', 'Cerrar');
      })
      .catch(error => {
        this.snackbar.open('Parece que hubo un error ...', 'Cerrar');
        console.log(error);
      });
  }

  signInProvider(type: "facebook"|"google") {
    this.auth.signIn(type).then(res => {
      this.snackbar.open('¡Bienvenido!', 'Cerrar');
    })
    .catch(error => {
      this.snackbar.open('Parece que hubo un error ...', 'Cerrar');
      console.log(error);
    });;
  }

  passwordReset() {
    this.auth.resetPassword(this.dataFormGroup.get('email').value).then(() => {
      // Email sent.
      this.snackbar.open(
        'Se envió un correo para restaurar su contraseña. Revise correo no deseado.',
        'Cerrar');
    }).catch((error) => {
      this.snackbar.open(
        'Ocurrió un error. Por favor, vuelva a intentarlo.',
        'Cerrar');
    });
  }

  passwordForgot(){
    this.snackbar.open(
      'Por favor, ingrese un correo válido y vuelva a presionar "Olvidé mi contraseña".',
      'Aceptar');
  }

  emailRepeatedValidator() {
    return (control: AbstractControl): Observable<
      {providerLogin: "google"|"facebook"|"noRegistered"}|null
      > => {
        const email = control.value;
        return of(email).pipe(
          debounceTime(500),
          switchMap(res => from(this.auth.emailMethod(res))),
          map(res => {
            console.log(res)
            control.parent.get('pass').enable()
            this.registerLogin$.next(false)
            switch(res[0]) {
              case 'google.com':
                control.parent.get('pass').disable()
                return {providerLogin: "google"}
              case 'facebook.com':
                control.parent.get('pass').disable()
                return {providerLogin: "facebook"}
              case 'email':
                this.registerLogin$.next(true)
                return null
              default: 
                return {providerLogin: "noRegistered"}
            }
          }
        ))
    }
  }

}
