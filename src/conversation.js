// Estados posibles de la conversacion por usuario.
const STATES = {
  MAIN_MENU: "MAIN_MENU",
  // 1. Comprar un libro
  BUY_ASK_BOOK: "BUY_ASK_BOOK",
  BUY_ASK_CONFIRM: "BUY_ASK_CONFIRM",
  BUY_ASK_NAME: "BUY_ASK_NAME",
  BUY_ASK_ADDRESS: "BUY_ASK_ADDRESS",
  BUY_ASK_QTY: "BUY_ASK_QTY",
  // 2. Enviar constancia de pago
  PAYMENT_ASK_PROOF: "PAYMENT_ASK_PROOF",
  // 3. Consultar mi pedido
  ORDER_ASK_DNI: "ORDER_ASK_DNI",
  ORDER_ASK_NAME: "ORDER_ASK_NAME",
  // 4. Consultar mis cuotas
  QUOTA_ASK_DNI: "QUOTA_ASK_DNI",
  QUOTA_ASK_NAME: "QUOTA_ASK_NAME",
};

// Usado por quien llama (server.js) para avisar que el mensaje entrante
// era una imagen/adjunto (ej. captura de un comprobante) y no texto.
const IMAGE_RECEIVED_TOKEN = "__IMAGEN_RECIBIDA__";

const MENU_TEXT =
  "👋 ¡Hola! Bienvenido(a) a *Consorcio Imperio Perú*.\n" +
  "Estamos aquí para ayudarte\n" +
  "¿Qué deseas hacer?\n" +
  "1. 📚 Comprar un libro\n" +
  "2. 💳 Enviar constancia de pago\n" +
  "3. 📦 Consultar mi pedido\n" +
  "4. 💰 Consultar mis cuotas\n" +
  "5. 👤 Hablar con un asesor\n" +
  "Escribe el número de la opción que necesitas 😊";

const INVALID_OPTION_TEXT =
  "No entendí tu respuesta 😅. Por favor escribe el *número* de una de las opciones (1 al 5).\n\n" +
  MENU_TEXT;

const BACK_TO_MENU_HINT = "\n\nEscribe *menu* para volver al menú principal.";

// Catalogo minimo: por ahora solo el libro en promocion activa. Mas
// adelante esto puede crecer o conectarse a un inventario real.
const CATALOG = [
  {
    id: "ultrasonido",
    keywords: [
      "ultrasonido",
      "ultrasound",
      "eco",
      "ecografia",
      "ecografía",
      "diagnostico por ultrasonido",
      "diagnóstico por ultrasonido",
    ],
    title: "Diagnóstico por Ultrasonido (6ª edición, 2 tomos)",
    price: "S/1,639",
    extra: "Incluye cargador portátil de regalo 🎁 y envío gratis 🚚.",
  },
];

const BUY_ASK_BOOK_TEXT =
  "📚 ¡Perfecto! ¿Qué libro estás buscando? Escríbeme el título o tema (ej. \"ultrasonido\")." +
  BACK_TO_MENU_HINT;

// Folleto que se envia junto con el mensaje de "libro no encontrado".
const CLEARANCE_BROCHURE = {
  urlPath: "/files/libros-en-liquidacion.pdf",
  filename: "Libros en liquidación - Consorcio Imperio Perú.pdf",
};

const PAYMENT_ASK_PROOF_TEXT =
  "💳 Perfecto. Envíame una *foto o captura* de tu comprobante de pago 📷." +
  BACK_TO_MENU_HINT;

const PAYMENT_ASK_PROOF_AGAIN_TEXT =
  "No recibí ninguna imagen 🙏. Por favor envía una *foto o captura* de tu comprobante de pago 📷." +
  BACK_TO_MENU_HINT;

const PAYMENT_RECEIVED_TEXT =
  "✅ Recibimos tu comprobante. Nuestro equipo de verificación lo revisará y te confirmará por este medio si fue validado, y si corresponde a tu *última cuota* o te indicará el *monto de la siguiente*.";

const ORDER_ASK_DNI_TEXT =
  "📦 Para consultar tu pedido necesito dos datos.\n¿Cuál es tu *DNI*?" + BACK_TO_MENU_HINT;

const QUOTA_ASK_DNI_TEXT =
  "💰 Para consultar tus cuotas necesito dos datos.\n¿Cuál es tu *DNI*?" + BACK_TO_MENU_HINT;

const ADVISOR_TEXT =
  "👤 ¡Listo! Un asesor se pondrá en contacto contigo en breve para ayudarte 🙌.";

