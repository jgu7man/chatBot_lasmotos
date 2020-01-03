/*jshint sub:true*/
/* jshint esversion: 8 */
const firebase = require('./firebase-admin');
const functions = require('firebase-functions');

var nuevo_registro = functions.firestore
    .document('sucursal/{id}/notificaciones/{id}')
    .onCreate(async(snap, context) => {

        const mensaje = snap.data();
        const sid = snap.ref.parent.parent.id;

        const payload = {
            notification: {
                title: 'Nuevo registro de cliente',
                body: mensaje.body,
                icon: 'https://tiendalasmotos.com.co/assets/img/lasmotos-isotipo-neg.png',

            },
            data: {
                openURL: `https://tiendalasmotos.com.co/panel`
            }
        };

        var sucursal = fs.collection('sucursales').doc(sid);
        var tokenDoc = await sucursal.collection('tokens').doc('token_notificaciones').get();
        var token = tokenDoc.data().token;
        var res = await admin.messaging().sendToDevice(token, payload);

    });