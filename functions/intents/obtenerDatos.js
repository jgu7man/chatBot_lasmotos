/*jshint sub:true*/

const { Card, Suggestion } = require('dialogflow-fulfillment');
const fsActions = require('../actions/firestore');
const webhookActions = require('../actions/webhook');
const datosDoc = require('./guardarDatos');
const motosResponse = require('./motosInfo');
const eventoResponse = require('./eventos-promos');
const citaResponse = require('./citasTaller');
const llamadaResponse = require('./llamada');
const bienvenidaResponse = require('./bienvenida');

var obtenerNombre = async(agent) => {
    const givenName = agent.parameters.nombre;
    var nombre, datos;
    if (typeof givenName == 'object') {
        nombre = givenName['given-name'];
    }
    var datosCont = agent.context.get('datos');
    if (datosCont) {
        datos = datosCont.parameters;
        if (datos.nombre) { nombre = datos.nombre; } else { nombre = ''; }
    }

    contextos = await webhookActions.contextsNames(agent); //Método para extraer los nombres de los contextos


    if (!nombre) {
        console.log('obtenerDatos 21: ', 'No hay hombre');
        // Insistir a que nos entregue el nombre al menos una vez
        agent.add(`Disculpa, soy una asistente virtual y no pude registrar tu nombre.  ¿Puedes escribir sólo tu nombre?`);
        agent.context.set({ name: 'datos', lifespan: 2, parameters: { nombre: nombre } });

    } else if (nombre && datos.apellido) {
        console.log('obtenerDatos 27: ', 'Dio nombre y apellido');
        agent.add(`Me puedes confirmar que tu nombre es ${nombre} y tu apellido es ${datos.apellido}`);

        agent.context.set({ name: 'confirmaNombreApellido', lifespan: 2, parameters: { nombre: nombre, apellido: datos.apellido } });

    } else if (nombre != '') {
        // Si exist el nombre se configura el agradecimiento con el nombre
        console.log('obtenerDatos 34: ', 'hay nombre: ', nombre);
        const gracias = `Muchas gracias Sr@ ${nombre}`;
        agent.context.delete('getNombre');


        if (contextos.includes('autorizacion')) {
            // webhook especial para solicitar datos después de autorización
            console.log('obtenerDatos 41: ', 'Respuestas autorización');
            await datosDoc.revisionDatos(agent);

        } else if (contextos.includes('moto')) {
            // respuesta por default de tarjeta de motos
            console.log('obtenerDatos 46: ', 'Respuestas moto');
            await motosResponse.consultaMoto(agent);


            // respuesta si ya dio información de la moto y preguntó nombre después
        } else if (contextos.includes('yadioinfomoto')) {
            console.log('obtenerDatos 52: ', 'Ya dio información de moto');
            agent.add(`${nombre} ¿Deseas saber opciones de crédito para esta moto?`);
            agent.context.set({ name: 'consultaCredito', lifespan: 3 });
            agent.context.set({ name: 'consultamoto-followup', lifespan: 1 });



        } else if (contextos.includes('nohaymoto')) {
            console.log('obtenerDatos 59: ', 'No hay moto moto');
            agent.add(`${nombre} ¿Deseas dejarnos tus datos para informarte o llamarte?`);
            agent.context.set({ name: 'suscripcion', lifespan: 3 });
            agent.context.set({ name: 'consultamoto-followup', lifespan: 1 });


        } else if (contextos.includes('cita')) {
            // respuestas para las citas del taller
            console.log('obtenerDatos 66: ', 'Respuestas moto');
            await citaResponse.consultaCitaTaller(agent);

        } else if (contextos.includes('credito') || contextos.includes('reportado')) {
            // Consultar ciudad para dar información correcta sin consultar otros datos, al no tener autorización de datos
            console.log('obtenerDatos 71: ', 'Respuesta crédito');
            agent.add(gracias);
            agent.add(`Me puedes decir ¿En qué ciudad te encuentras? Para saber de qué manera podemos atenderte`);
            agent.add(new Suggestion(`Riohacha`));
            agent.add(new Suggestion(`Santa Marta`));
            agent.add(new Suggestion(`Otro`));
            agent.context.set({ name: 'getCiudad', lifespan: 2 });



        } else if (contextos.includes('opciones')) {
            console.log('obtenerDatos 67: ', 'Respuesta opciones');
            agent.add(`${gracias}. Dime ¿En qué te puedo ayudar?`);
            // Dar opciones
            await webhookActions.opciones(agent);




        } else {
            console.log('obtenerDatos 91: ', 'No hay contexto');
            agent.add(`${gracias}. Dime ¿En qué te puedo ayudar?`);
            // Dar opciones
            await webhookActions.opciones(agent);
        }
    }
};