// Botones para canales que soportan "quick replies" (Messenger, Instagram).
// El "payload" de cada uno coincide con lo que ya entiende esta logica
// (numeros 1-5 y "menu"), asi que tocar un boton equivale a escribirlo.
const MENU_QUICK_REPLIES = [
  { title: "📚 Comprar libro", payload: "1" },
  { title: "💳 Enviar pago", payload: "2" },
  { title: "📦 Mi pedido", payload: "3" },
  { title: "💰 Mis cuotas", payload: "4" },
  { title: "👤 Asesor", payload: "5" },
];

const BACK_TO_MENU_QUICK_REPLIES = [
  { title: "🔙 Menú principal", payload: "menu" },
];

function isBackToMenuCommand(text) {
  const normalized = text.trim().toLowerCase();
  return ["menu", "menú", "0", "volver"].includes(normalized);
}

function isYes(text) {
  const normalized = text.trim().toLowerCase();
  return ["si", "sí", "s", "yes", "claro", "dale", "ok"].includes(normalized);
}

function isNo(text) {
  const normalized = text.trim().toLowerCase();
  return ["no", "n"].includes(normalized);
}

function findBook(text) {
  const normalized = text.trim().toLowerCase();
  return CATALOG.find((book) =>
    book.keywords.some((keyword) => normalized.includes(keyword))
  );
}

function bookInfoText(book) {
  return (
    `📚 *${book.title}*\n` +
    `Precio: ${book.price}\n` +
    `${book.extra}\n\n` +
    "¿Quieres continuar con la compra? Responde *sí* o *no*."
  );
}

function bookNotFoundText() {
  return (
    "No encontré ese título en nuestro catálogo por ahora 😕.\n\n" +
    "Un asesor te brindará el precio y las promociones con las que contamos. " +
    "Mientras tanto, te mando nuestros libros en liquidación 📚🔥.\n\n" +
    "Escribe *menu* y elige la opción 5 (Hablar con un asesor), o intenta con otro título."
  );
}

/**
 * Logica pura del flujo de conversacion. No conoce nada de WhatsApp,
 * Messenger ni de red: recibe el estado/datos previos del usuario y su
 * mensaje (o IMAGE_RECEIVED_TOKEN si fue una imagen/adjunto), y devuelve
 * el nuevo estado junto con el texto a responder. Cuando una accion queda
 * completa (pedido, pago, consulta), la devuelve en el campo
 * correspondiente para que quien llama (server.js, que si conoce el canal
 * y el cliente) decida donde guardarla.
 *
 * @param {{state?: string, data?: object} | null | undefined} session
 * @param {string} rawText
 * @returns {{newState: string, newData: object, reply: string, completedOrder?: object, completedPayment?: boolean, completedInquiry?: object}}
 */
