/*jshint sub:true*/
/* jshint esversion: 8 */
// /* jshint ignore:start */

const { Card, Suggestion, Text } = require('dialogflow-fulfillment');
const fsActions = require('../actions/firestore');
const webhookActions = require('../actions/webhook');
const datosDoc = require('../intents/guardarDatos');

const cupoBrillaRequisitos = `
Con cupo BRILLA los requisitos serían: \n\n
1) Las dos últimas facturas originales pagadas (no duplicados)\n\n
2) Tu cédula\n\n
3) Y que el solicitante sea el titular de la factura.
`;

exports.reportadoQuestion = async(agent) => {
    reportado = agent.parameters.reportado;
    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
        if (!reportado && datos) { reportado = datos.reportado; }
    }

    var sucursal;

    if (reportado == 'SI' && datos.ciudad == 'Santa Marta') {
        agent.add(`Te podemos ofrecer la posibilidad de crédito con dos opciones: `);
        agent.add(new Text(cupoBrillaRequisitos));
        agent.add(`o podrías optar por un estudio en linea.`);
        agent.add(`¿Estarías interesad@ en un estudio en línea?`);

        agent.context.set({ name: 'estudioEnLinea', lifespan: 5 });
        agent.context.set({ name: 'Reportado-followup', lifespan: 10 });
        agent.context.delete('preguntarreportado');



    } else if (reportado == 'SI' && datos.ciudad == 'Riohacha') {
        sucursal = await fsActions.getSucursal(datos.ciudad);
        agent.add(`Te podemos ofrecer la posibilidad de crédito con cupo BRLLA. `);
        agent.add(new Text(cupoBrillaRequisitos));
        agent.add(`Te invitamos a que pases a nuestra dirección en: ${sucursal. direccion}`);
        agent.add(`¿Estarías interesad@ en alguna otra información?`);

        await webhookActions.opciones(agent);



    } else if (reportado == 'NO') {
        agent.add(`Debes tener cédula, correo electrónico y contestar personalmente la llamada que te realizaremos. ¿Sería posible?`);

        agent.context.set({ name: 'llamada', lifespan: 10 });
        agent.context.delete('preguntarreportado');


    } else {
        agent.add(`¿Podrías decirme si estás reportado?`);
        agent.context.set({ name: 'preguntarreportado', lifespan: 2 });
    }
};


exports.estudioEnLinea = async(agent) => {
    const action = agent.action;
    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
    } else {
        datos = { nombre: '' };
    }

    if (action == 'estudio-yes') {
        agent.add(`Muy bien, entonces necesito saber si estás reportad@ por:`);

        agent.add(new Suggestion(`Banco`));
        agent.add(new Suggestion(`Otra entidad`));



    } else if (action == 'estudio-no') {
        agent.add(`Bueno Sr@ ${datos.nombre} ¿Estarías interesad@ en alguna otra información?`);

        await webhookActions.opciones(agent);



    } else {
        console.warn('No action');
    }
};

exports.entidadReporta = async(agent) => {
    var entidadReporta = agent.parameters['EntidadReporta'];
    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
        if (!entidadReporta && datos) { entidadReporta = datos.entidadReporta; }
    } else {
        datos = { nombre: '' };
    }

    if (entidadReporta == 'Banco') {
        console.log('creditoInfo 92: ', 'Reportado por banco');

        agent.add(`Lo siento, Sr@ ${datos.nombre}. No sería posible un eventual crédito por que su reporte es por un banco. Espero que te pueda servir cupo brilla.`);
        agent.add(`¿Te puedo ayudar con otra información?`);

        await webhookActions.opciones(agent);



    } else {
        console.log('creditoInfo 101: ', 'Reportado por otro');
        agent.add(`¿Cuál es el valor de la deuda?`);
        agent.add(new Suggestion(`Menor a 1 millon`));
        agent.add(new Suggestion(`Mayor a 1 millon`));
        agent.add(new Suggestion(`No lo sé`));
    }
};

exports.valorAdeudo = async(agent) => {
    var adeudoString = agent.parameters['adeudoString'],
        adeudoNumber = agent.parameters['adeudoNumber'],
        unknow = agent.parameters['unknow'],
        cantidad = parseInt(adeudoNumber);
    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
    } else {
        datos = { nombre: '' };
    }

    if (adeudoNumber) {
        if (cantidad <= 1000000) {
            adeudoString = 'menor';
        } else {
            adeudoString = 'mayor';
        }
    }

    if (adeudoString == 'menor') {
        console.log('creditoInfo 126: ', 'adeudo menor a 1 millon');
        agent.add(`Muy bien Sr@ ${datos.nombre} Debes tener cédula, correo electrónico y contestar personalmente la llamada que te realizaremos. ¿Sería posible?`);

        agent.context.set({ name: 'llamada', lifespan: 10 });
        await webhookActions.borrarContextos(agent);



    } else if (adeudoString == 'mayor') {
        console.log('creditoInfo 135: ', 'adeudo mayor a 1 millon');
        agent.add(`Los siento, Sr@ ${datos.nombre}. Por ser la deuda mayor a 1 millón, sólo te podemos ofrecer, la posibilidad de crédito con cupo brilla.`);
        agent.add(`¿Cuentas con los requisitos para aplicar con cupo brilla?`);



        agent.context.set({ name: 'requisitos', lifespan: 2 });



    } else if (unknow) {
        agent.add(`No te preocupes, Sr@ ${datos.nombre}. Te podemos ayudar a averiguar.`);
        agent.add(`Debes tener cédula, correo electrónico y contestar personalmente la llamada que te realizaremos. ¿Sería posible?`);

        agent.context.set({ name: 'llamada', lifespan: 10 });
        await webhookActions.borrarContextos(agent);



    } else {
        agent.add(`Si lo deseas te podemos atender vía telefónica. ¿Deseas que te llamemos?`);

        agent.context.set({ name: 'llamada', lifespan: 10 });
        await webhookActions.borrarContextos(agent);
    }
};

exports.cumpleRequisitosCupobrilla = async(agent) => {
    const action = agent.action;
    var datosCont = agent.context.get('datos');
    var datos;
    if (datosCont) {
        datos = datosCont.parameters;
    } else {
        await datosDoc.revisionDatos(agent);
    }
    var sucursal;


    if (action == 'cumpleRequisitos-yes') {
        console.log('creditoInfo 172: ', 'Cumple con los requisitos de cupobrilla');
        sucursal = await fsActions.getSucursal(datos.ciudad);
        agent.add(`Entonces te invito a que traigas tus documentos a nuestra sede en ${sucursal.direccion} para poder tener el gusto de atenderte.`);


    } else if (action == 'cumpleRequisitos-no') {
        console.log('creditoInfo 178: ', 'No cumple con los requisitos de cupobrilla');
        agent.add(`Te invito a que nos contactes nuevamente cuando tu deuda baje del millón, para poder ayudarte.`);

    } else {
        console.log('creditoInfo 172: ', 'Recuerda requisitos de cupobrilla');
        agent.add(new Text(cupoBrillaRequisitos));
        sucursal = await fsActions.getSucursal(datos.ciudad);
        agent.add(`Si cumples con estos requisitos, te esperamos en ${sucursal.ciudad} para tramitar tu crédito.`);
    }

    agent.add(`Te gustaría recibir más información sobre:`);
    await webhookActions.opciones(agent);
};