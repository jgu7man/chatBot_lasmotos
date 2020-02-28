/*jshint sub:true*/
/* jshint esversion: 8 */
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


    console.log(llamada);
    if (!llamada) {
        agent.add(`Disculpa, soy una asistente virtual, no pude capturar tu respuesta. ¿Me la puedes repetir?`);
    } else {
        if (llamada == 'SI') {
            agent.add(`Para cumplir requisitos de ley, necesito que autorices que guardaremos tus datos.`);

            let card = new Card('Consulta nuestro acuerdo de confidencialidad de datos');
            card.setButton({ text: 'Política de privacidad', url: 'https://tiendalasmotos.com.co/pdp' });
            agent.add(card);

            agent.add(`¿Nos podrías confirmar tu autorización?`);


            agent.context.set({ name: 'autorizacion', lifespan: 3 });
            console.log('Borra contexto llamada');
            agent.context.delete('llamada');
            agent.context.set({ name: 'deseallamada', lifespan: 20 });


        } else if (llamada == 'NO') {
            agent.add(`Entonces, sólo te podemos atender en nuestra sede si no nos permites llamarte.`);
            if (datos.ciudad) {
                var sucursal = await fsActions.getSucursal(datos.ciudad);
                var direccion;
                if (sucursal) { direccion = sucursal.direccion; } else { direccion = ''; }
                agent.add(`Estamos ubicados en ${direccion}. ¿Deseas alguna otra información?`);
            }
            agent.add('¿Deseas que te ayude con algo más?');
            await webhookActions.opciones(agent);

        }
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

    if (datos.numCelular) { datos.celular = datos.numCelular; }

    agent.add(`Muchas gracias. ¿Me confirmas entonces que estos son tus datos? Sólo para estar seguros`);
    agent.add(`Nombre: ${datos.nombre} ${datos.apellido}`);
    agent.add(`Celular: ${datos.celular}`);
    agent.add(`Ciudad: ${datos.ciudad}`);
    if (datos.email) { agent.add(`Correo electrónico: ${datos.email}`); }

    agent.context.set({ name: 'confirma-datos', lifespan: 2 });
};