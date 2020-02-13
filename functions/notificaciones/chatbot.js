/*jshint sub:true*/
/* jshint esversion: 8 */

const firebase = require('../firebase-admin');

var registro_cliente = async(snap) => {
    const registro = snap.data();
    const ciudad = (await snap.ref.parent.parent.get()).get('ciudad');
    const clienteRes = snap.ref.parent.parent.get();
    const cliente = (await clienteRes).data();

    const payload = {
        notification: {
            title: `${cliente.nombre} ${registro.contexto}`,
            body: registro.motivo,
            icon: 'https://tiendalasmotos.com/assets/img/lasmotos-isotipo-transp-1x1.png',
        },
        data: {
            openURL: `https://tiendalasmotos.com/panel/cliente/${cliente.idCliente}`
        }
    };

    var coll = firebase.fs.collection('sucursales');

    var docs = await coll.where('referencia', '==', ciudad).get();
    var idSucursal;
    docs.forEach(doc => { idSucursal = doc.id; });
    var sucRef = coll.doc(idSucursal);

    await sucRef.collection('notificaciones').add({
        title: payload.notification.title,
        body: payload.notification.body,
        idref: cliente.idCliente,
        seccion: 'cliente',
        enlace: `https://tiendalasmotos.com/panel/cliente/${cliente.idCliente}`,
        visto: false
    });

    var userToken = await firebase.fs.doc(`clientes/${idCliente}/tokens/notificaciones`).get();
    var token = userToken.data().token;
    firebase.ms.sendToDevice(token, payload);
};

var registro_cita = async(snap) => {
    const registro = snap.data();
    const ciudad = (await snap.ref.parent.parent.get()).get('ciudad');
    const clienteRes = snap.ref.parent.parent.get();
    const cliente = (await clienteRes).data();

    const payload = {
        notification: {
            title: `${cliente.nombre} ${registro.contexto}`,
            body: registro.motivo,
            icon: 'https://tiendalasmotos.com/assets/img/lasmotos-isotipo-transp-1x1.png',
        },
        data: {
            openURL: `https://tiendalasmotos.com/panel/cliente/${cliente.idCliente}`
        }
    };

    var coll = firebase.fs.collection('sucursales');

    var docs = await coll.where('referencia', '==', ciudad).get();
    var idSucursal;
    docs.forEach(doc => { idSucursal = doc.id; });
    var sucRef = coll.doc(idSucursal);

    await sucRef.collection('notificaciones').add({
        title: payload.notification.title,
        body: payload.notification.body,
        idref: cliente.idCliente,
        seccion: 'cliente',
        enlace: `https://tiendalasmotos.com/panel/cliente/${cliente.idCliente}`,
        visto: false
    });

    var userToken = await firebase.fs.doc(`clientes/${idCliente}/tokens/notificaciones`).get();
    var token = userToken.data().token;
    firebase.ms.sendToDevice(token, payload);
};


module.exports = {
    registro_cliente: registro_cliente
};