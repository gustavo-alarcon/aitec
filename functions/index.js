const functions = require('firebase-functions');
const admin = require('firebase-admin');

let app = admin.initializeApp();
const db = admin.firestore();

exports.notifyUser = functions.firestore.document('messages/{messageId}')
  .onCreate(event => {
    let message = event.data();
    let userId = message.recipientUser.uid;
    console.log("checking data");
    console.log(message);
    let data = {
      notification: {
        title: message.title,
        body: message.message,
        icon: 'https://firebasestorage.googleapis.com/v0/b/aitec-ecommerce.appspot.com/o/logo_push.png?alt=media&token=0cf44667-c864-4671-bf1e-b0664f1ee57c'
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
