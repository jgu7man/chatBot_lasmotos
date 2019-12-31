/*jshint sub:true*/
/* jshint esversion: 8 */
const functions = require('firebase-functions');

const dgWebhook = require('./dialogflow-webhook');

exports.chatBot = functions.https.onRequest((req, res) => {
    dgWebhook.webhook(req, res);

});