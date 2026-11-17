const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..");

function csvEscape(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Agrega una fila a un CSV en la raiz del proyecto, creandolo con su
 * cabecera si todavia no existe.
 * @param {string} fileName ej. "orders.csv"
 * @param {string} header ej. "fecha,canal,cliente_id\n"
 * @param {Array<string|number>} values
 */
function appendRow(fileName, header, values) {
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, header, "utf8");
  }
  const row = values.map(csvEscape).join(",");
  fs.appendFileSync(filePath, row + "\n", "utf8");
}

module.exports = { appendRow };
