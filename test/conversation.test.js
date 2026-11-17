const assert = require("assert");
const {
  handleIncomingMessage,
  STATES,
  MENU_TEXT,
  IMAGE_RECEIVED_TOKEN,
} = require("../src/conversation");

function run(name, fn) {
  try {
    fn();
    console.log(`OK   - ${name}`);
  } catch (err) {
    console.error(`FAIL - ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

run("primer contacto muestra el menu (5 opciones)", () => {
  const { newState, reply } = handleIncomingMessage(null, "hola");
  assert.strictEqual(newState, STATES.MAIN_MENU);
  assert.strictEqual(reply, MENU_TEXT);
  assert.match(reply, /5\. 👤 Hablar con un asesor/);
  assert.doesNotMatch(reply, /precio o stock/i);
});

run("opcion invalida menciona rango 1 al 5", () => {
  const { newState, reply } = handleIncomingMessage({ state: STATES.MAIN_MENU }, "9");
  assert.strictEqual(newState, STATES.MAIN_MENU);
  assert.match(reply, /1 al 5/);
});

run("libro no encontrado no lista el catalogo, deriva a un asesor", () => {
  const { newState, reply } = handleIncomingMessage({ state: STATES.BUY_ASK_BOOK }, "odontologia");
  assert.strictEqual(newState, STATES.BUY_ASK_BOOK);
  assert.match(reply, /asesor/i);
  assert.doesNotMatch(reply, /Actualmente tenemos/);
});

run("opcion 1 inicia el flujo de compra", () => {
  const { newState, reply } = handleIncomingMessage({ state: STATES.MAIN_MENU }, "1");
  assert.strictEqual(newState, STATES.BUY_ASK_BOOK);
  assert.match(reply, /qué libro estás buscando/i);
});

run("flujo de compra completo termina en MAIN_MENU con completedOrder", () => {
  let step = handleIncomingMessage({ state: STATES.BUY_ASK_BOOK }, "ultrasonido");
  assert.strictEqual(step.newState, STATES.BUY_ASK_CONFIRM);

  step = handleIncomingMessage({ state: STATES.BUY_ASK_CONFIRM, data: step.newData }, "si");
  assert.strictEqual(step.newState, STATES.BUY_ASK_NAME);

  step = handleIncomingMessage({ state: STATES.BUY_ASK_NAME, data: step.newData }, "Juana Pérez");
  assert.strictEqual(step.newState, STATES.BUY_ASK_ADDRESS);

  step = handleIncomingMessage(
    { state: STATES.BUY_ASK_ADDRESS, data: step.newData },
    "Av. Siempre Viva 123, Lima"
  );
  assert.strictEqual(step.newState, STATES.BUY_ASK_QTY);

  step = handleIncomingMessage({ state: STATES.BUY_ASK_QTY, data: step.newData }, "2");
  assert.strictEqual(step.newState, STATES.MAIN_MENU);
  assert.deepStrictEqual(step.completedOrder, {
    book: "Diagnóstico por Ultrasonido (6ª edición, 2 tomos)",
    name: "Juana Pérez",
    address: "Av. Siempre Viva 123, Lima",
    qty: 2,
  });
});

run("opcion 2 pide una foto del comprobante", () => {
  const { newState, reply } = handleIncomingMessage({ state: STATES.MAIN_MENU }, "2");
  assert.strictEqual(newState, STATES.PAYMENT_ASK_PROOF);
  assert.match(reply, /foto o captura/i);
});

run("opcion 2: texto en vez de imagen vuelve a pedirla", () => {
  const { newState, reply } = handleIncomingMessage(
    { state: STATES.PAYMENT_ASK_PROOF },
    "ya lo pagué"
  );
  assert.strictEqual(newState, STATES.PAYMENT_ASK_PROOF);
  assert.match(reply, /No recibí ninguna imagen/);
});

run("opcion 2: imagen recibida completa el pago", () => {
  const { newState, reply, completedPayment } = handleIncomingMessage(
    { state: STATES.PAYMENT_ASK_PROOF },
    IMAGE_RECEIVED_TOKEN
  );
  assert.strictEqual(newState, STATES.MAIN_MENU);
  assert.strictEqual(completedPayment, true);
  assert.match(reply, /última cuota/);
});

run("opcion 3 pide DNI y nombre, y completa la consulta de pedido", () => {
  let step = handleIncomingMessage({ state: STATES.MAIN_MENU }, "3");
  assert.strictEqual(step.newState, STATES.ORDER_ASK_DNI);

  step = handleIncomingMessage({ state: STATES.ORDER_ASK_DNI }, "12345678");
  assert.strictEqual(step.newState, STATES.ORDER_ASK_NAME);
  assert.strictEqual(step.newData.dni, "12345678");

  step = handleIncomingMessage({ state: STATES.ORDER_ASK_NAME, data: step.newData }, "Luis Gómez");
  assert.strictEqual(step.newState, STATES.MAIN_MENU);
  assert.deepStrictEqual(step.completedInquiry, { type: "pedido", dni: "12345678", name: "Luis Gómez" });
});

run("opcion 4 pide DNI y nombre, y completa la consulta de cuotas", () => {
  let step = handleIncomingMessage({ state: STATES.MAIN_MENU }, "4");
  assert.strictEqual(step.newState, STATES.QUOTA_ASK_DNI);

  step = handleIncomingMessage({ state: STATES.QUOTA_ASK_DNI }, "87654321");
  assert.strictEqual(step.newState, STATES.QUOTA_ASK_NAME);

  step = handleIncomingMessage({ state: STATES.QUOTA_ASK_NAME, data: step.newData }, "Ana Ruiz");
  assert.strictEqual(step.newState, STATES.MAIN_MENU);
  assert.deepStrictEqual(step.completedInquiry, { type: "cuotas", dni: "87654321", name: "Ana Ruiz" });
});

run("opcion 5 responde directo que un asesor contactara", () => {
  const { newState, reply } = handleIncomingMessage({ state: STATES.MAIN_MENU }, "5");
  assert.strictEqual(newState, STATES.MAIN_MENU);
  assert.match(reply, /asesor/i);
  assert.doesNotMatch(reply, /construcción/);
});

run("escribir 'menu' dentro de cualquier sub-flujo vuelve al menu principal", () => {
  const { newState, reply } = handleIncomingMessage({ state: STATES.ORDER_ASK_DNI }, "menu");
  assert.strictEqual(newState, STATES.MAIN_MENU);
  assert.strictEqual(reply, MENU_TEXT);
});

if (process.exitCode) {
  console.error("\nAlgunas pruebas fallaron.");
} else {
  console.log("\nTodas las pruebas pasaron.");
}
