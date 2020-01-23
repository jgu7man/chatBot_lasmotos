/* jshint ignore:start */
'use-strict';

const admin = require('firebase-admin');
const config = require('./tiendalasmotos-firebase-adminsdk-xsbbd-8c08f72f1f.json');
admin.initializeApp({
    credential: admin.credential.cert(config),
    databaseURL: "https://tiendalasmotos.firebaseio.com"
});
const firestore = admin.firestore();
const messaging = admin.messaging();



module.exports = {
    fs: firestore,
    ms: messaging
};