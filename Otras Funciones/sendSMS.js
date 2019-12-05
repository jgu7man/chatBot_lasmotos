const functions = require('firebase-functions');
const admin = require('firebase-admin');
const config = require('./firebase-admin.json');

const accountSid = 'ACa2d3fd5b06a976f2d29c9465aea59484';
const authToken = '1906255132015642187be17f9dacab0e';
const twilio = require('twilio')(accountSid, authToken);
const tFrom = '+12056289089';
const tTo = '+573006564279';

admin.initializeApp({
    credential: admin.credential.cert(config),
    databaseURL: "https://lasmotoswebsite.firebaseio.com"
});

const fs = admin.firestore();
const cors = require('cors')({ origin: true });

exports.sendSMS = functions.https.onRequest((req, res) => {
    cors(req, res, () => {

        console.log(req.body);
        const cliente = req.body.nombre;
        const telefono = '+57' + req.body.telefono;

        twilio.messages.create({
                body: `El cliente ${cliente} de contacto ${telefono} desea comunicarse con un asesor`,
                from: tFrom,
                to: tTo
            }).then(sms => console.log(`Mensaje enviado a ${sms.to}`))
            .catch(err => console.log(err));

        return res.send('Mensaje enviado con éxito');
    });
});