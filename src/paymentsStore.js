const csvStore = require("./csvStore");

// Registra que un cliente dijo haber enviado su comprobante de pago. La
// imagen en si queda en el chat (WhatsApp/Messenger/Instagram); esta fila
// es solo el aviso para que el area de verificacion sepa que debe revisarla.
const HEADER = "fecha,canal,cliente_id\n";

/**
 * @param {{channel: string, customerId: string}} payment
 */
function appendPayment(payment) {
  csvStore.appendRow("pagos.csv", HEADER, [
    new Date().toISOString(),
    payment.channel,
    payment.customerId,
  ]);
}

module.exports = { appendPayment };
