// Almacen de sesiones en memoria: clave = numero de telefono del cliente.
// Se pierde al reiniciar el servidor. Suficiente para este prototipo;
// si el bot pasa a produccion, reemplazar por algo persistente (Redis, DB).
const sessions = new Map();

function getSession(phone) {
  return sessions.get(phone) || null;
}

function setSession(phone, session) {
  sessions.set(phone, session);
}

module.exports = { getSession, setSession };
