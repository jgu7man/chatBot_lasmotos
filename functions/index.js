/*jshint sub:true*/
const functions = require('firebase-functions');

const { WebhookClient } = require('dialogflow-fulfillment');
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
const cors = require('cors')({ origin: true });

const
    bienvenida = require('./intents/bienvenida'),
    preguntasFrecuentes = require('./intents/preguntas-frecuentes'),
    obtenerDatos = require('./intents/obtenerDatos'),
    llamada = require('./intents/llamada'),
    creditoInfo = require('./intents/creditoInfo'),
    guardarDatos = require('./intents/guardarDatos'),
    citasTaller = require('./intents/citasTaller'),
    eventos = require('./intents/eventos-promos'),
    motos = require('./intents/motosInfo'),
    opciones = require('./intents/opciones'),
    fallback = require('./intents/fallback');

function webhook(req, res) {
    const agent = new WebhookClient({ request: req, response: res });
    // console.log('Dialogflow Request headers: ' + JSON.stringify(req.headers));
    console.log('intent: ' + JSON.stringify(req.body.queryResult.intent.displayName));
    console.log(req.body.queryResult);

    let intentMap = new Map();
    intentMap.set('Bienvenida', bienvenida.bienvenida);
    intentMap.set('Preguntas Frecuentes', preguntasFrecuentes);
    intentMap.set('Opciones', opciones);

    intentMap.set('Obtener Nombre', obtenerDatos.obtenerNombre);
    intentMap.set('Obtener Apellido', obtenerDatos.obtenerApellido);
    intentMap.set('Obtener Telefono', obtenerDatos.obtenerTelefono);
    intentMap.set('Obtener Ciudad', obtenerDatos.obtenerCiudad);
    intentMap.set('Obtener Ciudad - no', obtenerDatos.obtenerCiudad_no);

    intentMap.set('Consulta moto', motos.consultaMoto);
    intentMap.set('Consulta moto - yes', motos.consultaMoto_yes);
    intentMap.set('Consulta moto - no', motos.consultaMoto_no);

    intentMap.set('Reportado?', creditoInfo.reportadoQuestion);
    intentMap.set('Estudio - yes', creditoInfo.estudioEnLinea);
    intentMap.set('Estudio - no', creditoInfo.estudioEnLinea);
    intentMap.set('llamada?', llamada.llamadaQuestion);
    intentMap.set('Reportado por', creditoInfo.entidadReporta);
    intentMap.set('Valor de adeudo', creditoInfo.valorAdeudo);

    intentMap.set('Autorizacion', guardarDatos.autorizacionDatos);
    intentMap.set('Confirma datos', guardarDatos.confirmaDatos);
    intentMap.set('Modifica datos', guardarDatos.modificaDatos);
    intentMap.set('Confirma nombre y apellido', guardarDatos.confirmaNombreApellido);

    intentMap.set('Consulta evento', eventos.consultaEvento);

    intentMap.set('Consulta taller', citasTaller.consultaCitaTaller);
    intentMap.set('Agendar cita?', citasTaller.agendarCitaQuestion);
    intentMap.set('Motivo de cita', citasTaller.motivoCita);
    intentMap.set('Acepta dejar moto', citasTaller.aceptaDejarMoto);
    intentMap.set('Obtener fecha y hora', citasTaller.obtenerFechaHora);
    intentMap.set('Obtener placa', citasTaller.obtenerPlaca);

    intentMap.set('Fallback general', fallback.fallbackGeneral);

    agent.handleRequest(intentMap);
}

exports.chatBot = functions.https.onRequest((req, res) => {
    webhook(req, res);
});