/*jshint sub:true*/

const { Card, Suggestion } = require('dialogflow-fulfillment');
const fsActions = require('../actions/firestore');
const webhookActions = require('../actions/webhook');
const obtenerDatos = require('./obtenerDatos');
const datosDoc = require('./guardarDatos');

var consultaMoto = async(agent) => {

    const equivalente = agent.parameters['equivalente'];

    if (equivalente) {
        await motoEquivalente(agent);
    } else {
        await motoCard(agent);
    }



};



var motoCard = async(agent) => {
    referencia = agent.parameters['referencia'];
    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
    }
    if (!referencia && datos) { referencia = datos.referencia; }



    // Si el cliente ha preguntado por una moto o referencia, se le entrega la información en tarjetas
    console.log('motosInfo 32: ', 'Respuesta moto');

    // Obtiene la información de la moto
    let moto = await fsActions.getMotoReferencia(referencia);
    console.log('motosInfo 36: ', moto);
    agent.context.set({ name: 'datos', lifespan: 50, parameters: { referencia: referencia } });

    if (!moto) {
        console.log('motosInfo 39: ', 'No hay moto');
        agent.add(`Lo siento, actualmente no la tenemos en sala, pero si estás interesado la podemos traer. ¿Te interesa?`);
        agent.context.set({ name: 'interesado', lifespan: 50 });
        agent.context.set({ name: 'noHayMoto', lifespan: 10 });
        agent.context.set({ name: 'consultamoto-followup', lifespan: 2 });

    } else {
        console.log('motosInfo 44: ', 'Si hay moto');
        let SOAT;
        if (moto.SOAT_matricula) { SOAT = 'incluye el valor del SOAT y matrícula'; } else { SOAT = 'no incluye el valor del SOAT ni matrícula'; }

        let card = new Card(moto.referencia);
        card.setText(`Claro, nosotros manejamos la ${moto.referencia} y tiene un valor de ${moto.precio} ${SOAT}.`);
        card.setImage(moto.imagenUrl);
        card.setButton({ text: 'Ver en el catálogo', url: 'https://tiendalasmotos.com.co' });
        agent.add(card);
        agent.context.delete('moto');
        agent.context.set({ name: 'yaDioInfoMoto', lifespan: 10 });
        agent.add('¿Deseas saber opciones de crédito para esta moto?');
        agent.context.set({ name: 'moto-credito', lifespan: 10 });
    }

};




var motoEquivalente = async(agent) => {
    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
    } else {
        datos = { nombre: '' };
    }

    referencia = agent.parameters.referencia;
    equivalente = agent.parameters['equivalente'];
    equivalenteAuteco = agent.parameters['equivalenteAuteco'];
    agent.context.set({ name: 'datos', lifespan: 50, parameters: { referencia: referencia, equivalente: equivalente, equivalenteAuteco: equivalenteAuteco } });


    // Si el cliente ha preguntado por una moto o referencia, se le entrega la información en tarjetas
    console.log('motosInfo 72: ', 'Respuesta moto equivalente');

    // Obtiene la información de la moto
    let moto = await fsActions.getMotoReferencia(equivalenteAuteco);
    console.log('motosInfo 76: ', moto);

    if (!moto) {
        console.log('motosInfo 79: ', 'No hay moto equivalente');
        agent.add(`Lo siento, no manejamos esa marca de motos y tampoco tenemos alguna equivalente, pero te invitamos a que visites nuestro catálogo en linea o visites cualquiera de nuestros puntos de venta.`);
        agent.context.set({ name: 'noHayMoto', lifespan: 10 });
        agent.context.set({ name: 'consultamoto-followup', lifespan: 2 });


    } else {
        let SOAT;
        if (moto.SOAT_matricula) { SOAT = 'incluye el valor del SOAT y matrícula'; } else { SOAT = 'no incluye el valor del SOAT ni matrícula'; }

        let card = new Card(moto.referencia);
        card.setText(`Lo siento, no manejamos ${equivalente}. Pero te podemos ofrecer la  ${moto.referencia} que es la equivalente de la linea Auteco. Tiene un valor de ${moto.precio} ${SOAT}.`);
        card.setImage(moto.imagenUrl);
        card.setButton({ text: 'Ver en el catálogo', url: 'https://tiendalasmotos.com.co' });
        agent.add(card);
        agent.context.set({ name: 'yaDioInfoMoto', lifespan: 10 });
        agent.add('¿Deseas saber opciones de crédito para esta moto?');
        agent.context.set({ name: 'moto-credito', lifespan: 10 });
    }

};

