/*jshint sub:true*/
/* jshint esversion: 8 */

const { Card, Suggestion } = require('dialogflow-fulfillment'),
    webhookActions = require('../actions/webhook'),
    motosResponse = require('./motosInfo'),
    datosResponse = require('./obtenerDatos'),
    creditoResponse = require('./creditoInfo'),
    eventoResponse = require('./eventos-promos'),
    bienvenidaResponse = require('./bienvenida'),
    citasResponse = require('./citasTaller');
const datosDoc = require('./guardarDatos');

opciones = async(agent) => {
    contextos = await webhookActions.contextsNames(agent);
    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
    } else {
        datos = { ciudad: '', nombre: '' };
    }
    params = agent.parameters;
    opciones = params.acepta;


    if ((opciones || opciones != '') && opciones == 'NO') {
        console.log('opciones 21: ', 'Dijo que no a las opciones');
        await bienvenidaResponse.despedida(agent);




    } else {
        console.log('opciones 28: ', 'No dijo que no a las opciones');
        // CONTEXTO INFORMACIÓN DE MOTOS
        if (params.infoMoto) {
            // Asignar contexto de moto'
            console.log('opciones 32: ', 'contexto moto');
            agent.context.set({ name: 'moto', lifespan: 10 });
            agent.add(`Sr@ ${datos.nombre} ¿Cuál es la moto que te interesa?`);
            agent.context.set({ name: 'getMoto', lifespan: 3 });


        } else {


            // Si no tenemos dato de la ubicación la preguntamos
            if (!datos.ciudad || datos.ciudad == '') {
                console.log('opciones 43: ', 'No hay ciudad');
                agent.add(`Sr@ ${datos.nombre} Con gusto, ¿Me puedes indicar en qué ciudad te encuentras?`);
                agent.add(new Suggestion(`Riohacha`));
                agent.add(new Suggestion(`Santa Marta`));
                agent.add(new Suggestion(`Otro`));
                agent.context.set({ name: 'getCiudad', lifespan: 2 });
                if (params.consultaCredito) {
                    agent.context.set({ name: 'credito', lifespan: 10 });
                } else if (params.consultaCitaTaller) {
                    agent.context.set({ name: 'cita', lifespan: 10 });
                } else if (params.consultaEvento) {
                    agent.context.set({ name: 'evento', lifespan: 10 });
                } else if (params.consultaPromociones) {
                    agent.context.set({ name: 'promociones', lifespan: 10 });
                }

            } else




            // CONTEXTO CRÉDITO
            if (params.consultaCredito) {
                console.log('opciones 66: ', 'contexto crédito');
                // Asignar contexto de crédito
                agent.context.set({ name: 'credito', lifespan: 10 });

                // Si no tenemos el dato si está reportado o no, preguntamos
                if (datos.ciudad && (!datos.reportado || datos.reportado == '')) {
                    console.log('opciones 72: ', 'no se sabe si está reportado');
                    datosResponse.obtenerCiudad(agent);


                    // Si tenemos el dato reportado y responde SÍ O NO, respondemos información pertinente
                } else if (datos.reportado && datos.ciudad) {
                    if (datos.reportado == 'SI' || datos.reportado == 'NO') {
                        creditoResponse.reportadoQuestion(agent);
                        console.log('opciones 80: ', `se sabe que ${datos.reportado} está reportado`);


                        // Si la información no revela si está o no reportado, preguntar...
                    } else {
                        console.log('opciones 85: ', 'Se tiene el campo reportado pero no se sabe si lo está');
                        datosResponse.obtenerCiudad(agent);
                    }

                }





                // CONTEXTO CITA PARA TALLER
            } else if (params.citaTaller) {
                console.log('opciones 97: ', 'Contexto Cita');
                // Asignar contexto de cita
                agent.context.set({ name: 'cita', lifespan: 10 });

                // Si tenemos la ciudad...
                if (datos.ciudad) {
                    console.log('opciones 103: ', 'Se tiene la ciudad', datos.ciudad);
                    citasResponse.consultaCitaTaller(agent);
                }




                // CONTEXTO EVENTOS 
            } else if (params.consultaEvento) {
                // Asignar contexto de eventos
                console.log('opciones 113: ', 'Contexto eventos');
                agent.context.set({ name: 'eventos', lifespan: 10 });

                // Si tenemos la ciudad...
                if (datos.ciudad) {
                    console.log('opciones 118: ', 'Se tiene la ciudad', datos.ciudad);
                    eventoResponse.consultaEvento(agent);
                    // Responder en base a la ciudad
                }
            }
        }
    }





};

module.exports = opciones;