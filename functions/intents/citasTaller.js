/*jshint sub:true*/
/* jshint esversion: 8 */

const { Card, Suggestion } = require('dialogflow-fulfillment'),
    webhookActions = require('../actions/webhook'),
    fsActions = require('../actions/firestore');
const datosDoc = require('../intents/guardarDatos');

var consultaCitaTaller = async(agent) => {
    agent.context.set({ name: 'cita', lifespan: 10 });
    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
    } else {
        // await datosDoc.revisionDatos(agent);
    }


    if (!datos || !datos.nombre) {
        console.log('citaTaller 13: ', 'No hay nombre');
        agent.add(`Con mucho gusto te agendaré tu cita para el taller. ¿Me indicas tu nombre por favor?`);
        agent.context.set({ name: 'getNombre', lifespan: 2 });



        // Si hay nombre pero no hay ciudad
    } else {
        if (!datos.ciudad) {
            console.log('citaTaller 22: ', 'No hay ciudad');
            agent.add(`Sr@ ${datos.nombre} Con gusto te doy información sobre el taller, ¿Me puedes indicar en qué ciudad te encuentras?`);
            agent.add(new Suggestion(`Riohacha`));
            agent.add(new Suggestion(`Santa Marta`));
            agent.add(new Suggestion(`Otro`));
            agent.context.set({ name: 'getCiudad', lifespan: 2 });


            // Si hay ciudad
        } else {
            let sucursal = await fsActions.getSucursal(datos.ciudad);
            console.log('citaTaller 33: ', 'Ciudad', datos.ciudad);

            if (datos.ciudad == 'Riohacha') {

                agent.add(`Sr@ ${datos.nombre}. En Riohacha no manejamos cita pero contamos con servicio de taller autorizado por auteco para que nos visites. `);

                if (sucursal) { agent.add(`Estamos ubicados en ${sucursal.direccion}.`); }

                agent.add(`¿Deseas alguna otra información?`);
                await webhookActions.opciones(agent);



                // Respuesta SANTA MARTA
            } else if (datos.ciudad == 'Santa Marta') {
                agent.add(`Sr@ ${datos.nombre}. Nuestro taller autorizado por Auteco está ubicado en ${sucursal.direccion}.`);
                agent.add(`¿Le AGENDO la cita?`);

                agent.context.set({ name: 'agendaCita', lifespan: 2 });

            }
        }
    }
};


var agendarCitaQuestion = async(agent) => {
    var agendaCita = agent.parameters['agendaCita'];
    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
        if (!agendaCita && datos) { agendaCita = datos.agendaCita; }

    }

    // Si responde que sí
    if (agendaCita == 'SI') {
        console.log('citaTaller 66: ', 'Sí desea agendar cita');
        agent.add(`Manejamos citas para Revisión de garantía que son los que se realizan cada 500km a tu moto, y servicios que pueden ser dentro y fuera de la garantía.`);
        agent.add('¿Qué tipo de cita te gustaría agendar?');
        agent.add(new Suggestion('Revisión en garantía')); //30 minutos
        agent.add(new Suggestion('Servicio dentro de garantía'));
        agent.add(new Suggestion('Servicio fuera de garantía'));



    } else if (agendaCita == 'NO') {
        console.log('citaTaller 76: ', 'No desea agendar cita');
        agent.add('Está bien. ¿Estarías interesado en otra información?');
        await webhookActions.opciones(agent);
    }
};


