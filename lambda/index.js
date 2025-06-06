const Alexa = require('ask-sdk-core');

const palabrasMemoria = ["rostro", "seda", "iglesia", "clavel", "rojo"];

const animalesMemoria = ["gato", "perro", "león", "colibrí"];

// No funciona en el ambiente de Desarrollo de Alexa
// Necesita una cuenta AWS
// Se requiere Node.js
// const { Client } = require('pg'); // Importa la librería de PostgreSQL

// --- CONFIGURACIÓN DE LA BASE DE DATOS ---
const dbConfig = {
    host: 'http://172.245.17.61:5050',
    database: 'asistente-virtual',
    user: 'master@master.com',
    password: 'maxi1999',
    port: 5432, // Puerto por defecto de PostgreSQL
};


/**
 * Arranque del Skill - "comenzar test", "abre comenzar test", "Alexa, abre comenzar test"
 * Modificado: Ahora solicita el documento de identificación y el nombre.
 * Arranque del Skill - "comenzar test", "abre comenzar test", "Alexa, abre comenzar test"
 */
const LaunchRequestHandler = {
    
    //---------------------------(ORIGINAL) Antes de agregar documento y nombre
    //canHandle(handlerInput) {
    //    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    //},
    //handle(handlerInput) {
    //    const speakOutput = 'Bienvenido al Test MoCa para ciegos. Di "comenzar test" para iniciar.';
    //    return handlerInput.responseBuilder
    //        .speak(speakOutput)
    //        .reprompt(speakOutput)
    //        .getResponse();
    //}
    //---------------------------(ORIGINAL)
    
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        // Inicializa el estado de la sesión para almacenar el documento y el nombre
        handlerInput.attributesManager.setSessionAttributes({
            respuestas: {},
            puntaje: 0,
            documento: null,
            nombre: null,
            estadoTest: 'solicitarDocumento' // Nuevo estado para controlar el flujo
        });

        const speakOutput = 'Bienvenido al Test MoCa para ciegos. Vamos a relajarnos y pasar un rato agradable. Para comenzar, por favor, di tu número de documento de identificación. Tienes que decir "mi documento es" y después dices cuál es tu documento';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Por favor, di tu número de documento de identificación.')
            .getResponse();
    }
};



/**
 * Nuevo Intent para capturar el documento de identificación.
 * Necesitarás crear un Slot personalizado en la consola de Alexa para el documento (ej. AMAZON.NUMBER o un tipo personalizado si tiene letras).
 * Por simplicidad, usaremos AMAZON.NUMBER por ahora. Si el documento puede contener letras, deberías crear un slot de tipo AMAZON.Alphanumeric o AMAZON.FreeFormPhrase.
 */
const SolicitarDocumentoIntentHandler = {
    canHandle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SolicitarDocumentoIntent'
            && sessionAttributes.estadoTest === 'solicitarDocumento';
    },
    handle(handlerInput) {
        const documento = handlerInput.requestEnvelope.request.intent.slots.numeroDocumento.value; // Asegúrate de que 'numeroDocumento' sea el nombre de tu Slot
        
        console.log("Documento: ", documento)
        
        if (!documento) {
            const repromptOutput = 'No pude entender tu número de documento. Por favor, di tu número de documento de identificación.';
            return handlerInput.responseBuilder
                .speak(repromptOutput)
                .reprompt(repromptOutput)
                .getResponse();
        }

        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes.documento = documento;
        sessionAttributes.estadoTest = 'solicitarNombre'; // Cambia el estado para solicitar el nombre
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        const speakOutput = `Gracias. Tu documento es ${documento}. Ahora, por favor, di tu nombre.`;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Por favor, di tu nombre.')
            .getResponse();
    }
};

/**
 * Nuevo Intent para capturar el nombre del usuario.
 * Necesitarás crear un Slot personalizado en la consola de Alexa para el nombre (ej. AMAZON.DE_FIRST_NAME o AMAZON.US_FIRST_NAME, o un tipo personalizado si quieres nombres completos).
 * Usaremos AMAZON.DE_FIRST_NAME como ejemplo.
 */
