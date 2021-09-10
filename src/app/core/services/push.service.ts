import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AngularFireMessaging } from '@angular/fire/messaging'
import * as firebase from 'firebase/app';
import { from, Observable, } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { Push } from '../models/push.model';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class PushService {

  messagesRef: 'messages'='messages';


  constructor(
    private afs: AngularFirestore,
    private mss: AngularFireMessaging,
  ) { 
    
  }

  getPermission(user: User): Observable<any>{ 
    return from(Notification.requestPermission()).pipe(
      switchMap(not => {
        //console.log("Notification permission granted.")
        //console.log(not);
        return this.mss.getToken
      }),
      tap(token => {
        this.saveTokenFb(user, token)
      })
    )
  }
  
  saveTokenFb(user: User, token: string) {
    let currentTokens = user.fcmTokens || {}
    //console.log(currentTokens, token)

    if(!currentTokens[token]){
      let userRef = this.afs.collection('users').doc(user.uid)
      let tokens = {...currentTokens, [token]: true}
      userRef.update({ fcmTokens: tokens})
    }
  }
  

  sendPush(sendingUser: User, recipientUser: User, message: string, title: string){    
    let messagesRef = this.afs.firestore.collection(this.messagesRef).doc();

    let messageData: Push = {
      id: messagesRef.id,
      read: false,
      sendingUser,
      recipientUser,
      message, 
      title
    }


    messagesRef.set(messageData).catch(console.log)
  }

  getUserNotifications(user: User):Observable<Push[]>{
    return this.afs.collection<Push>(this.messagesRef, 
      ref=> ref.where("recipientUser.uid", "==", user.uid)).valueChanges()
  }


}
