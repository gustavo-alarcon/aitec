importScripts('https://www.gstatic.com/firebasejs/7.24.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.24.0/firebase-messaging.js');
import { environment } from 'src/environments/environment';

firebase.initializeApp(environment.firebaseConfig);
const messaging = firebase.default.messaging();