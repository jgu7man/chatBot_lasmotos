/*jshint sub:true*/

const { Card, Suggestion } = require('dialogflow-fulfillment');
const webhookActions = require('../actions/webhook');

async function FAQs(agent) {

    const
        params = agent.parameters;

    var saludo = '';
    var solicitudDatos = '';
    if (params.nombre) {
        saludo = `Hola ${params.nombre}, soy Nancy, una asistente de Tienda Las motos.`;
    } else if (params.nombre && horarioDia) {
        saludo = `Hola, ${params.horarioDia}, ${params.nombre}, soy Nancy, una asistente de Tienda Las motos.`;
    } else if (params.horarioDia) {
        saludo = `Hola ${params.horarioDia}, soy Nancy, una asistente de Tienda Las motos.`;
    } else {
        saludo = `Hola, soy Nancy, una asistente de Tienda Las motos`;
    }



    if (params.consultaHorario) {
        agent.add(`${saludo} 
        Abrimos de lunes a sábados de 7:00 a las 7:30 (excepto lunes festivos que no abrimos)`);


    } else if (params.consultaTelefono) {
        agent.add(`${saludo} 
        Nuestro número de contacto es 3008603210, igualmente.`);
        agent.context.set({ name: 'llamada', lifespan: 2 });

    } else if (params.consultaSitioweb) {
        agent.add(new Card({
            title: saludo,
            text: `Nuestra página web es tiendalasmotos.com.co. Nuestro número de contacto es 3008603210 en caso de que desees llamarnos.`,
            imageUrl: '',
            buttonText: 'visitar página',
            buttonUrl: 'https://tiendalasmotos.com.co'
        }));
        agent.context.set({ name: 'consultaSitioweb', lifespan: 2 });

    } else if (params.consultaMarcas) {
        agent.add(`${saludo} 
        Manejamos todas las motos comercializadas por Auteco (boxer, discover, pulsar, Kymco, Kawasaki, dominar, victory, starker y piaggio).`);

        // Respuesta: Máximo 3 CARDS de las 3 principales motos usadas registradas en el inventario
    } else if (params.consultaUsadas) {
        console.log('bienvenida 58: ', 'Responde moto usada');
        await motosResponse.infoMotosUsadas(agent);

    } else if (params.consultaSOAT) {
        agent.add(`${saludo} 
        Actualmente sólo vendemos SOAT en algunas de nuestras motos nuevas, pero estamos trabajando en conseguir un convenio para ofrecer este servicio.`);


    } else if (params.consultaCiudad) {
        agent.add(`${saludo} 
        En Gaira y/o Santa Marta (Magdalena), estamos ubicados en la Carrera 4 # 20-45 Gaira, Rodadero, al frente del Mac Pollo de Gaira (incluye foto del local)
        En Riohacha (La Guajira), estamos ubicados en la Diagonal a la terminal de transporte (incluye foto del local)
        `);


    }

    if (!params.nombre) {
        agent.add('Disculpa ¿Con quién tengo el gusto?');
        agent.context.set({ name: 'getNombre', lifespan: 2 });
    } else {
        agent.add('¿Deseas que te colabore con algo en especial?');
        await webhookActions.opciones(agent);
    }
}

module.exports = FAQs;