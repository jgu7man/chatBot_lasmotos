/*jshint sub:true*/
/* jshint esversion: 8 */

const { Card, Suggestion, Text } = require('dialogflow-fulfillment');
const fsActions = require('../actions/firestore');
const webhookActions = require('../actions/webhook');
const autorizaciones = require('./guardarDatos');
const motosResponse = require('./motosInfo');
const eventoResponse = require('./eventos-promos');
const citaResponse = require('./citasTaller');
const llamadaResponse = require('./llamada');
const datosDoc = require('./guardarDatos');

var autorizacionDatos = async(agent) => {

    autorizacion = agent.parameters['autoriza'];
    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
    } else {
        datos = { nombre: '' };
    }
    console.log('guardarDatos 18: ', datos);

    if (autorizacion == 'NO') {
        console.log('guardarDatos 21: ', 'No autoriza');
        agent.add(`Sr@ ${datos.nombre} Por ley es importante que nos autorices guardar tus datos. Sólo los usaremos para brindarte la atención que requieres. Si no aceptas no podremos seguir atendiendo tu consulta.`);
        agent.add('¿Deseas autorizar?');




    } else if (autorizacion == 'SI') {
        console.log('guardarDatos 30: ', 'Sí autoriza');
        agent.context.delete('autorizacion');

        await revisionDatos(agent);

    }

};



var revisionDatos = async(agent) => {
    // Configura las respuestas de la autorización basado en la falta de algún dato o basado en algún cotexto si todos los datos están capturados
    console.log('Asigna contexto datos');


    const
        contextos = await webhookActions.contextsNames(agent);
    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
    } else {
        datos = { nombre: '' };
    }

    console.log(datos);

    if (!datos || !datos.nombre) {
        console.log('guardarDatos 50: ', 'No hay nombre');
        agent.add(`Gracias por aceptar. ¿Me puedes decir tu nombre y apellido?`);
        agent.context.set({ name: 'getNombre', lifespan: 2 });
        agent.context.set({ name: 'datos', lifespan: 50 });


        // } else if (!datos.apellido || datos.apellido.length == 0) {

        //     console.log('guardarDatos 56: ', 'No hay apellido');
        //     agent.add(`Sr@ ${datos.nombre} ¿Me puedes decir tu apellido o apellidos?`);
        //     agent.context.set({ name: 'getApellido', lifespan: 3 });

    } else if (!datos.ciudad) {
        console.log('guardarDatos 67: ', 'No hay ciudad');
        agent.add(`Sr@ ${datos.nombre} ¿Me puedes decir en qué ciudad te encuentras para saber de qué manera podemos atenderte?`);
        agent.add(new Suggestion(`Riohacha`));
        agent.add(new Suggestion(`Santa Marta`));
        agent.add(new Suggestion(`Otro`));
        agent.context.set({ name: 'getCiudad', lifespan: 2 });


    } else if (!datos.celular && !datos.numCelular) {
        console.log('guardarDatos 61: ', 'No hay celular');
        agent.add(`Sr@ ${datos.nombre} ¿Me puedes decir tu celular?`);
        agent.context.set({ name: 'getcelular', lifespan: 2 });


    } else {

        agent.context.delete('obtenerubicacion-followup');
        agent.context.delete('getNombre');
        agent.context.delete('getCiudad');
        agent.context.delete('getCelular');

        console.log('guardarDatos 76: ', 'Hay todos los datos');
        if (contextos.includes('deseallamada') ||
            contextos.includes('moto-credito') ||
            contextos.includes('interesado')) {

            console.log('guardarDatos 81: ', 'Respuesta para llamadas');
            llamadaResponse.confirmarDatosLlamada(agent);


        } else if (contextos.includes('cita')) {
            console.log('guardarDatos 86: ', 'Respuesta autorizacion-cita');
            agent.add('Regálame por favor, el número de placa de la moto.');
            agent.context.set({ name: 'getPlaca', lifespan: 3 });

        } else if (contextos.includes('suscripcion')) {
            console.log('guardarDatos 91: ', 'Respuesta autorizacion-moto-credito');
            llamadaResponse.confirmarDatosLlamada(agent);




        }
    }


};


