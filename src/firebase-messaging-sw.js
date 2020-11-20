importScripts('https://www.gstatic.com/firebasejs/7.24.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.24.0/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyDpMDx2102pwLjeGh19_Gms5f6MvClWxr0",
  authDomain: "aitec-ecommerce.firebaseapp.com",
  databaseURL: "https://aitec-ecommerce.firebaseio.com",
  projectId: "aitec-ecommerce",
  storageBucket: "aitec-ecommerce.appspot.com",
  messagingSenderId: "483311992725",
  appId: "1:483311992725:web:ddde8def4bac5bffeec09c",
  measurementId: "G-X01L1PW7LZ"
});
console.log("hello")
const messaging = firebase.default.messaging();
console.log("hello2")