var infoMotosUsadas = async(agent) => {
    // Validar si hay stock de motos usadas en firestore
    console.log('motosInfo 99: ', 'Consulta motos usadas');
    var motosUsadas = await fsActions.getMotosUsadas();


    if (motosUsadas > 0) {
        motosUsadas.forEach(moto => {
            let card = new Card(moto.referencia);

            // Definir si la referencia cuenta con SOAT
            let SOAT;
            if (moto.SOAT_matricula) { SOAT = 'más el valor del SOAT y matrícula'; } else { SOAT = 'sin incluir SOAT ni matrícula'; }

            card.setText(`Tenemos la ${moto.referencia} que tiene un precio de ${moto.precio} ${SOAT}.`);
            card.setImage(moto.imagenUrl);
            // card.setButton({ text: 'Ver en el catálogo', url: 'https://tiendalasmotos.com.co' });
            agent.add(card);
            agent.context.set({ name: 'yaDioInfoMoto', lifespan: 10 });

        });




    } else {
        agent.add(saludo);
        agent.add(`Actualmente no tenemos inventario de motos usadas. Te podemos ofrecer motos nuevas. ¿Estarías interesad@?`);
        agent.add(new Suggestion('Sí'));
        agent.add(new Suggestion('No'));
        agent.context.set({ name: 'bienvenida-folloup', lifespan: 2 });
        agent.context.set({ name: 'noHayMoto', lifespan: 10 });
    }

    // agent.context.set({ name: 'moto', lifespan: 50 });


};


var despuesDeMoto = async(agent) => {
    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
    } else {
        datos = { nombre: '' };
    }

    var contextos = await webhookActions.contextsNames(agent);
    if (contextos.includes('yaDioInfoMoto')) {
        agent.add(`${datos.nombre} ¿Deseas saber opciones de crédito para esta moto?`);
        agent.context.set({ name: 'consultaCredito', lifespan: 3 });
    } else if (contextos.includes('noHayMoto')) {
        agent.add(`${datos.nombre} ¿Deseas dejarnos tus datos para informarte o llamarte?`);
        agent.context.set({ name: 'suscripcion', lifespan: 3 });
    }

};


var consultaMoto_yes = async(agent) => {
    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
    } else {
        datos = { nombre: '' };
    }

    console.log('motosInfo 138: ', 'Si seguimiento moto');

    agent.add(`Ok, Sr@ ${datos.nombre} Necesitaré tomar sus datos para llamarle. Por ley, debe AUTORIZAR que guardemos sus datos. ¿Autorizas que guardemos tus datos?`);
    agent.context.set({ name: 'autorizacion', lifespan: 5 });
    agent.context.set({ name: 'suscripcion', lifespan: 15 });


};

var consultaMoto_no = async(agent) => {
    console.log('motosInfo 147: ', 'No seguimiento moto');
    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
    }
    agent.context.delete('Consultamoto-followup');

    agent.add(`Está bien Sr@ ${datos.nombre} ¿Deseas que te asista con alguna otra información`);
    await webhookActions.opciones(agent);
};


var interesadoMoto = async(agent) => {

    console.log('motosInfo 159: ', 'Interesado en la moto? ', interesado);

    if (interesado == 'SI') {
        await obtenerDatos.obtenerNombre(agent);
        agent.context.set({ name: 'getNombre', lifespan: 2 });
    } else if (interesado == 'NO') {
        agent.add();
    }

};


module.exports = {
    consultaMoto: consultaMoto,
    motoCard: motoCard,
    motoEquivalente: motoEquivalente,
    infoMotosUsadas: infoMotosUsadas,
    consultaMoto_no: consultaMoto_no,
    consultaMoto_yes: consultaMoto_yes,
    interesadoMoto: interesadoMoto,
    despuesDeMoto: despuesDeMoto,
};