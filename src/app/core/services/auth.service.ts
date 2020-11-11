import { DatabaseService } from 'src/app/core/services/database.service';
import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';

import { User } from "../models/user.model";
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
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
    this.user$ =
      this.afAuth.user.pipe(
        switchMap(user => {
          if (user) {
            console.log(user)
            return this.afs.collection('users').doc<User>(user.uid).valueChanges().pipe(
              tap(userDB => {
                console.log(userDB);
                if(!userDB){
                  this.snackbar.open("Este usuario no existe. Por favor, regístrese", "Aceptar")
                  this.afAuth.signOut().then(()=> (
                    this.router.navigateByUrl(`/main/login/signUp?providerType=${user.providerId}&email=${user.email}`)
                  ))
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
        .then(()=> this.afAuth.getRedirectResult())
        .then((cred) => {
          console.log("signIn with mobile")
          console.log(cred.user)
        })
        .catch(error => {
          this.handleError(error)
        });
    } else {
      return this.afAuth.signInWithPopup(provider)
        .then((cred)=> {
          console.log("signIn with desk")
          console.log(cred.user)
        })
        .catch(error => {
          this.handleError(error)
        })
    }
  }

  private updateUserData(user: firebase.default.User): Promise<void> {
    const userRef = this.afs.firestore.collection(`users`).doc(user.uid);
    const flagRef = this.afs.firestore.collection(`db/portugalCotizador/actions`).doc('userPricesActions');
    let flagData: {
      action: "read",
      uid: string,
      nit: string
    }

    let key = Object.keys(this.platform).filter(key => this.platform[key] == true);

    let userData: User;

    //transaction to check if user already exists
    return this.afs.firestore.runTransaction((transaction) => {
      return transaction.get(userRef)
        .then((doc) => {
          //If document does not exist, we create user data
          if (!doc.exists) {
            userData = {
              uid: user.uid,
              email: user.email,
              name: user.displayName,
              lastName1: null,
              lastName2: null,
              photoURL: user.photoURL,
              lastLogin: new Date(),
              lastBrowser: [key.length ? key.join(", ") : "empty", navigator.userAgent],
              lastPassDate: new Date(),
            }


            transaction.set(userRef, userData);
          }
          //If document already exist
          else {
            userData = {
              lastLogin: new Date(),
              lastBrowser: [key.length ? key.join(", ") : "empty", navigator.userAgent],
            }
            flagData = {
              action: "read",
              uid: user.uid,
              nit: (<User>doc.data()).nci ? (<User>doc.data()).nci : null
            }

            transaction.update(userRef, userData);
            if(flagData.nit){
              transaction.set(flagRef, flagData);
            }
            
          }
        })
    }).catch(
      err => this.handleError(err)
    )

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
}