var obtenerApellido = async(agent) => {
    const params = agent.parameters;
    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
    } else {
        datos = { nombre: '', apellido: '' };
    }


    if (!datos.apellido || !params.apellido) {
        console.log('obtenerDatos 101: ', 'No encontró apellido');
        agent.add(`Disculpa, Sr@ ${datos.nombre} No comprendí tu apellido, me lo puedes repetir?`);
        agent.context.set({ name: 'getApellido', lifespan: 2 });


    } else
    if (datos.apellido) {
        console.log('obtenerDatos 108: ', 'capturó apellido');
        agent.context.delete('getNombreApellido');
        agent.context.delete('getApellido');

        await datosDoc.revisionDatos(agent);
    }

};













var obtenerCiudad = async(agent) => {


    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
    } else {
        datos = { nombre: '', };
    }
    contextos = await webhookActions.contextsNames(agent);

    console.log(datos);

    console.log('obtenerDatos 136: ', datos.ciudad);
    agent.context.delete('getCiudad');

    if (datos.ciudad == 'otro' || (datos.ciudad != 'Santa Marta' && datos.ciudad != 'Riohacha')) {
        console.log('obtenerDatos 140: ', 'No es Riohacha ni Santa Marta');
        agent.add(`Sr@ ${datos.nombre}. Lastimosamente no tenemos sede en la ciudad de ${datos.ciudad}. No podríamos atenderte, a menos que puedas acercarte a la ciudad de Santa Marta o Riohacha.`);

        agent.add(`¿Puedes acercarte a:`);
        agent.add(new Suggestion(`Riohacha`));
        agent.add(new Suggestion(`Santa Marta`));
        agent.add(new Suggestion(`Ninguna`));

        agent.context.delete('obtenerCiudad-followup');
        agent.context.set({ name: 'getCiudad', lifespan: 2 });
        agent.context.set({ name: 'acercarse', lifespan: 2 });




    } else if (datos.ciudad == 'Riohacha' && contextos.includes('informacion')) {
        console.log('obtenerDatos 155: ', 'Es Riohacha');
        agent.add(`Bella ciudad ${datos.ciudad}. Sr@ ${datos.nombre}, Estamos ubicados en la Diagonal a la terminal de transporte.`);
        agent.add(`Deseas más información de:`);
        // Dar opciones
        await webhookActions.opciones(agent);
        agent.context.delete('obtenerCiudad-followup');



    } else if (datos.ciudad == 'Santa Marta' && contextos.includes('informacion')) {
        console.log('obtenerDatos 165: ', 'Es Santa Marta');
        agent.add(`Bella ciudad ${datos.ciudad}. Sr@ ${datos.nombre}, Estamos en la Carrera 4 # 20-45 Gaira, Rodadero, al frente del Mac Pollo de Gaira.`);
        agent.add(`Deseas más información de:`);
        // Dar opciones
        await webhookActions.opciones(agent);
        agent.context.delete('obtenerCiudad-followup');



    } else if (datos.ciudad && contextos.includes('credito')) {
        console.log('obtenerDatos 175: ', 'Preguntar si es reportado');
        agent.add(`Bella ciudad ${datos.ciudad}. ¿Me podrías decir si estás reportad@?`);

        agent.context.set({ name: 'preguntarreportado', lifespan: 2 });
        agent.context.delete('obtenerubicacion-followup');


    } else if (datos.ciudad && contextos.includes('evento')) {
        console.log('obtenerDatos 184: ', 'Respuesta de evento');
        await eventoResponse.consultaEvento(agent);

    } else if (datos.ciudad && contextos.includes('cita')) {
        console.log('obtenerDatos 188: ', 'Respuesta de cita');
        await citaResponse.consultaCitaTaller(agent);

    } else if (datos.ciudad && contextos.includes('llamada')) {
        console.log('obtenerDatos 192: ', 'Respuesta de llamada');
        await datosDoc.revisionDatos(agent);

    } else if (datos.ciudad && contextos.includes('interesado')) {
        console.log('obtenerDatos 192: ', 'Respuesta de autorizacion');
        await datosDoc.revisionDatos(agent);

    } else {
        console.log('obtenerDatos 196: ', 'No reconoce ciudad');
        agent.add(`Sr@ ${datos.nombre}. Lastimosamente no tenemos sede en la ciudad de ${datos.ciudad}. No podríamos atenderte, a menos que puedas acercarte a la ciudad de Santa Marta o Riohacha.`);
        agent.add(`¿Puedes acercarte a:`);
        agent.add(new Suggestion(`No`));
        agent.add(new Suggestion(`Riohacha`));
        agent.add(new Suggestion(`Santa Marta`));
        agent.context.delete('obtenerCiudad-followup');
        agent.context.set({ name: 'getCiudad', lifespan: 2 });
        agent.context.set({ name: 'acercarse', lifespan: 2 });

    }


};





