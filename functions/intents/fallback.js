/*jshint sub:true*/
/* jshint esversion: 8 */

const { Card, Suggestion } = require('dialogflow-fulfillment'),
    webhookActions = require('../actions/webhook'),
    fsActions = require('../actions/firestore');

exports.fallbackGeneral = async(agent) => {

    agent.add('Disculpa, no pude entenderte. Me lo puedes repetir de otra forma o puedes elegir una de las siguientes opciones');
    await webhookActions.opciones(agent);


};

exports.errorDeConsola = async(agent) => {
    agent.add('Disculpa, soy una asistente virtual y mi sistema falló. Tenemos asesores que pueden llamarte ¿Deseas que te atienda una asesor de verdad?');
    agent.context.set({ name: 'llamada', lifespan: 2 });
};