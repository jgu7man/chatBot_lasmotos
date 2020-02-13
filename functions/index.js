// /*jshint sub:true*/
// /* jshint esversion: 8 */
const functions = require('firebase-functions');
const dgWebhook = require('./dialogflow-webhook');
const firebase = require('./firebase-admin');
const notificaciones_chatbot = require('./notificaciones/chatbot');

exports.chatBot = functions.https.onRequest((req, res) => {
    dgWebhook.webhook(req, res);
});

exports.notificacion_cliente_chatbot = functions.firestore
    .document('clientes/{idCliente}/contactos/{id}')
    .onCreate((snap, context) => {
        notificaciones_chatbot.registro_cliente(snap);
    });

exports.notificacion_cliente_chatbot = functions.firestore
    .document('clientes/{idCliente}/contactos/{id}')
    .onCreate((snap, context) => {
        notificaciones_chatbot.registro_cliente(snap);
    });