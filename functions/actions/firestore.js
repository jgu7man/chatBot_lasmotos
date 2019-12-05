/* jshint ignore:start */
/* jshint esversion: 8 */
const fs = require('../firebase-admin');

module.exports = {
    registrarCliente: async function(cliente, motivo) {
        var idCliente;
        // SortCliente
        var client = {
            nombre: cliente.nombre,
            telefono: cliente.telefono,
            ciudad: cliente.ciudad,
            email: cliente.email,
            ultimoContacto: new Date(),
            via: 'ChatBot',
            visto: false,
        };



        // Comprobar si existe
        var clientes = await fs.collection('clientes').where('telefono', '==', cliente.telefono).get();
        if (clientes.size > 0) {
            idCliente = clientes.docs[0].id;
            registrarMotivo(idCliente, motivo);
        } else {
            var clienteNuevo = await fs.collection('clientes').add(client);
            await fs.collection('clientes').doc(clienteNuevo.id).update({
                idCliente: clienteNuevo.id
            });
            var primerContacto = { fechayhora: new Date(), motivo: 'Registro Nuevo', via: '' };
            registrarMotivo(clienteNuevo.id, primerContacto);
            registrarMotivo(clienteNuevo.id, motivo);
        }
    },


    registrarMotivo: function(id, motivoContacto) {
        fs.collection('clientes').doc(id).collection('contactos').add({
            fechayhora: new Date(),
            motivo: contacto.motivo,
            via: contacto.via
        });
        actualizarUltimoContacto(id, motivoContacto.via);
    },

    actualizarUltimoContacto: function(id, via) {
        console.log('firestore.js 33: Actualizar ultimo contacto: ', id, 'via: ', via);
        fs.collection('clientes').doc(id).update({
            ultimoContacto: new Date(),
            via: via,
            visto: false
        });
    },

    getSucursal: async function(ciudad) {
        console.log('firestore 42: Consulta sucursal');
        const sucRef = fs.collection('sucursales');
        var sucRes = await sucRef.where('ciudad', '==', ciudad).get();
        var sucursal = sucRes.docs[0].data();
        console.log('firestore 46: ', sucursal);
        return sucursal;
    },

    getMotoReferencia: async function(referencia) {
        console.log('firestore 51: Consulta moto');
        // var motoRef = referencia.toLowerCase();
        const motoCol = fs.collection('motos_nuevas');
        var motoRes = await motoCol.where('referencia', '==', referencia).get();
        var moto;
        if (motoRes.size > 0) { moto = motoRes.docs[0].data(); }

        return moto;
    },

    getMotosUsadas: async() => {
        console.log('firestore 62:  Consulta moto');
        const usadasCol = fs.collection('motos_usadas');
        const usadasPromo = usadasCol.where('promo', '==', true).where('enStock', '==', true);
        var motosRes = await usadasPromo.get();
        var motosUsadas = [];
        await motosRes.forEach(moto => {
            return motosUsadas.push(moto.data());
        });

        return motosUsadas;
    },

    getEventoProximo: async(ciudad) => {
        console.log('firestore 75: Consulta evento próximo');
        const eventosCol = fs.collection('eventos');
        const eventoProxRes = await eventosCol
            .where('ciudad', '==', ciudad)
            .orderBy(fecha, "asc").get();
        const eventoProximo = eventoProxRes.docs[0].data();
        const evento = {
            titulo: eventoProximo.titulo,
            direccion: eventoProximo.direccion,
            fechayhora: eventoProximo.fechayhora.toDate(),
            fotoURL: eventoProximo.fotoURL,
            descripcion: eventoProximo.descripcion,
        };

        return eventoProxRes.size > 0 ? evento : false;
    },


    getPromosMes: async(fecha) => {
        console.log('firestore 94: Firestore consulta promos');
        const promosCol = fs.collection('promociones');
        const promosRes = await promosCol.where('desde', '<=', fecha).where('hasta', '>=', fecha).get();

        const promociones = [];
        promosRes.forEach(promo => {
            var promocion = promo.data();
            var vigHasta = promocion.hasta.toDate();
            var vigDesde = promocion.desde.toDate();
            promociones.push({
                titulo: promocion.titulo,
                desde: vigDesde,
                hasta: vigHasta
            });
        });

        return promosRes.size > 0 ? prmociones : false;

    },

    getDisponibildadCita: async(fechayhora) => {
        console.log('firestore 115: Consulta disponibilidad');
        const citasCol = fs.collection('citas');
        console.log(fechayhora);
        const citasRes = await citasCol.where('dia', '==', fechayhora).get();
        return citasRes.size < 3 ? 'disponible' : 'no disponible';


    },

    registrarCita: async(cita) => {
        console.log('firestore registrar cita');
        const citasCol = fs.collection('citas');
        citasCol.add(cita).then(ref => {
            return citasCol.doc(ref.id).update({
                id: ref.id
            });
        }).catch(err => {
            console.log(err);
        });

        return 'cita agendada';
    }
};