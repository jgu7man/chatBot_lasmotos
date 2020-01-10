/*jshint sub:true*/
/* jshint esversion: 8 */
const functions = require('firebase-functions');
const dgWebhook = require('./dialogflow-webhook');

exports.chatBot = functions.https.onRequest((req, res) => {
    dgWebhook.webhook(req, res);
});

exports.notificaion_cliente = functions.firestore
    .document('clientes/{id}/contactos/{contacto}')
    .onCreate(async(snap, context) => {
        const mensaje = snap.data();
        const ciudad = snap.ref.parent.parent.ciudad;
        const payload = {
            notification: {
                title: 'Nuevo contacto de cliente',
                body: mensaje.motivo,
                icon: 'https://tiendalasmotos.com/assets/img/lasmotos-isotipo-transp-1x1.png',

            },
            data: {
                openURL: `https://tiendalasmotos.com/panel/clientes`
            }
        };



        var sucursal = fs.collection('sucursales').where('referencia', '==', ciudad);
        var tokenDoc = await sucursal.collection('tokens').doc('token_notificaciones').get();
        var token = tokenDoc.data().token;
        var res = await admin.messaging().sendToDevice(token, payload);
    });