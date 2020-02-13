/* jshint ignore:start */
/* jshint esversion: 8 */
const firebase = require('../firebase-admin');


var registrarCliente = async function(cliente, contacto, datos, suscripcion) {
    var idCliente;
    // SortCliente
    cliente['ultimoContacto'] = new Date()
    cliente['ultimaVia'] = contacto.via
    cliente['visto'] = false


    // Comprobar si existe por celular registrado
    var clientes = await firebase.fs.collection('clientes').where('celular', '==', cliente.celular).get();

    if (clientes.size > 0) {
        idCliente = clientes.docs[0].id;
        firebase.fs.collection('clientes').doc(idCliente).set({ contextos: [contacto.contexto] }, { merge: true });
        var actividad = { fechayhora: new Date, actividad: 'Registró datos en chat' }
        registrarContacto(idCliente, contacto);
        registroActividad(clienteNuevo.id, actividad);
        if (datos) { registrarDatosCredito(idCliente, datos) }
        if (suscripcion) { addToSubscritions(idCliente, cliente) }


    } else {
        var clienteNuevo = await firebase.fs.collection('clientes').add(cliente);
        await firebase.fs.collection('clientes').doc(clienteNuevo.id).update({
            idCliente: clienteNuevo.id,
            registrado: new Date(),
            contextos: [contacto.contexto]
        });
        var primerContacto = { fechayhora: new Date(), actividad: 'Se dió de alta', via: contacto.via };
        registroActividad(clienteNuevo.id, primerContacto);
        registrarContacto(clienteNuevo.id, contacto);
        if (datos) { registrarDatosCredito(clienteNuevo.id, datos) }
        if (suscripcion) { addToSubscritions(clienteNuevo.id, client) }
    }
};

var registroActividad = async function(id, actividad) {
    firebase.fs.collection('clientes').doc(id).collection('actividades').add({
        fechayhora: new Date(),
        actividad: actividad.actividad,
    });
};


var registrarContacto = async function(id, contacto) {
    firebase.fs.collection('clientes').doc(id)
        .collection('contactos').add(contacto);
    actualizarUltimoContacto(id, contacto);
};

var actualizarUltimoContacto = async function(id, contacto) {
    console.log('firestore.js 33: Actualizar ultimo contacto: ', id, 'via: ', contacto.via);
    firebase.fs.collection('clientes').doc(id).update({
        ultimoContacto: contacto.fechayhora,
        via: contacto.via,
        visto: false
    });
};

var getSucursal = async function(city) {
    console.log('firestore 42: Consulta sucursal');
    var ciudad = city.trim()
    console.log(ciudad)
    const sucRef = firebase.fs.collection('sucursales');
    var sucRes = await sucRef
        .where('tipo_suc', '==', 'tienda')
        .where('ciudadRef', '==', ciudad).get();
    var sucursal;

    console.log('firestore 46: ', sucRes);
    return sucRes.size > 0 ? sucursal = sucRes.docs[0].data() : false
};

var getMotoReferencia = async function(referencia) {
    console.log('firestore 51: Consulta moto');
    // var motoRef = referencia.toLowerCase();
    const motoCol = firebase.fs.collection('motos_nuevas');
    var motoRes = await motoCol.where('referencia', '==', referencia).get();
    var moto;
    if (motoRes.size > 0) { moto = motoRes.docs[0].data(); }

    return moto;
};

var getMotosUsadas = async() => {
    console.log('firestore 62:  Consulta moto');
    const usadasCol = firebase.fs.collection('motos_usadas');
    const usadasPromo = usadasCol.where('promo', '==', true).where('enStock', '==', true);
    var motosRes = await usadasPromo.get();
    var motosUsadas = [];
    await motosRes.forEach(moto => {
        return motosUsadas.push(moto.data());
    });

    return motosUsadas;
};

