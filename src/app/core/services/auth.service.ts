import { DatabaseService } from 'src/app/core/services/database.service';
import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';

import { User } from "../models/user.model";
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument, DocumentReference } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { switchMap, tap, shareReplay, map } from 'rxjs/operators';
import { Router } from '@angular/router';

import * as firebase from 'firebase/app';
import { Platform } from '@angular/cdk/platform';

export const googleProvider = new firebase.default.auth.GoogleAuthProvider();
export const facebookProvider = new firebase.default.auth.FacebookAuthProvider();

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  usersRef = `users`

  public user$: Observable<User>;

  public authLoader: boolean = false;

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router,
    public snackbar: MatSnackBar,
    private platform: Platform,
    private dbs: DatabaseService,
  ) {

    this.afAuth.setPersistence('local');

    // observe user authentication
    this.user$ = this.getUserObservable()
  }

  private getUserObservable(): Observable<User>{
    return this.afAuth.user.pipe(
      switchMap(user => {
        if (user) {
          console.log(user)
          return this.afs.collection('users').doc<User>(user.uid).valueChanges().pipe(
            tap(userDB => {
              console.log(userDB);
              if(!userDB){
                if(user.email){
                  this.snackbar.open("Registrando...", "Aceptar")
                  this.afs.collection('users').doc(user.uid).set({uid: user.uid, email: user.email}).then(()=> (
                    this.afAuth.signOut()
                  )).then(()=> (
                    this.router.navigateByUrl(`/main/login`).then(()=> (
                      this.router.navigateByUrl(`/main/login/signUp?providerType=${user.providerData[0].providerId}&email=${user.email}`)
                    ))
                  )).catch(err => {
                    this.snackbar.open("¡Ocurrió un error!", "Aceptar")
                    console.log(err)
                  });
                } else {
                  this.snackbar.open("Este usuario no posee correo válido. Inicie sesión con cuenta válida.", "Aceptar")
                  this.afAuth.signOut()
                }
                
              } else {
                if(Object.keys(userDB).length == 2){
                  this.snackbar.open("Por favor, complete su regístro", "Aceptar")
                  this.router.navigateByUrl(`/main/login`).then(()=> (
                    this.router.navigateByUrl(`/main/login/signUp?providerType=${user.providerData[0].providerId}&email=${user.email}`)
                  ))
                }
              }
            })
          )
        } else {
          return of(null);
        }
      }),
      shareReplay()
    )

  }

  public confirmPasswordReset(code: string, password: string): Promise<void> {
    return this.afAuth.confirmPasswordReset(code, password)
  }

  public signInEmail(email: string, pass: string): Promise<firebase.default.auth.UserCredential> {
    return this.afAuth.signInWithEmailAndPassword(email, pass);
  }

  public signUp(data: { email: string, pass: string }): Promise<firebase.default.auth.UserCredential> {
    return this.afAuth.createUserWithEmailAndPassword(data.email, data.pass);
  }

  public resetPassword(email: string) {
    return this.afAuth.sendPasswordResetEmail(email)
  }

  public signIn(type: 'google'|'facebook'): Promise<void | firebase.default.auth.UserCredential> {
    let provider = null;

    switch (type) {
      case 'facebook':
        provider = facebookProvider;
        break;
      case 'google':
        provider = googleProvider
        break;
    }

    if (this.platform.ANDROID || this.platform.IOS) {
      return this.afAuth.signInWithRedirect(provider)
        .then((cred) => {
          console.log("signIn with mobile")
        });
    } else {
      return this.afAuth.signInWithPopup(provider)
        .then((cred)=> {
          console.log("signIn with desk")
        })
    }
  }

  public logout(): void {
    this.dbs.order = []
    this.dbs.orderObs.next([])
    this.afAuth.signOut().finally(() => {
      this.router.navigateByUrl('/main');
    });
  }

  //ERROR HANDLING
  private handleError(error) {

    console.log(error)

    this.snackbar.open(
      'Ocurrió un error. Por favor, vuelva a intentarlo.',
      'Cerrar',
      { duration: 6000, }
    );

  }

  //User from DB
  getUserByEmail(email: string): Observable<User> {
    return this.afs.collection<User>(this.usersRef, ref => ref.where("email", "==", email)).get()
      .pipe(
        map(snap => {
          if (snap.empty) {
            return null
          } else {
            return <User>snap.docs[0].data()
          }
        })
      )
  }

  emailMethod(email: string): Observable<string[]> {
    return from(this.afAuth.fetchSignInMethodsForEmail(email))
  }

  registerUser(user: User, pass?: string){
    let userRef: DocumentReference = null;

      if(pass){
        this.user$ = null;
        return from(this.afAuth.signInWithEmailAndPassword(user.email, pass)).pipe(
          switchMap(cred => {
            let uid = cred.user.uid
            userRef = this.afs.firestore.collection(this.usersRef).doc(cred.user.uid);
            return from(userRef.set({...user, uid}, {merge: true}).then(()=>{
              this.user$ = this.getUserObservable()
            }))
          })
        )
      } else {
        return this.getUserByEmail(user.email).pipe(
          switchMap(userDB => {
            userRef = this.afs.firestore.collection(this.usersRef).doc(userDB.uid)
            return from(userRef.set({...user}, {merge: true}))
          })
        )
      }
  }

}