var obtenerCiudad_no = async(agent) => {


    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
    } else {
        adatos = { nombre: '' };
    }
    contextos = await webhookActions.contextsNames(agent);
    console.log('obtenerDatos 219: ', 'No puede acercarse a las ciudades');

    agent.add(`Sr@ ${datos.nombre} Si no puedes acercarte a alguna de estas ciudades nosotros no podremos ayudarte. ¿Deseas que te ayude con otra información?`);

};








var obtenerTelefono = async(agent) => {

    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
    } else {
        await datosDoc.revisionDatos(agent);
    }
    contextos = await webhookActions.contextsNames(agent);

    if (!datos.ciudad || datos.ciudad == '' || datos.ciudad == undefined) {
        agent.add(`Gracias Sr@ ${datos.nombre}. ¿Me puedes decir en qué ciudad te encuentras?`);
        agent.context.set({ name: 'getCiudad', lifespan: 2 });


    } else if (!datos.telefono) {

        agent.add(`Sr@ ${datos.nombre} ¿Me puedes decir tu celular?`);
        agent.context.set({ name: 'getTelefono', lifespan: 2 });

    } else {

        agent.context.delete('getTelefono');

        if (contextos.includes('llamadas')) {
            llamadaResponse.confirmarDatosLlamada(agent);
        } else if (contextos.includes('cita')) {
            agent.add('Regálame por favor, el número de placa de la moto.');
            agent.context.set({ name: 'getPlaca', lifespan: 3 });
            agent.context.set({ name: 'Obtenerfechayhora-followup', lifespan: 5 });
        }
    }

};


var obtenerTelefonoEmail = async(agent) => {
    const
        datos = await webhookActions.getDatos(agent),
        contextos = await webhookActions.contextsNames(agent);

    if (!datos.email && !datos.telefono) {
        agent.add(`Sr@ ${datos.nombre} ¿Me puedes decir tu teléfono y tu correo electrónico?`);
        agent.context.set({ name: 'getEmail' });

    } else if (!datos.email && datos.telefono) {
        agent.add(`Sr@ ${datos.nombre} ¿Me puedes decir tu correo electrónico?`);
        agent.context.set({ name: 'getEmail' });

    } else {
        agent.context.delete('getEamil');
        // Contextos...

        if (contextos.includes('llamada')) {
            console.log('obtenerDatos 284: ', 'Respuesta de llamada');
            llamadaResponse.confirmarDatosLlamada(agent);
        } else if (contextos.includes('despedida')) {
            // Guardar datos
            var motivo = { fechayhora: today, motivo: 'Suscripción para eventos y promociones', via: 'chatbot' },
                cliente = { nombre: datos.nombre, apellido: datos.apellido, telefono: datos.telefono, ciudad: datos.ciudad, email: datos.email, tipoCliente: ['suscripcion'] };

            fsActions.registrarCliente(cliente, motivo);


            await bienvenidaResponse.despedida(agent);

        }




    }
};


module.exports = {
    obtenerNombre: obtenerNombre,
    obtenerApellido: obtenerApellido,
    obtenerCiudad: obtenerCiudad,
    obtenerCiudad_no: obtenerCiudad_no,
    obtenerTelefono: obtenerTelefono,
    obtenerTelefonoEmail: obtenerTelefonoEmail,
};