var motivoCita = async(agent) => {
    const motivo = agent.parameters['motivosCita'];
    var intervalo;

    if (motivo == 'revision') { intervalo = 30; } else { intervalo = 15; }

    if (motivo == 'servicio') {
        agent.add(`Disculpa, me puedes indicar si el servicio es:`);
        agent.add(new Suggestion('dentro de garantía'));
        agent.add(new Suggestion('fuera de garantía'));
        agent.context.set({ name: 'agendarcita-followup', lifespan: 2 });
        agent.context.delete('motivodecita-followup');
    } else {
        agent.context.set({ name: 'motivodecita-followup', lifespan: 2 });
        agent.context.delete('agendarcita-followup');

        agent.add(`Ok, para ${motivo} de garantía, manejamos un horario de citas de lunes a viernes de 8am a 5pm de Lunes a Viernes y de 8am a 12pm los Sábados. Con un intervalo de ${intervalo} minutos entre cada cita`);

        agent.add(`Debes tener disponibilidad para que probablemente tengas que dejar tu moto un día, dependiendo del diagnóstico. ¿Estás de acuerdo con dejar tu moto?`);
        agent.context.set({ name: 'aceptaDejarMoto', lifespan: 2 });
    }
};


var aceptaDejarMoto = async(agent) => {
    var confirma = agent.parameters.confirmaDejarMoto;
    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
        if (!confirma && datos) { confirma = datos.confirmaDejarMoto; }
    }

    if (confirma == 'SI') {

        agent.add(`De acuerdo Sr@ ${datos.nombre}. ¿A qué hora te gustaría venir?`);
        agent.context.set({ name: 'getFechaHora', lifespan: 5 });
    } else {
        if (confirma == 'NO') {
            agent.add('Bueno, para poderte atender es necesario que estés de acuerdo en dejar tu moto. De otra manera no podemos ayudarte');
            agent.context.set({ name: 'aceptaDejarMoto', lifespan: 2 });
        } else {
            agent.add('Está bien, si no aceptas no podremos ayudarte. Deseas que te oriente con alguna otra información?');
            await webhookActions.opciones(agent);
            agent.context.delete('aceptaDejarMoto');
            agent.context.set({ name: 'opciones', lifespan: 2 });
        }
    }


};


var obtenerFechaHora = async(agent) => {
    const
        fecha = new Date(agent.parameters['fecha']),
        hora = new Date(agent.parameters['hora']),
        fechayhora = fecha + hora,
        motivo = agent.context.get('cita').parameters['motivo'];
    var intervalo;

    if (motivo == 'garantia') { intervalo = 30; } else { intervalo = 15; }


    var disponivilidad = await fsActions.getDisponibildadCita(fechayhora);
    if (disponivilidad == 'disponible') {
        agent.add(`Muy bien, tenemos disponibilidad para esa hora.`);
        agent.add(`Para agendar la cita necesitamos tomarte unos datos personales y necesitamos que nos AUTORICES guardarlos. ¿Aceptas?`);

        agent.context.set({ name: 'autorizacion', lifespan: 3 });
        agent.context.delete('getFechaHora');


    } else {
        agent.add(`Para esa hora no podemos darte servicio, ya que tenemos asignadas todas las citas. ¿Podrías escribirme otra hora?`);

    }


};

var obtenerPlaca = async(agent) => {
    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
    } else {
        await datosDoc.revisionDatos(agent);
    }
    const placa = agent.parameters.placa;

    agent.add(`Muchas gracias. ¿Me confirmas entonces que estos son tus datos? Sólo para estar seguros`);
    agent.add(`Nombre: ${datos.nombre} ${datos.apellido}`);
    agent.add(`Celular: ${datos.telefono}`);
    agent.add(`Ciudad: ${datos.ciudad}`);
    agent.add(`Placa: ${placa}`);

    agent.context.set({ name: 'confirma-datos', lifespan: 2 });
    agent.context.delete('obtenerfechayhora-followup');
    agent.context.delete('agendarcita-followup');
    agent.context.delete('motivodecita-followup');
    agent.context.delete('getPlaca');

};

var confirmaDatosCita = async(agent) => {

};

module.exports = {
    consultaCitaTaller: consultaCitaTaller,
    agendarCitaQuestion: agendarCitaQuestion,
    motivoCita: motivoCita,
    aceptaDejarMoto: aceptaDejarMoto,
    obtenerFechaHora: obtenerFechaHora,
    obtenerPlaca: obtenerPlaca,
    confirmaDatosCita: confirmaDatosCita,
};