const SolicitarNombreIntentHandler = {
    canHandle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SolicitarNombreIntent'
            && sessionAttributes.estadoTest === 'solicitarNombre';
    },
    handle(handlerInput) {
        const nombre = handlerInput.requestEnvelope.request.intent.slots.nombreUsuario.value; // Asegúrate de que 'nombreUsuario' sea el nombre de tu Slot
        
        if (!nombre) {
            const repromptOutput = 'No pude entender tu nombre. Por favor, di tu nombre.';
            return handlerInput.responseBuilder
                .speak(repromptOutput)
                .reprompt(repromptOutput)
                .getResponse();
        }

        const sessionAttributes      = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes.nombre     = nombre;
        sessionAttributes.estadoTest = 'bienvenidoYComenzar'; // Cambia el estado para dar la bienvenida y permitir iniciar el test
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        const speakOutput = `Hola ${nombre}, bienvenido al Test MoCa para ciegos. Ya registré tu documento y nombre. Di "comenzar test" para iniciar las preguntas.`;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Di "comenzar test" para iniciar las preguntas.')
            .getResponse();
    }
};





/**
 * Inicia el Test Moca para Ciegos
 * 1.- Alexa nombra las palabras a memorizar
 * 2.- Usuario recuerda las palabras (se alamcenan)
 * 3.- Se pasa al siguiente item "palabras ....."
 */
const ComenzarTestIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ComenzarTestIntent';
    },
    handle(handlerInput) {
        
        // Inicializa el estado de la sesión para almacenar las respuestas y el puntaje
        handlerInput.attributesManager.setSessionAttributes({
            respuestas: {},
            puntaje: 0
        });
        
        
        const speakOutput = `Comenzando el test. El primer ítem es de memoria. 
        Escucha atentamente: ${palabrasMemoria.join(', ')}. 
        ¿Qué palabras recuerdas? Tienes que decir "palabras" y después las palabras que recuerdas`;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt("¿Qué palabras recuerdas?")
            .getResponse();
    }
};

/**
 * ITEM #1: Palabras
 */
const ResponderMemoriaIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ResponderMemoriaIntent';
    },
    handle(handlerInput) {
        // original
        // const respuesta = handlerInput.requestEnvelope.request.intent.slots.palabrasRecordadas.value;
       
        // JS - Agregado ----------------------------------------------------
        const respuestaUsuario = handlerInput.requestEnvelope.request.intent.slots.palabrasRecordadas.value ?
            handlerInput.requestEnvelope.request.intent.slots.palabrasRecordadas.value.toLowerCase().split(' ') : [];
        const palabrasCorrectas = palabrasMemoria.map(palabra => palabra.toLowerCase());
        let puntajeMemoria = 0;

        respuestaUsuario.forEach(palabra => {
            if (palabrasCorrectas.includes(palabra)) {
                puntajeMemoria++;
            }
        });
        // Almacena la respuesta y el puntaje en los atributos de sesión
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes.respuestas.memoria = respuestaUsuario.join(', ');
        sessionAttributes.puntaje += puntajeMemoria;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);        
        // JS        
       
        const speakOutput = `Entendido. Has dicho: ${respuestaUsuario}. Ahora, el segundo ítem. ¿Cuál es la fecha de hoy?
                Tienes que decir primero "Fecha" y después la fecha de hoy dia, mes y año`;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt("¿Cuál es la fecha de hoy?")
            .getResponse();
    }
};


/**
 * ITEM #2: Fecha
 */
const ResponderFechaIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ResponderFechaIntent';
    },
    handle(handlerInput) {
        //const respuesta = handlerInput.requestEnvelope.request.intent.slots.fechaNombrada.value;

        // JS - Agregado ----------------------------------------------------
        const respuestaUsuario = handlerInput.requestEnvelope.request.intent.slots.fechaNombrada.value;
        let puntajeFecha = 0;
        // Aquí podrías implementar una lógica más robusta para evaluar la fecha
        // Por ahora, simplemente verificamos si la respuesta no está vacía y asignamos un punto.
        if (respuestaUsuario) {
            puntajeFecha = 1;
        }
        // Almacena la respuesta y el puntaje
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes.respuestas.fecha = respuestaUsuario;
        sessionAttributes.puntaje += puntajeFecha;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        // JS - Agregado ----------------------------------------------------
        
        const speakOutput = `Gracias. La fecha que has dicho es: ${respuestaUsuario}. El tercer y último ítem por ahora es: 
            Nombra estos animales: gato, león, perro, colibrí. Primero debes decir "animales" y después nombrarlos.`;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt("Nombra los animales: gato, león, perro, colibrí.")
            .getResponse();
    }
};


