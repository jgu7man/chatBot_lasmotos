/*jshint sub:true*/
/* jshint esversion: 8 */

const { Card, Suggestion } = require('dialogflow-fulfillment');
const webhookActions = require('../actions/webhook');
const fsActions = require('../actions/firestore');
const motosResponse = require('./motosInfo');
const citaResponse = require('./citasTaller');
const datosDoc = require('../intents/guardarDatos');
const obtenerDatos = require('./obtenerDatos');

exports.bienvenida = async(agent) => {

    const
        params = agent.parameters,
        gotEquivalente = params.equivalente.length > 0;


    // Define encabezado de saludo y solicitud de datos
    var saludo;
    var solicitudDatos = `Dime ¿Con quién tengo el gusto?`;

    if (params.nombre) {
        saludo = `Hola, Sr@ ${params.nombre}, soy Nancy, una asistente de tienda las motos.`;
        agent.context.set({ name: 'datos', lifespan: 50, parameters: { nombre: params.nombre } });
    } else if (params.nombre && params.horarioDia) {
        saludo = `Hola, ${params.horarioDia},  Sr@ ${params.nombre}, soy Nancy, una asistente de tienda las motos.`;
        agent.context.set({ name: 'datos', lifespan: 50, parameters: { nombre: params.nombre } });
    } else if (params.horarioDia && !params.nombre) {
        saludo = `Hola ${params.horarioDia}, soy Nancy, una asistente de tienda las motos.`;
        agent.context.set({ name: 'getNombre', lifespan: 2 });
    } else {
        saludo = `Hola, soy Nancy, una asistente de tienda las motos`;
        agent.context.set({ name: 'getNombre', lifespan: 2 });
    }




    // Respuestas a peticiones del cliente
    // MOTO INFORMACION
    if (params.referencia || gotEquivalente) {


        // Respuesta: CARD con  información de la moto consultada
        if (params.referencia) {

            console.log('Bienvenida 48: ', 'Responde con informacion de moto');
            agent.add(saludo);
            await motosResponse.motoCard(agent);


            // Respuesta: CARD con información de una moto equivalente a la que consultó
        } else if (gotEquivalente) {
            console.log('bienvenida 50: ', 'Responde moto equivalente');
            agent.add(saludo);
            await motosResponse.motoEquivalente(agent);

        }


        // Respuesta si solicita información sobre moto pero no nos da la referencia que busca
    } else if (params.consultaPrecio && !params.referencia) {

        agent.add(saludo);
        agent.add(`En qué moto estás interesad@`);
        agent.context.set({ name: 'getMoto', lifespan: 2 });



        // CITA TALLER
    } else if (params.consultaCita) {
        console.log('bienvenida 83: ', 'Responde cita taller');
        await citaResponse.consultaCitaTaller(agent);



        // CRÉDITO
    } else if (params.consultaCredito || params.reportado || (params.informacion && params.consultaCredito)) {
        console.log('bienvenida 81: ', 'Responde información de crédito para reportados');
        agent.add(saludo);
        agent.add(`Manejamos posibilidades de crédito para trabajadores, pensionados, amas de casa, crédito Brilla, incluso hasta para reportados.`);
        agent.add(solicitudDatos);
        agent.context.set({ name: 'credito', lifespan: 50, });



    } else if (params.consultaCredito && params.referencia) {
        console.log('bienvenida 89: ', 'Responde credito referencia');
        agent.add(saludo);
        agent.add(`Claro, para la moto ${params.referencia} y todas nuestras demás referencias, manejamos posibilidades de crédito para trabajadores, pensionados, amas de casa, crédito Brilla, incluso hasta para reportados.`);
        agent.add(solicitudDatos);
        agent.context.set({ name: 'credito', lifespan: 50, parameters: { referencia: params.referencia } });


        // OPCIONES
    } else if (params.informacion) {
        console.log('bienvenida 98: ', 'Responde a información');
        agent.add(saludo);
        agent.add(`Estoy para servirte. ${solicitudDatos}`);
        agent.context.set({ name: 'opciones', lifespan: 50 });

    } else if (params.nombre) {
        console.log('bienvenida 104: ', 'Responde nombre + opciones');
        agent.add(`${saludo}. Espero que estés muy bien ¿Cómo podría ayudarte?`);
        await webhookActions.opciones(agent);

    } else if (params.noContestan) {
        console.log('bienvenida 109: ', 'Responde a queja');
        agent.add(saludo);
        agent.add(`Discúlpanos por cualquier inconveniente que hayas tenido con nosotros, nuestro número de teléfono para atención es 3008603210.`);
        agent.add('Queremos brindarte la mejor atención. ¿Te gustaría que te llamemos para atenderte personalmente?');

        agent.context.set({ name: 'llamada', lifespan: 5 });
        agent.context.set({ name: 'queja', lifespan: 5 });



    } else {
        console.log('bienvenida 121: ', 'Responde pidiendo nombre');
        agent.add(saludo);
        agent.add(solicitudDatos);
        agent.context.set({ name: 'getNombre', lifespan: 2 });
        agent.context.set({ name: 'getMoto', lifespan: 2 });
        agent.context.set({ name: 'opciones', lifespan: 2 });


    }



};

exports.preDespedida = async(agent) => {
    await obtenerDatos.obtenerCelularEmail(agent);
    agent.context.set({ name: 'despedida', lifespan: 2 });
    agent.context.set({ name: 'suscripcion', lifespan: 3 });
};


exports.despedida = async(agent) => {
    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
    } else {
        datos = { nombre: false, ciudad: false };
    }

    agent.add(`Sr@ ${datos.nombre} Gracias por escribirnos. Cualquier duda por favor no dudes en escribirnos o visitarnos, que estés bien.`);
    if (datos.ciudad) {
        var sucursal = await fsActions.getSucursal(datos.ciudad);
        var direccion;
        if (sucursal) { direccion = sucursal.direccion; } else { direccion = ''; }
        agent.add(`Recuerda que estamos ubicados en ${sucursal.direccion} `);
    }
    webhookActions.borrarContextos(agent);
};