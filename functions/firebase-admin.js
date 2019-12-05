/* jshint ignore:start */
'use-strict';

const admin = require('firebase-admin');
const config = require('./firebase-admin.json');
admin.initializeApp({
    credential: admin.credential.cert(config),
    databaseURL: "https://lasmotoswebsite.firebaseio.com"
});
const fs = admin.firestore();



module.exports = fs;