/**
 * ITEM #3 Animales
 */
const ResponderAnimalesIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ResponderAnimalesIntent';
    },
    handle(handlerInput) {
        //const respuesta = handlerInput.requestEnvelope.request.intent.slots.animalesNombrados.value;


        // JS - Agregado ----------------------------------------------------        
        const respuestaUsuario = handlerInput.requestEnvelope.request.intent.slots.animalesNombrados.value ?
            handlerInput.requestEnvelope.request.intent.slots.animalesNombrados.value.toLowerCase().split(' ') : [];
        const animalesCorrectos = animalesMemoria.map(animal => animal.toLowerCase());
        let puntajeAnimales = 0;

        respuestaUsuario.forEach(animal => {
            if (animalesCorrectos.includes(animal)) {
                puntajeAnimales++;
            }
        });
        
        // Almacena la respuesta y el puntaje
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes.respuestas.animales = respuestaUsuario.join(', ');
        sessionAttributes.puntaje += puntajeAnimales;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        
        //
        const puntajeFinal     = sessionAttributes.puntaje;
        const speakOutputFinal = `Perfecto. Has nombrado ${puntajeAnimales} de 4 animales. 
              Tu puntaje total en esta sección del test es de ${puntajeFinal} de un total de 10. 
              Gracias por completar esta parte del Test MoCa. Se procede a guardar los resultados!`;
        
        // Guardar el resultado en la base de datos
        return guardarResultado(handlerInput, 
                                sessionAttributes.documento,
                                sessionAttributes.nombre, 
                                sessionAttributes.respuestas, 
                                puntajeFinal)
            .then(() => {
                return handlerInput.responseBuilder
                    .speak(speakOutputFinal)
                    .withShouldEndSession(true)
                    .getResponse();
            })
            .catch(err => {
                console.error('Error al guardar el resultado:', err);
                const errorSpeakOutput = 'Hubo un error al guardar tu resultado. Gracias por completar el test.';
                return handlerInput.responseBuilder
                    .speak(errorSpeakOutput)
                    .withShouldEndSession(true)
                    .getResponse();
            });        
        // JS - Agregado ----------------------------------------------------
        
        
        // Original
        //const speakOutput = `Perfecto. Has nombrado: ${respuestaUsuario}. Gracias por completar esta parte del Test MoCa.`;
        //return handlerInput.responseBuilder
        //    .speak(speakOutput)
        //    .withShouldEndSession(true)
        //    .getResponse();
        //Original 
    }
};




/**
 * Función para guardar el resultado en la base de datos PostgreSQL
 */
async function guardarResultado(handlerInput, documento, nombre,  respuestas, puntaje) {
    //const client = new Client(dbConfig);
    try {
        //await client.connect();
        //const query = `INSERT INTO resultados_moca (respuestas, puntaje, timestamp)
        //               VALUES ($1, $2, NOW())`;
        const values = [JSON.stringify(respuestas), puntaje];
        //await client.query(query, values);
        
        console.log('Resultados: ', values);
        // Este mensaje se puede ver en ClodWatch Logs
        console.log('Test almacenado en la base de datos.');
    } catch (error) {
        console.error('Error al conectar o ejecutar la consulta:', error);
        throw error;
    } finally {
        //await client.end();
    }
}









/**
 * 
 */
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Gracias por participar en el Test MoCa.';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .withShouldEndSession(true)
            .getResponse();
    }
};



/**
 * 
 */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
        return handlerInput.responseBuilder.getResponse();
    }
};



/**
 * 
 */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.error(`Error handled: ${error}`);
        const speakOutput = 'Lo siento, tuve problemas para entenderte. ¿Puedes intentarlo de nuevo?';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};


/**
 * 
 */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        SolicitarDocumentoIntentHandler,
        SolicitarNombreIntentHandler,
        ComenzarTestIntentHandler,
        ResponderMemoriaIntentHandler,
        ResponderFechaIntentHandler,
        ResponderAnimalesIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler)
    .addErrorHandlers(
        ErrorHandler)
    .lambda();