function handleIncomingMessage(session, rawText) {
  const text = (rawText || "").trim();
  const currentState = session && session.state;
  const currentData = (session && session.data) || {};

  // Primer contacto: saludo + menu, sin importar que haya escrito.
  if (!currentState) {
    return { newState: STATES.MAIN_MENU, newData: {}, reply: MENU_TEXT };
  }

  if (currentState === STATES.MAIN_MENU) {
    switch (text) {
      case "1":
        return { newState: STATES.BUY_ASK_BOOK, newData: {}, reply: BUY_ASK_BOOK_TEXT };
      case "2":
        return { newState: STATES.PAYMENT_ASK_PROOF, newData: {}, reply: PAYMENT_ASK_PROOF_TEXT };
      case "3":
        return { newState: STATES.ORDER_ASK_DNI, newData: {}, reply: ORDER_ASK_DNI_TEXT };
      case "4":
        return { newState: STATES.QUOTA_ASK_DNI, newData: {}, reply: QUOTA_ASK_DNI_TEXT };
      case "5":
        return { newState: STATES.MAIN_MENU, newData: {}, reply: ADVISOR_TEXT };
      default:
        return { newState: STATES.MAIN_MENU, newData: {}, reply: INVALID_OPTION_TEXT };
    }
  }

  // "menu" funciona como salida de emergencia desde cualquier sub-flujo.
  if (isBackToMenuCommand(text)) {
    return { newState: STATES.MAIN_MENU, newData: {}, reply: MENU_TEXT };
  }

  switch (currentState) {
    case STATES.BUY_ASK_BOOK: {
      const book = findBook(text);
      if (!book) {
        return {
          newState: STATES.BUY_ASK_BOOK,
          newData: currentData,
          reply: bookNotFoundText(),
          attachment: CLEARANCE_BROCHURE,
        };
      }
      return {
        newState: STATES.BUY_ASK_CONFIRM,
        newData: { ...currentData, bookTitle: book.title },
        reply: bookInfoText(book),
      };
    }

    case STATES.BUY_ASK_CONFIRM: {
      if (isYes(text)) {
        return {
          newState: STATES.BUY_ASK_NAME,
          newData: currentData,
          reply: "Perfecto 🙌 Para registrar tu pedido, dime tu *nombre completo*.",
        };
      }
      if (isNo(text)) {
        return {
          newState: STATES.MAIN_MENU,
          newData: {},
          reply: "Entendido, sin problema 🙂.\n\n" + MENU_TEXT,
        };
      }
      return {
        newState: STATES.BUY_ASK_CONFIRM,
        newData: currentData,
        reply: `Por favor responde *sí* o *no*. ¿Quieres continuar con la compra de *${currentData.bookTitle}*?`,
      };
    }

    case STATES.BUY_ASK_NAME: {
      if (!text) {
        return {
          newState: STATES.BUY_ASK_NAME,
          newData: currentData,
          reply: "No recibí tu nombre 🙏. ¿Cuál es tu *nombre completo*?",
        };
      }
      return {
        newState: STATES.BUY_ASK_ADDRESS,
        newData: { ...currentData, name: text },
        reply: `Gracias, ${text} 🙌. Ahora dime tu *dirección de entrega* (calle, distrito, ciudad).`,
      };
    }

    case STATES.BUY_ASK_ADDRESS: {
      if (!text) {
        return {
          newState: STATES.BUY_ASK_ADDRESS,
          newData: currentData,
          reply: "No recibí la dirección 🙏. ¿Cuál es tu *dirección de entrega*?",
        };
      }
      return {
        newState: STATES.BUY_ASK_QTY,
        newData: { ...currentData, address: text },
        reply: "¿Cuántos ejemplares deseas? (escribe solo el número, ej. 1)",
      };
    }

    case STATES.BUY_ASK_QTY: {
      const qty = parseInt(text, 10);
      if (!Number.isInteger(qty) || qty <= 0) {
        return {
          newState: STATES.BUY_ASK_QTY,
          newData: currentData,
          reply: "Por favor escribe solo el número de ejemplares que deseas (ej. 1, 2, 3...).",
        };
      }
      return {
        newState: STATES.MAIN_MENU,
        newData: {},
        reply:
          `✅ ¡Listo, ${currentData.name}! Registramos tu pedido de ${qty} ejemplar(es) de *${currentData.bookTitle}* ` +
          `para: ${currentData.address}.\n` +
          "Nos pondremos en contacto para coordinar el pago y el envío. Si ya tienes tu comprobante, puedes mandarlo con la opción 2 (Enviar constancia de pago).",
        completedOrder: {
          book: currentData.bookTitle,
          name: currentData.name,
          address: currentData.address,
          qty,
        },
      };
    }

    case STATES.PAYMENT_ASK_PROOF: {
      if (text !== IMAGE_RECEIVED_TOKEN) {
        return { newState: STATES.PAYMENT_ASK_PROOF, newData: currentData, reply: PAYMENT_ASK_PROOF_AGAIN_TEXT };
      }
      return {
        newState: STATES.MAIN_MENU,
        newData: {},
        reply: PAYMENT_RECEIVED_TEXT,
        completedPayment: true,
      };
    }

    case STATES.ORDER_ASK_DNI:
    case STATES.QUOTA_ASK_DNI: {
      if (!text) {
        return {
          newState: currentState,
          newData: currentData,
          reply: "No recibí tu DNI 🙏. ¿Cuál es tu *DNI*?",
        };
      }
      const nextState =
        currentState === STATES.ORDER_ASK_DNI ? STATES.ORDER_ASK_NAME : STATES.QUOTA_ASK_NAME;
      return {
        newState: nextState,
        newData: { ...currentData, dni: text },
        reply: "Gracias. Ahora dime tu *nombre completo*.",
      };
    }

    case STATES.ORDER_ASK_NAME:
    case STATES.QUOTA_ASK_NAME: {
      if (!text) {
        return {
          newState: currentState,
          newData: currentData,
          reply: "No recibí tu nombre 🙏. ¿Cuál es tu *nombre completo*?",
        };
      }
      const type = currentState === STATES.ORDER_ASK_NAME ? "pedido" : "cuotas";
      const topic = type === "pedido" ? "tu pedido" : "tus cuotas";
      return {
        newState: STATES.MAIN_MENU,
        newData: {},
        reply: `✅ Recibimos tu consulta (DNI ${currentData.dni}, ${text}). Revisaremos ${topic} y te responderemos por este mismo medio en breve.`,
        completedInquiry: { type, dni: currentData.dni, name: text },
      };
    }

    default:
      return { newState: STATES.MAIN_MENU, newData: {}, reply: MENU_TEXT };
  }
}

module.exports = {
  STATES,
  MENU_TEXT,
  MENU_QUICK_REPLIES,
  BACK_TO_MENU_QUICK_REPLIES,
  IMAGE_RECEIVED_TOKEN,
  handleIncomingMessage,
};
