const axios = require("axios");

// Mensajero (Messenger) e Instagram Direct comparten la misma API de envio
// (Send API), autenticada con el token de acceso de la Pagina de Facebook
// vinculada. Por eso un solo modulo sirve para ambos canales.
const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || "v21.0";

function getPageToken() {
  const token = process.env.PAGE_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Falta PAGE_ACCESS_TOKEN en el archivo .env");
  }
  return token;
}

/**
 * Envia un mensaje de texto a un usuario de Messenger o Instagram.
 * @param {string} recipientId PSID (Messenger) o IGSID (Instagram) del destinatario.
 * @param {string} body Texto del mensaje.
 * @param {{title: string, payload: string}[]} [quickReplies] Botones opcionales.
 */
async function sendText(recipientId, body, quickReplies) {
  const token = getPageToken();
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages`;

  const message = { text: body };
  if (quickReplies && quickReplies.length) {
    message.quick_replies = quickReplies.map((qr) => ({
      content_type: "text",
      title: qr.title,
      payload: qr.payload,
    }));
  }

  await axios.post(
    url,
    {
      recipient: { id: recipientId },
      messaging_type: "RESPONSE",
      message,
    },
    { params: { access_token: token } }
  );
}

module.exports = { sendText };