var getEventoProximo = async(ciudad) => {
    console.log('firestore 75: Consulta evento próximo');
    const eventosCol = firebase.fs.collection('eventos');
    const eventoProxRes = await eventosCol
        .where('ciudadRef', '==', ciudad)
        .orderBy('inicia', "asc").get();

    if (eventoProxRes.size > 0) {
        console.log(eventoProxRes.docs[0].data());
        // const eventoProximo = eventoProxRes.docs[0].data();
        var eventos = []
        eventoProxRes.forEach(event => {
            console.log(event);
            eventos.push(event.data())
        })
        var eventoProximo = eventos[0]
        const evento = {
            direccion: eventoProximo.direccion,
            inicia: eventoProximo.inicia.toDate(),
            imgLugarUrl: eventoProximo.imgLugarUrl,
            descripcion: eventoProximo.descripcion,
            tipo: eventoProximo.tipo,
            ciudad: eventoProximo.ciudad,
            indicaciones: eventoProximo.indicaciones
        };
        return evento
    } else {
        return false
    }

    // return eventoProxRes.size > 0 ? evento : false;
};


var getPromosMes = async(fecha) => {
    console.log('firestore 94: Firestore consulta promos');
    var today = new Date
    var startMonth, endMonth;
    startMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0)

    today.getMonth == 1 ?
        endMonth = new Date(today.getFullYear(), today.getMonth(), 28, 0, 0) :
        endMonth = new Date(today.getFullYear(), today.getMonth(), 30, 0, 0)

    console.log(startMonth, endMonth);

    const promosCol = firebase.fs.collection('promos');
    const promosRes = await promosCol
        .orderBy('inicia')
        .startAt(startMonth)
        .endAt(endMonth).get()

    if (promosRes.size > 0) {
        const promociones = [];
        promosRes.forEach(promo => {
            var promocion = promo.data();
            var vigHasta = promocion.inicia.toDate();
            var vigDesde = promocion.termina.toDate();
            promociones.push({
                nombre: promocion.nombre,
                desde: vigDesde,
                hasta: vigHasta,
                imagen: promocion.imagen,
                descripcion: promocion.descripcion
            });
        });
        return promociones;
    } else {
        return false
    }


};

var getDisponibildadCita = async(fechayhora) => {
    console.log('firestore 115: Consulta disponibilidad');
    const citasCol = firebase.fs.collection('citas');
    console.log(fechayhora);
    const citasRes = await citasCol.where('dia', '==', fechayhora).get();
    return citasRes.size < 3 ? 'disponible' : 'no disponible';


};

var registrarCita = async(cita) => {
    const citasCol = firebase.fs.collection('citas');

    var citaRef = await citasCol.add(cita)
    await citasCol.doc(citaRef.id).update({ id: citaRef.id })

    return 'cita agendada';
}

var registrarDatosCredito = async(cid, datosCredito) => {
    console.log('firestore registrar datos de crédito')
    const clientesCol = firebase.fs.collection('clientes');
    const creditoDoc = clientesCol.doc(cid).collection('datos').doc('credito')
    const res = await creditoDoc.set(datosCredito)
}

var addToSubscritions = async(cid, datos) => {
    console.log('firestore suscripcion')
    const suscripcionCol = firebase.fs.collection('suscripciones');
    await suscripcionCol.doc(cid).set({
        nombre: datos.nombre,
        celular: datos.celular,
        ciudad: datos.ciudad,
        email: datos.email,
    })
}


module.exports = {
    registrarCliente: registrarCliente,
    registrarContacto: registrarContacto,
    actualizarUltimoContacto: actualizarUltimoContacto,
    getSucursal: getSucursal,
    getMotoReferencia: getMotoReferencia,
    getMotosUsadas: getMotosUsadas,
    getEventoProximo: getEventoProximo,
    getPromosMes: getPromosMes,
    getDisponibildadCita: getDisponibildadCita,
    registrarCita: registrarCita,
};