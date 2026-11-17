require("dotenv").config();
const path = require("path");
const express = require("express");
const {
  STATES,
  handleIncomingMessage,
  MENU_QUICK_REPLIES,
  BACK_TO_MENU_QUICK_REPLIES,
  IMAGE_RECEIVED_TOKEN,
} = require("./conversation");
const { getSession, setSession } = require("./sessionStore");
const whatsapp = require("./whatsapp");
const metaMessaging = require("./metaMessaging");
const ordersStore = require("./ordersStore");
const paymentsStore = require("./paymentsStore");
const inquiriesStore = require("./inquiriesStore");

const app = express();
app.use(express.json());
// Archivos publicos (folletos, etc.) que se envian como adjuntos; Meta los
// descarga de su URL publica, no se los podemos subir directo en el chat.
app.use("/files", express.static(path.join(__dirname, "..", "public")));

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
// URL publica de este servidor (ej. https://consorcio-bot.onrender.com),
// necesaria para construir enlaces absolutos a los archivos de /files.
const BASE_URL = process.env.BASE_URL;

// Solo para Messenger/Instagram: mientras WhatsApp no este disponible,
// se invita a los clientes a escribir alli para atencion mas rapida.
const WHATSAPP_QUICK_CONTACT_NOTE =
  "\n\n⚡ ¿Prefieres atención más rápida? Escríbenos directo a nuestro WhatsApp: 941 558 501.";

// Meta llama a este endpoint UNA VEZ para verificar el webhook cuando lo
// configuras en el panel de developers.facebook.com.
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verificado correctamente.");
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Meta envia aqui cada mensaje entrante del cliente, sin importar el canal
// (WhatsApp, Messenger o Instagram). El campo "object" del body indica cual es.
app.post("/webhook", async (req, res) => {
  // Respondemos 200 de inmediato: Meta solo necesita saber que recibimos
  // el evento, no espera a que terminemos de procesarlo.
  res.sendStatus(200);

  try {
    const { object } = req.body || {};

    if (object === "whatsapp_business_account") {
      await handleWhatsAppEvent(req.body);
    } else if (object === "page" || object === "instagram") {
      await handleMetaMessagingEvent(req.body, object);
    }
  } catch (err) {
    console.error("Error procesando mensaje entrante:", err.message);
  }
});

// Guarda en el store que corresponda cualquier accion que haya quedado
// completa en este turno de la conversacion (pedido, pago o consulta).
function persistCompletedAction(channel, customerId, result) {
  if (result.completedOrder) {
    ordersStore.appendOrder({ channel, customerId, ...result.completedOrder });
  }
  if (result.completedPayment) {
    paymentsStore.appendPayment({ channel, customerId });
  }
  if (result.completedInquiry) {
    inquiriesStore.appendInquiry({ channel, customerId, ...result.completedInquiry });
  }
}

// Si la conversacion pidio mandar un archivo (ej. folleto de liquidacion),
// construye la URL publica completa a partir de BASE_URL.
function attachmentUrl(attachment) {
  if (!attachment || !BASE_URL) return null;
  return `${BASE_URL}${attachment.urlPath}`;
}

function extractWhatsAppText(message) {
  if (message.type === "image" || message.type === "document") {
    return IMAGE_RECEIVED_TOKEN;
  }
  return message.text?.body || "";
}

async function handleWhatsAppEvent(body) {
  const entry = body?.entry?.[0];
  const change = entry?.changes?.[0]?.value;
  const message = change?.messages?.[0];

  if (!message) {
    // Puede ser un evento de "status" (entregado/leido), lo ignoramos.
    return;
  }

  const from = message.from; // numero del cliente
  const text = extractWhatsAppText(message);
  const sessionKey = `whatsapp:${from}`;

  const session = getSession(sessionKey);
  const result = handleIncomingMessage(session, text);
  setSession(sessionKey, { state: result.newState, data: result.newData });
  persistCompletedAction("whatsapp", from, result);

  await whatsapp.sendText(from, result.reply);

  const fileUrl = attachmentUrl(result.attachment);
  if (fileUrl) {
    await whatsapp.sendDocument(from, fileUrl, result.attachment.filename);
  }
}

function extractMetaMessagingText(message) {
  if (message?.attachments?.length) {
    return IMAGE_RECEIVED_TOKEN;
  }
  return message?.quick_reply?.payload || message?.text || "";
}

// Messenger e Instagram comparten el mismo formato de evento ("messaging").
async function handleMetaMessagingEvent(body, channel) {
  const entry = body?.entry?.[0];
  const messagingEvent = entry?.messaging?.[0];
  const senderId = messagingEvent?.sender?.id;
  // Si el cliente toco un boton (quick reply) usamos su payload; si mando
  // una imagen/adjunto lo tratamos como comprobante; si no, su texto.
  const text = extractMetaMessagingText(messagingEvent?.message);

  if (!senderId || !text) {
    // Eventos sin contenido util (entregado/leido, etc.), los ignoramos.
    return;
  }

  const sessionKey = `${channel}:${senderId}`;

  const session = getSession(sessionKey);
  const result = handleIncomingMessage(session, text);
  setSession(sessionKey, { state: result.newState, data: result.newData });
  persistCompletedAction(channel, senderId, result);

  const isMainMenu = result.newState === STATES.MAIN_MENU;
  const finalReply = isMainMenu ? result.reply + WHATSAPP_QUICK_CONTACT_NOTE : result.reply;
  const quickReplies = isMainMenu ? MENU_QUICK_REPLIES : BACK_TO_MENU_QUICK_REPLIES;

  await metaMessaging.sendText(senderId, finalReply, quickReplies);

  const fileUrl = attachmentUrl(result.attachment);
  if (fileUrl) {
    await metaMessaging.sendFile(senderId, fileUrl);
  }
}

app.get("/", (_req, res) => {
  res.send("Bot de WhatsApp - Consorcio Imperio Perú: OK");
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
