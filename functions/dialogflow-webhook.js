/*jshint sub:true*/
/* jshint esversion: 8 */

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

var webhook = async function webhook(req, res) {
    const agent = new WebhookClient({ request: req, response: res });
    // console.log('body: ', req.body);

    console.log({
        intent: agent.intent,
        Query: agent.query,
        requesSource: agent.requestSource,
        session: agent.session,
        consoleMessages: agent.consoleMessages
    });

    let intentMap = new Map();
    try {
        intentMap.set('Bienvenida', bienvenida.bienvenida);
        intentMap.set('Preguntas Frecuentes', preguntasFrecuentes);
        intentMap.set('Opciones', opciones);

        intentMap.set('Obtener Nombre', obtenerDatos.obtenerNombre);
        intentMap.set('Obtener Apellido', obtenerDatos.obtenerApellido);
        intentMap.set('Obtener Celular', obtenerDatos.obtenerCelular);
        intentMap.set('Obtener Ciudad', obtenerDatos.obtenerCiudad);
        intentMap.set('Obtener Ciudad - no', obtenerDatos.obtenerCiudad_no);
        intentMap.set('Obtener Email', obtenerDatos.obtenerEmail);

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

        agent.handleRequest(intentMap)
            .then(res => console.log('contestado'))
            .catch(error => {
                console.log('Error respuesta', error);
                intentMap.set('Error de consola', fallback.errorDeConsola);
                agent.handleRequest(intentMap);
            });
    } catch (error) {
        intentMap.set('Error de consola', fallback.errorDeConsola);
        agent.handleRequest(intentMap);
    }

};

module.exports = {
    webhook: webhook
};