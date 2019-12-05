/*jshint sub:true*/
/* jshint esversion: 8 */

const { Card, Suggestion } = require('dialogflow-fulfillment'),
    webhookActions = require('../actions/webhook'),
    fsActions = require('../actions/firestore');

exports.fallbackGeneral = async(agent) => {

    agent.add('Disculpa, no pude entenderte. Me lo puedes repetir de otra forma o puedes elegir una de las siguientes opciones');
    await webhookActions.opciones(agent);


};