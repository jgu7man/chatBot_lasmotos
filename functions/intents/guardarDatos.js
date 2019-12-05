/*jshint sub:true*/
// /* jshint ignore:start */

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

    if (!datos || datos.nombre == undefined ||
        !datos.nombre || datos.nombre == '') {
        console.log('guardarDatos 50: ', 'No hay nombre');
        agent.add(`Gracias por aceptar. ¿Me puedes decir tu nombre y apellido?`);
        agent.context.set({ name: 'getNombre', lifespan: 2 });
        agent.context.set({ name: 'datos', lifespan: 50 });


    } else if (!datos.apellido || datos.apellido == '' || datos.apellido == undefined) {
        console.log('guardarDatos 56: ', 'No hay apellido');
        agent.add(`Gracias Sr@ ${datos.nombre} por aceptar. ¿Me puedes decir tu apellido o apellidos?`);
        agent.context.set({ name: 'getApellido', lifespan: 3 });

    } else if (!datos.telefono || datos.telefono == '' || datos.telefono == undefined) {
        console.log('guardarDatos 61: ', 'No hay telefono');
        agent.add(`Gracias Sr@ ${datos.nombre} por aceptar. ¿Me puedes decir tu celular?`);
        agent.context.set({ name: 'getTelefono', lifespan: 2 });


    } else if (!datos.ciudad || datos.ciudad == '' || datos.ciudad == undefined) {
        console.log('guardarDatos 67: ', 'No hay ciudad');
        agent.add(`Gracias Sr@ ${datos.nombre} por aceptar. ¿Me puedes decir en qué ciudad te encuentras para saber de qué manera podemos atenderte?`);
        agent.add(new Suggestion(`Riohacha`));
        agent.add(new Suggestion(`Santa Marta`));
        agent.add(new Suggestion(`Otro`));
        agent.context.set({ name: 'getCiudad', lifespan: 2 });


    } else {
        console.log('guardarDatos 76: ', 'Hay todos los datos');
        if (contextos.includes('llamada') ||
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
    const
        confirma = agent.parameters['confirmaDatos'],
        contextos = await webhookActions.contextsNames(agent),
        citaCont = agent.context.get('cita');
    if (citaCont) { cita = citaCont.parameters; }
    today = new Date();
    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
    } else {
        await datosDoc.revisionDatos(agent);
    }

    var motivo = { fechayhora: today, motivo: '', via: 'chatbot' },
        cliente = { nombre: datos.nombre, apellido: datos.apellido, telefono: datos.telefono, ciudad: datos.ubiacion };


    if (confirma == 'NO') {
        console.log('guardarDatos 192: ', 'No confirma');
        agent.add(`Por favor dime lo que deseas cambiar y su correción`);
        agent.add(`Por ejemplo: "Mi nombre es Nancy" o "Mi celular es 3001231234"`);
        agent.context.set({ name: 'modifica-datos', lifespan: 2 });



    } else if (confirma == 'SI') {
        agent.context.delete('autorizacion-followup');
        agent.context.delete('confirma-datos');
        agent.context.delete('autorizacion');

        // contexto Llamada
        if (contextos.includes('llamada')) {
            console.log('guardarDatos 206: ', 'Confirma datos para llamada');
            motivo.motivo = 'Desea ser llamado';


            agent.add(`¡Excelente Sr@ ${datos.nombre}! Muy pronto un asesor@ se pondrá en contacto contigo`);

            agent.add(`¿Deseas que te ayude con alguna otra cosa?`);
            await webhookActions.opciones(agent);



            // Contexto CITA
        } else if (contextos.includes('cita')) {
            console.log('guardarDatos 219: ', 'Confirma datos para cita');
            var fecha = new Date(cita.fecha),
                hora = new Date(cita.hora),
                dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
                timeOptions = { hour: 'numeric', minute: 'numeric' },
                citaModel = {
                    dia: fecha,
                    hora: hora,
                    nombre: datos.nombre,
                    sucursal: datos.ciudad,
                    telefono: datos.telefono,
                    motivo: datos.motivoCita
                };
            await fsActions.registrarCita(citaModel);

            var localFecha = fecha.toLocaleDateString('es-ES', dateOptions);
            var localHora = hora.toLocaleTimeString('es-ES', timeOptions);
            console.log('guardarDatos 227: ', fecha, hora);

            motivo.motivo = `Agendó cita para ${fecha} a las ${hora}`;


            agent.add(`Muy bien Sr@ ${datos.nombre}. Te asignamos cita para el día: ${localFecha} a las ${localHora}. ¿Deseas alguna otra información?`);
            await webhookActions.opciones(agent);



        } else if (contextos.includes('interesado')) {
            console.log('guardarDatos 266: ', 'Confirma datos para ser contactado para una moto');
            motivo.motivo = `Desea ser contactado por que está interesado en en la moto ${datos.referencia}`;


            agent.add(`¡Excelente Sr@ ${datos.nombre}! Muy pronto un asesor@ se pondrá en contacto usted para informarle noticias sobre la moto ${datos.referencia}`);

            agent.add(`¿Deseas que te ayude con alguna otra cosa?`);
            await webhookActions.opciones(agent);
        }


        fsActions.registrarCliente(cliente, motivo);
    }
};

var modificaDatos = (agent) => {
    console.log('guardarDatos 245: ', 'Modifica datos');
    const params = agent.parameters;

    agent.add(`¿Entonces tus datos quedarían así?`);
    if (params.nombre) { agent.add(`Nombre: ${params.nombre}`); }
    if (params.apellido) { agent.add(`Apellido: ${params.apellido}`); }
    if (params.telefono) { agent.add(`Telefono: ${params.telefono}`); }
    if (params.email) { agent.add(`Email: ${params.email}`); }
    if (params.ciudad) { agent.add(`Ciudad: ${params.ubiacion}`); }

    agent.add(new Suggestion('Sí, así es'));
    agent.add(new Suggestion('No, no es así'));
    agent.context.set({ name: 'confirma-datos', lifespan: 2 });

};


module.exports = {
    autorizacionDatos: autorizacionDatos,
    revisionDatos: revisionDatos,
    confirmaNombreApellido: confirmaNombreApellido,
    confirmaDatos: confirmaDatos,
    modificaDatos: modificaDatos,
};