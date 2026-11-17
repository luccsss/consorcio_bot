const axios = require("axios");

const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || "v21.0";

function getConfig() {
  const phoneNumberId = process.env.PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;
  if (!phoneNumberId || !token) {
    throw new Error(
      "Faltan PHONE_NUMBER_ID y/o WHATSAPP_TOKEN en el archivo .env"
    );
  }
  return { phoneNumberId, token };
}

/**
 * Envia un mensaje de texto plano a un numero de WhatsApp via
 * la WhatsApp Business Cloud API de Meta.
 * @param {string} to Numero destino en formato E.164 sin "+" (ej. "51999999999").
 * @param {string} body Texto del mensaje.
 */
async function sendText(to, body) {
  const { phoneNumberId, token } = getConfig();
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;

  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Envia un documento (PDF, etc.) por su URL publica.
 * @param {string} to Numero destino en formato E.164 sin "+" (ej. "51999999999").
 * @param {string} fileUrl URL publica y accesible del archivo.
 * @param {string} [filename] Nombre de archivo sugerido.
 */
async function sendDocument(to, fileUrl, filename) {
  const { phoneNumberId, token } = getConfig();
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;

  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to,
      type: "document",
      document: { link: fileUrl, filename },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
}

module.exports = { sendText, sendDocument };
