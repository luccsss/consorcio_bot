const csvStore = require("./csvStore");

const HEADER = "fecha,canal,cliente_id,libro,nombre,direccion,cantidad\n";

/**
 * @param {{channel: string, customerId: string, book: string, name: string, address: string, qty: number}} order
 */
function appendOrder(order) {
  csvStore.appendRow("orders.csv", HEADER, [
    new Date().toISOString(),
    order.channel,
    order.customerId,
    order.book,
    order.name,
    order.address,
    order.qty,
  ]);
}

module.exports = { appendOrder };
