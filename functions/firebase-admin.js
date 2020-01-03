/* jshint ignore:start */
'use-strict';

const admin = require('firebase-admin');
const config = require('./firebase-admin.json');
admin.initializeApp({
    credential: admin.credential.cert(config),
    databaseURL: "https://lasmotoswebsite.firebaseio.com"
});
const firestore = admin.firestore();
const messaging = admin.messaging();



module.exports = {
    fs: firestore,
    ms: messaging
};