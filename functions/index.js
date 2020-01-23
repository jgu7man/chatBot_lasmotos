/*jshint sub:true*/
/* jshint esversion: 8 */
const functions = require('firebase-functions');
const dgWebhook = require('./dialogflow-webhook');
const firebase = require('./firebase-admin');

exports.chatBot = functions.https.onRequest((req, res) => {
    dgWebhook.webhook(req, res);
});

exports.notificaion_cliente = functions.firestore
    .document('clientes/{id}/contactos/{contacto}')
    .onCreate(async(snap, context) => {
        const mensaje = snap.data();
        const ciudad = (await snap.ref.parent.parent.get()).get('ciudad');
        var clienteRes = snap.ref.parent.parent.get();
        var cliente = (await clienteRes).data();

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

        var coll = firebase.fs.collection('sucursales');

        var docs = await coll.where('referencia', '==', ciudad).get();
        var idSucursal;
        docs.forEach(doc => {
            idSucursal = doc.id;
        });
        var sucRef = coll.doc(idSucursal);
        await sucRef.collection('notificaciones').add({
            title: payload.notification.title,
            body: payload.notification.body,
            cliente: cliente.idCliente
        });

        var unidades = await sucRef.collection('tokens').get();
        unidades.forEach(unidad => {
            var token = unidad.data().token;
            firebase.ms.sendToDevice(token, payload);
        });
    });