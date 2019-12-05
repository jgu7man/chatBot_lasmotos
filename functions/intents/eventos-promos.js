/*jshint sub:true*/

const { Card, Suggestion } = require('dialogflow-fulfillment'),
    bienvenidaResponse = require('./bienvenida'),
    webhookActions = require('../actions/webhook'),
    fsActions = require('../actions/firestore');
const datosDoc = require('../intents/guardarDatos');

exports.consultaEvento = async(agent) => {
    agent.context.set({ name: 'evento', lifespan: 10 });
    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
    } else {
        datos = { nombre: '' };
    }
    var start, end;
    console.log('eventos-promos 12: ', 'Consulta eventos');

    if (datos.nombre) {
        start = `Claro Sr@ ${datos.nombre}`;
        end = `¿Te gustaría que te ayudáramos con algo más?`;
    } else {
        start = 'Claro';
        end = '¿Me puedes decir tu nombre para saber con quién tengo el gusto?';
    }

    var datosSolicitar;

    if (!datos.email && !datos.telefono) {
        datosSolicitar = 'tu correo o tu celular';
    } else if (!datos.email && datos.telefono) {
        datosSolicitar = 'tu correo';
    } else if (datos.email && !datos.telefono) {
        datosSolicitar = 'tu celular';
    }

    if (datos.ciudad) {
        var evento = await fsActions.getEventoProximo(datos.ciudad);

        if (evento) {
            console.log('eventos-promos 35: ', 'Hay evento');

            // Configurar fecha y hora
            let dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            let timeOptions = { hour: 'numeric', minute: 'numeric' };
            let fecha = evento.fechayhora.toLocaleDateString('es-ES', dateOptions);
            let hora = evento.fechayhora.toLocaleTimeString('es-ES', timeOptions);
            console.log('eventos-promos 35: ', fecha, hora);



            // crear CARD
            let card = new Card(evento.titulo);
            card.text(`${start} Tenemos un evento en ${evento.direccion} el día ${fecha} a las ${hora}. ${evento.descripcion}. ${end}`);
            card.imageUrl(evento.fotoURL);
            agent.add(card);



        } else {
            console.log('eventos-promos 35: ', 'No hay evento');
            agent.add(`Lo siento Sr@ ${datos.nombre} no tenemos por el momento algun evento programado en tu ciudad. Te invito a que nos sigas en nuestras redes sociales para que estés al pendiente de nuestros próximos eventos`);

        }

        agent.add(`Sr@ ${datos.nombre} ¿Estarías interesado en regalarnos ${datosSolicitar} para enviarte información sobre nuestras promociones y eventos?`);
        agent.context.set({ name: 'suscripcion', lifespan: 3 });



    } else {
        console.log('eventos-promos 35: ', 'No hay ciudad');
        agent.add(`Sr@ ${datos.nombre} Con gusto, ¿Me puedes indicar en qué ciudad te encuentras?`);
        agent.add(new Suggestion(`Riohacha`));
        agent.add(new Suggestion(`Santa Marta`));
        agent.add(new Suggestion(`Otro`));
        agent.context.set({ name: 'getCiudad', lifespan: 2 });


    }



};




exports.promosVigentes = async(agent) => {
    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
    } else {
        datos = { nombre: '' };
    }
    today = new Date();
    var start, end;

    console.log('eventos-promos 90: ', 'Consulta promos');

    if (datos.nombre) {
        start = `Claro Sr@ ${datos.nombre}`;
        end = `¿Te gustaría que te ayudáramos con algo más?`;
    } else {
        start = 'Claro';
        end = '¿Me puedes decir tu nombre para saber con quién tengo el gusto?';
    }

    var datosSolicitar;

    if (!datos.email && !datos.telefono) {
        datosSolicitar = 'tu correo o tu celular';
    } else if (!datos.email && datos.telefono) {
        datosSolicitar = 'tu correo';
    } else if (datos.email && !datos.telefono) {
        datosSolicitar = 'tu celular';
    }

    const promos = await fsActions.getPromosMes();

    if (promos) {
        console.log('eventos-promos 113: ', 'Si hay promos');
        agent.add(`${start} Actualmente tenemos estas promociones para ti: `);
        promos.forEach(promo => {
            let card = new Card(promo.titulo);
            card.setText(`Vigencia: desde ${promo.desde}, hasta ${promo.hasta}`);
            agent.add(card);
        });
    } else {
        console.log('eventos-promos 35: ', 'No hay promos');
        agent.add(`${datos.nombre} Lo siento, por ahora no tenemos alguna promoción`);
    }

    agent.add(`Sr@ ${datos.nombre} ¿Estarías interesado en regalarnos ${datosSolicitar} para enviarte información sobre nuestras promociones y eventos?`);
    agent.context.set({ name: 'suscripcion', lifespan: 3 });

};

class Cliente {
    constructor(nombre, apellido, ciudad, telefono, email, tipoCliente) {}
}



exports.suscripcion = async(agent) => {
    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
    } else {
        datos = { nombre: '', email: '', telefono: '' };
    }
    params = agent.params;



    if (params.confirma == 'NO') {
        console.log('eventos-promos 144: ', 'No se quiere suscribir');
        await bienvenidaResponse.despedida(agent);

    } else {

        console.log('eventos-promos 149: ', 'Se quiere suscribir');
        if (!datos.email && datos.telefono) {
            console.log('eventos-promos 151: ', 'Falta email');
            agent.add(`Gracias, ¿Tienes correo electrónico para proporcionarme?`);
        } else if (datos.email && !datos.telefono) {
            console.log('eventos-promos 154: ', 'Falta telefono');
            agent.add(`Gracias, ¿Me proporcionas tu celular?`);
        } else {


            await bienvenidaResponse.despedida(agent);
        }
    }




};