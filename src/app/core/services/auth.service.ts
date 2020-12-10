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
import 'firebase/auth';
import { Platform } from '@angular/cdk/platform';

// export const googleProvider = new firebase.default.auth.GoogleAuthProvider();
export const googleProvider = new firebase.default.auth.GoogleAuthProvider();
export const facebookProvider = new firebase.default.auth.FacebookAuthProvider();

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  usersRef = `users`

  public user$: Observable<User>;
  public getUser$: Observable<{authUser: firebase.default.User, dbUser: User, type: "registered"|"unregistered"|"unexistent"}>;


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
    this.user$ = this.afAuth.user.pipe(
      switchMap(user => {
        if(user){
          return this.afs.collection('users').doc<User>(user.uid).valueChanges()
        } else {
          return of(null)
        }
      })
    )
    this.getUser$ = this.getUserObservable()
  }

  private getUserObservable(): Observable<{authUser: firebase.default.User, dbUser: User, type: "registered"|"unregistered"|"unexistent"}>{
    return this.afAuth.authState.pipe(
      switchMap(authUser => {
        // console.log(authUser)
        if(authUser){
          // console.log(authUser);
          return this.afs.collection<User>('users').doc(authUser.uid).get({source: "server"}).pipe(
            map(res => {
              if(res.exists){
                return <User>res.data()
              } else {
                return null
              }
            }),
            map(dbUser => {
              if(!dbUser){
                if(!authUser.email){
                  this.snackbar.open("Este usuario no posee correo válido. Inicie sesión con cuenta válida.", "Aceptar")
                  this.afAuth.signOut()
                  return {authUser: null, dbUser: null, type: "unexistent"}
                } else {
                  return {authUser, dbUser: null, type: "unregistered"}
                }
              } else {
                  return {authUser, dbUser, type: "registered"}
              }
            })
          )
        } else {
          return of({authUser: null, dbUser: null, type: null})
        }
      }),
      shareReplay(1)
    )
  }

  public confirmPasswordReset(code: string, password: string): Promise<void> {
    return this.afAuth.confirmPasswordReset(code, password)
  }

  public signInEmail(email: string, pass: string): Promise<firebase.default.auth.UserCredential> {
    return this.afAuth.signInWithEmailAndPassword(email, pass);
  }

  public signUpEmail(email: string, pass: string ): Promise<firebase.default.auth.UserCredential> {
    return this.afAuth.createUserWithEmailAndPassword(email, pass);
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
        }).catch(err => {
          console.log(err)
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
    return this.afs.collection<User>(this.usersRef, ref => ref.where("email", "==", email)).get({source: "server"})
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

  registerUser(authUser: firebase.default.User, dbUser: User, pass?: string): Promise<any>{
    let userRef: DocumentReference = null;
    let uid: string = null;
      if(pass){
        return this.signUpEmail(dbUser.email, pass).then((cred) => {
          uid = cred.user.uid
          userRef = this.afs.firestore.collection(this.usersRef).doc(uid);
          return userRef.set({...dbUser, uid})
          }).then(res => {
            this.snackbar.open("Bienvenido!", "Aceptar")
            return this.router.navigateByUrl(`/main`)
          }).catch(err => {
            this.handleError(err)
          })
      } else {
        let uid = authUser.uid
        userRef = this.afs.firestore.collection(this.usersRef).doc(uid)
        return userRef.set({...dbUser, uid}).then(res => {
          this.snackbar.open("Bienvenido!", "Aceptar")
          return this.router.navigateByUrl(`/main`)
        }).catch(err => {
          this.handleError(err)
        })
      }
  }

}
