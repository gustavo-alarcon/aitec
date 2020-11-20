import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireMessaging } from '@angular/fire/messaging'
import * as firebase from 'firebase'
import { from, Subject } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { User } from '../models/user.model';


@Injectable({
  providedIn: 'root'
})
export class PushService {


  private messageSource= new Subject()
  currentMessage = this.messageSource.asObservable()

  constructor(
    private afs: AngularFirestore,
    private mss: AngularFireMessaging
  ) { }

  getPermission(user: User){
    from(Notification.requestPermission()).pipe(
      switchMap(not => {
        console.log("Notification permission granted.")
        console.log(not);
        return this.mss.getToken
      }),
      tap(token => {
        this.saveTokenFb(user, token)
      })
    ).subscribe(
      res => {console.log("Success!")},
      err => console.log(err) 
    )
  }

  receiveMessages() {
    this.mss.onMessage(res => {
      console.log('Message received. ', res)
      this.messageSource.next(res);
    })
  }

  saveTokenFb(user: User, token: string) {
    let currentTokens = user.fcmTokens || {}
    console.log(currentTokens, token)

    if(!currentTokens[token]){
      let userRef = this.afs.collection('users').doc(user.uid)
      let tokens = {...currentTokens, [token]: true}
      userRef.update({ fcmTokens: tokens})
    }
  }
}
