const csvStore = require("./csvStore");

// Consultas de "mi pedido" o "mis cuotas": el bot solo recolecta DNI y
// nombre; esta fila es para que el area correspondiente responda.
const HEADER = "fecha,canal,cliente_id,tipo,dni,nombre\n";

/**
 * @param {{channel: string, customerId: string, type: "pedido"|"cuotas", dni: string, name: string}} inquiry
 */
function appendInquiry(inquiry) {
  csvStore.appendRow("consultas.csv", HEADER, [
    new Date().toISOString(),
    inquiry.channel,
    inquiry.customerId,
    inquiry.type,
    inquiry.dni,
    inquiry.name,
  ]);
}

module.exports = { appendInquiry };