var confirmaNombreApellido = async(agent) => {

    const

        confirma = agent.parameters.confirmaNombreApellido,
        contextos = await webhookActions.contextsNames(agent); //Método para extraer los nombres de los contextos
    agent.context.delete('ObtenerNombre-followup');
    agent.context.delete('confirmaNombreApellido');


    if (confirma == 'SI') {
        agent.add('Gracias');
        agent.context.delete('getName');

        if (contextos.includes('autorizacion')) {
            // webhook especial para solicitar datos después de autorización
            console.log('guardarDatos 121: ', 'Respuestas autorización');
            autorizaciones.getApellido(agent);

        } else if (contextos.includes('moto')) {
            // respuesta por default de tarjeta de motos
            console.log('guardarDatos 126: ', 'Respuestas moto');
            motosResponse.infoMoto(agent);

        } else if (contextos.includes('credito') || contextos.includes('reportado')) {
            // Consultar ciudad para dar información correcta
            console.log('guardarDatos 131: ', 'Respuesta crédito');
            agent.add(`Me puedes decir ¿En qué ciudad te encuentras? Para saber donde te podemos atender.`);
            agent.add(new Suggestion(`Riohacha`));
            agent.add(new Suggestion(`Santa Marta`));
            agent.add(new Suggestion(`Otro`));
            agent.context.set({ name: 'getCiudad', lifespan: 2 });

        } else if (contextos.includes('cita')) {
            console.log('guardarDatos 140: ', 'Respuesta cita');
            await citaResponse.consultaCitaTaller(agent);


        } else if (contextos.includes('opciones')) {
            console.log('guardarDatos 142: ', 'Respuesta opciones');
            agent.add(` Dime ¿En qué te puedo ayudar?`);
            // Dar opciones
            await webhookActions.opciones(agent);



        } else if (contextos.includes('queja')) {
            console.log('guardarDatos 150: ', 'Respuesta queja');
            agent.add(`Nos pondremos en contacto contigo lo más pronto posible. Para cumplir requisitos de ley, es necesario que nos AUTORICES usar tu información para llamarte.`);
            agent.add(`¿Nos podrías confirmar tu autorización?`);

            agent.context.set({ name: 'autorizacion', lifespan: 5 });

        } else {
            await revisionDatos(agent);
        }





    } else if (confirma == 'NO') {
        agent.add('Entonces ¿Podrías decirme sólo tu nombre por favor?');
        agent.context.set({ name: 'getNombre', lifespan: 2 });
    }
};



