/*jshint sub:true*/
// /* jshint ignore:start */

const { Card, Suggestion, Text } = require('dialogflow-fulfillment');
const fsActions = require('../actions/firestore');
const webhookActions = require('../actions/webhook');
const datosDoc = require('../intents/guardarDatos');

exports.llamadaQuestion = async(agent) => {
    const llamada = agent.parameters['confirmaLlamada'];
    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
    } else {
        datos = { nombre: '', ciudad: '' };
    }
    // ciudad = datos.parameters['ciudad'];



    if (llamada == 'SI') {
        agent.add(`Para cumplir requisitos de ley, necesito que autorices que guardaremos tus datos.`);
        agent.add(`¿Nos podrías confirmar tu autorización?`);
        agent.context.set({ name: 'autorizacion', lifespan: 3 });
        console.log('Borra contexto llamada');
        agent.context.delete('llamada');


    } else if (llamada == 'NO') {
        agent.add(`Entonces, sólo te podemos atender en nuestra sede si no nos permites llamarnos.`);
        if (datos.ciudad) {
            var sucursal = await fsActions.getSucursal(datos.ciudad);
            agent.add(`Estamos ubicados en ${sucursal.direccion}. ¿Deseas alguna otra información?`);
        }

        await webhookActions.opciones(agent);

    }

};

exports.confirmarDatosLlamada = async(agent) => {
    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
    } else {
        await datosDoc.revisionDatos(agent);
    }

    agent.add(`Muchas gracias. ¿Me confirmas entonces que estos son tus datos? Sólo para estar seguros`);
    agent.add(`Nombre: ${datos.nombre} ${datos.apellido}`);
    agent.add(`Celular: ${datos.telefono}`);
    agent.add(`Ciudad: ${datos.ciudad}`);
    if (datos.email) { agent.add(`Correo electrónico: ${datos.email}`); }

    agent.context.set({ name: 'confirma-datos', lifespan: 2 });
};