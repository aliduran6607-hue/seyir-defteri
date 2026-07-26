importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBvK8qbe6TmY7PzeuxcD_f9nhQuZVuARvA",
  authDomain: "seyir-defterim.firebaseapp.com",
  projectId: "seyir-defterim",
  storageBucket: "seyir-defterim.firebasestorage.app",
  messagingSenderId: "332529308503",
  appId: "1:332529308503:web:fe50bf2f8bb15223e2a412"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: './icon-192.png',
    badge: './icon-192.png'
  });
});
