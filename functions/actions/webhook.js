/*jshint sub:true*/

const { Card, Suggestion } = require('dialogflow-fulfillment');


var contextsNames = async(agent) => {

    contextos = [];
    contextObj = agent.contexts;

    await contextObj.forEach(contexto => {
        return contextos.push(contexto.name);
    });

    console.log('webhook 15: Contextos', contextos);
    return contextos;
};

var borrarContextos = async(agent) => {

    // Borra todos los datos execpto el de datos para conservarlos
    agent.contexts.forEach(cont => {
        if (cont.name != 'datos' || cont.name != 'opciones') {
            console.log('webhook 24: ', 'contexto borrado: ', cont.name);
            agent.context.delete(cont.name);
        }
    });
};

var opciones = async(agent) => {

    console.log('webhook 32: ', 'Dar opciones');
    const contextos = await contextsNames(agent); //Método para extraer los nombres de los contextos

    console.log(contextos);

    if (contextos.includes('credito')) {
        console.log('webhook 38: ', 'Opciones sin credito');
        agent.add(new Suggestion(`Información de alguna moto`));
        agent.add(new Suggestion(`Servicio de taller o agendar cita`));
        agent.add(new Suggestion(`Nuestros eventos`));
        agent.add(new Suggestion(`Promociones del mes`));
        agent.add(new Suggestion(`No, Gracias`));
        agent.context.delete('credito');

    } else if (contextos.includes('moto')) {
        console.log('webhook 47: ', 'Opciones sin moto');
        agent.add(new Suggestion(`Servicio de taller o agendar cita`));
        agent.add(new Suggestion('Opciones de crédito'));
        agent.add(new Suggestion(`Nuestros eventos`));
        agent.add(new Suggestion(`Promociones del mes`));
        agent.add(new Suggestion(`No, Gracias`));
        agent.context.delete('moto');

    } else if (contextos.includes('cita')) {
        console.log('webhook 56: ', 'Opciones sin cita');
        agent.add(new Suggestion(`Información de alguna moto`));
        agent.add(new Suggestion('Opciones de crédito'));
        agent.add(new Suggestion(`Nuestros eventos`));
        agent.add(new Suggestion(`Promociones del mes`));
        agent.add(new Suggestion(`No, Gracias`));
        agent.context.delete('cita');

    } else if (contextos.includes('eventos')) {
        console.log('webhook 65: ', 'Opciones sin eventos');
        agent.add(new Suggestion(`Información de alguna moto`));
        agent.add(new Suggestion('Opciones de crédito'));
        agent.add(new Suggestion(`Servicio de taller o agendar cita`));
        agent.add(new Suggestion(`Promociones del mes`));
        agent.add(new Suggestion(`No, Gracias`));
        agent.context.delete('eventos');

    } else if (contextos.includes('promociones')) {
        console.log('webhook 74: ', 'Opciones sin eventos');
        agent.add(new Suggestion(`Información de alguna moto`));
        agent.add(new Suggestion('Opciones de crédito'));
        agent.add(new Suggestion(`Servicio de taller o agendar cita`));
        agent.add(new Suggestion(`Nuestros eventos`));
        agent.add(new Suggestion(`No, Gracias`));
        agent.context.delete('promociones');

    } else {
        console.log('webhook 83: ', 'Todas las opciones');
        agent.add(new Suggestion(`Información de alguna moto`));
        agent.add(new Suggestion('Opciones de crédito'));
        agent.add(new Suggestion(`Servicio de taller o agendar cita`));
        agent.add(new Suggestion(`Nuestros eventos`));
        agent.add(new Suggestion(`Promociones del mes`));
        agent.add(new Suggestion(`No, Gracias`));
    }

    console.log('webhook 92: ', 'Asigna contexto');
    // await borrarContextos(agent);
    return agent.context.set({ name: 'opciones', lifespan: 2 });
};



module.exports = {
    contextsNames: contextsNames,
    opciones: opciones,
    borrarContextos: borrarContextos,
};