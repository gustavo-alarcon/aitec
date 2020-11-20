const functions = require('firebase-functions');
const admin = require('firebase-admin');

let app = admin.initializeApp();
const db = admin.firestore();

exports.notifyUser = functions.firestore.document('messages/{messageId}')
  .onCreate(event => {
    let message = event.data();
    let userId = message.recipientId;

    console.log(message);
    let data = {
      notification: {
        title: 'Nuevo mensaje AITEC!',
        body: `${message.senderId} te envió un mensaje`,
        icon: 'https://firebasestorage.googleapis.com/v0/b/aitec-ecommerce.appspot.com/o/Koala.jpg?alt=media&token=7217774d-8f83-4ad7-a026-a325a2ed5643'
      }
    }

    let userRef = db.collection('users').doc(userId)

    return userRef.get()
      .then(snap => snap.data())
      .then(user => {
        let tokens = user.fcmTokens ? Object.keys(user.fcmTokens): []

        if(!tokens.length){
          console.log("Error: user with no tokens! :"+userId)
        } else {
          return app.messaging().sendToDevice(tokens, data)
        }
      })
      .catch(err => console.log(err))
  })