var confirmaDatos = async(agent) => {
    console.log('respuestas de confirmar datos');
    const
        confirma = agent.parameters['confirmaDatos'],
        contextos = await webhookActions.contextsNames(agent),
        today = new Date();
    var datosCont = agent.context.get('datos'),
        datos, cliente, motivo, datosCredito, suscripcion;
    if (datosCont) {
        datos = datosCont.parameters;
        console.log('Sí hay contexto datos');
    }

    if (datos.apellido) { datos.nombre = `${datos.nombre} ${datos.apellido}`; }
    if (datos.numCelular) { datos.celular = datos.numCelular; }
    if (!datos.email) { datos['email'] = ''; }


    motivo = { fechayhora: today, motivo: '', via: 'chatbot' };
    cliente = {
        nombre: datos.nombre,
        celular: datos.celular,
        ciudad: datos.ciudad,
        email: datos.email
    };


    console.log('confirma? ', confirma);

    if (confirma == 'NO') {
        console.log('guardarDatos 192: ', 'No confirma');
        agent.add(`Por favor dime lo que deseas cambiar y su correción`);
        agent.add(`Por ejemplo: "Mi nombre es Nancy" o "Mi celular es 3001231234"`);
        agent.context.set({ name: 'modifica-datos', lifespan: 2 });



    } else if (confirma == 'SI') {
        agent.context.delete('autorizacion-followup');
        agent.context.delete('confirma-datos');
        agent.context.delete('autorizacion');
        agent.context.delete('__system_counters__');


        // contexto Llamada
        if (contextos.includes('deseallamada') ||
            contextos.includes('credito') ||
            contextos.includes('moto-credito')) {
            console.log('guardarDatos 206: ', 'Confirma datos para llamada');

            if (contextos.includes('credito')) {
                motivo.motivo = `${datos.nombre} desea ser llamado por un asesor por que está interesado en estudio de crédito`;
                datosCredito = { reportado: datos.reportado };
                if (datos.reportado == 'SI') {
                    datosCredito['EntidadReporta'] = datos.EntidadReporta;
                }
            } else if (contextos.includes('moto-credito')) {
                motivo.motivo = `${datos.nombre} desea ser llamado por un asesor por que está interesado en estudio de crédito para la moto ${datos.referencia}`;
                datosCredito = { reportado: datos.reportado };
                if (datos.reportado == 'SI') {
                    datosCredito['EntidadReporta'] = datos.EntidadReporta;
                }
            } else {
                motivo.motivo = `${datos.nombre} desea ser llamado por un asesor inmediatamente`;
            }


            agent.add(`¡Excelente Sr@ ${datos.nombre}! Muy pronto un asesor@ se pondrá en contacto contigo`);

            agent.add(`¿Deseas que te ayude con alguna otra cosa?`);
            await webhookActions.opciones(agent);



            // Contexto CITA
        } else if (contextos.includes('cita')) {
            console.log('guardarDatos 219: ', 'Confirma datos para cita');
            var fecha = new Date(datos.citafecha),
                cita = {
                    dia: fecha,
                    hora: fecha,
                    nombre: datos.nombre,
                    sucursal: datos.ciudad,
                    celular: datos.celular,
                    motivo: datos.motivoCita + ' de garantía',
                };
            await fsActions.registrarCita(cita);

            var date = fecha.toLocaleDateString(),
                year = date.split('-')[0],
                month = date.split('-')[1],
                day = date.split('-')[2],
                mes;
            mes = await setMonth(month);

            var time = fecha.toLocaleTimeString(),
                hora = time.split(':'),
                min = time.split(':');
            console.log('guardarDatos 227: ', localFecha, localHora);

            motivo.motivo = `${datos.nombre} agendó cita para ${day} de ${mes} del ${year} a las ${localHora}`;


            agent.add(`Muy bien Sr@ ${datos.nombre}. Te asignamos cita para el día: ${day} de ${mes} del ${year} a las ${localHora}. ¿Deseas alguna otra información?`);
            await webhookActions.opciones(agent);



        } else if (contextos.includes('interesado')) {
            console.log('guardarDatos 266: ', 'Confirma datos para ser contactado para una moto');
            motivo.motivo = `${datos.nombre} desea ser contactado por que está interesado en la moto ${datos.referencia} y no fue encontrada en base de datos`;


            agent.add(`¡Excelente Sr@ ${datos.nombre}! Muy pronto un asesor@ se pondrá en contacto usted para informarle noticias sobre la moto ${datos.referencia}`);

            agent.add(`¿Deseas que te ayude con alguna otra cosa?`);
            await webhookActions.opciones(agent);


        } else if (contextos.includes('suscripcion')) {
            console.log('guardarDatos 266: ', 'Se ha suscrito');
            motivo.motivo = `${datos.nombre} se ha suscrito para recibir información sobre eventos y promociones`;
        }


        await fsActions.registrarCliente(cliente, motivo, datosCredito, suscripcion);
        return;
    }
};

var setMonth = async(month) => {
    var mes;
    switch (month) {
        case 0:
            mes = 'Enero';
            break;
        case 1:
            mes = 'Febrero';
            break;
        case 2:
            mes = 'Marzo';
            break;
        case 3:
            mes = 'Abril';
            break;
        case 4:
            mes = 'Mayo';
            break;
        case 5:
            mes = 'Junio';
            break;
        case 6:
            mes = 'Julio';
            break;
        case 7:
            mes = 'Agosto';
            break;
        case 8:
            mes = 'Septiembre';
            break;
        case 9:
            mes = 'Octubre';
            break;
        case 10:
            mes = 'Noviembre';
            break;
        case 11:
            mes = 'Diciembre';
            break;
        default:
            break;
    }
    return mes;
};

var modificaDatos = (agent) => {
    console.log('guardarDatos 245: ', 'Modifica datos');
    const params = agent.parameters;

    agent.add(`¿Entonces tus datos quedarían así?`);
    if (params.nombre) { agent.add(`Nombre: ${params.nombre}`); }
    if (params.apellido) { agent.add(`Apellido: ${params.apellido}`); }
    if (params.celular) { agent.add(`celular: ${params.celular}`); }
    if (params.numCelular) { agent.add(`celular: ${params.numCelular}`); }
    if (params.email) { agent.add(`Email: ${params.email}`); }
    if (params.ciudad) { agent.add(`Ciudad: ${params.ubiacion}`); }


    agent.context.set({ name: 'confirma-datos', lifespan: 2 });

};


module.exports = {
    autorizacionDatos: autorizacionDatos,
    revisionDatos: revisionDatos,
    confirmaNombreApellido: confirmaNombreApellido,
    confirmaDatos: confirmaDatos,
    modificaDatos: modificaDatos,
};