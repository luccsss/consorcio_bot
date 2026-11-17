# Bot de WhatsApp - Consorcio Imperio Perú

Bot de atención con un **menú principal de 5 opciones** (`src/conversation.js`):

1. **Comprar un libro**: busca en el catálogo, confirma, pide nombre/dirección/cantidad y guarda el pedido. Si el libro no está en el catálogo, deriva a un asesor y manda el folleto `public/libros-en-liquidacion.pdf`.
2. **Enviar constancia de pago**: pide una foto/captura del comprobante; al recibirla, avisa que el área de verificación la revisará y confirmará si es válida y si corresponde a la última cuota o al monto de la siguiente.
3. **Consultar mi pedido**: pide DNI y nombre completo, y queda registrada la consulta.
4. **Consultar mis cuotas**: igual que la anterior, pide DNI y nombre completo.
5. **Hablar con un asesor**: avisa que un asesor se pondrá en contacto.

(La antigua opción "Consultar precio o stock" se eliminó: ya se cubre al buscar un libro en la opción 1.)

Funciona en **WhatsApp** (Cloud API oficial de Meta), **Messenger** y
**Instagram** (comparten el mismo código de conversación, ver
`src/server.js`).

## Datos capturados (CSV en la raíz del proyecto)

Cada uno se crea solo y se puede abrir con Excel. Ninguno se sube a git
(ya están en `.gitignore`) porque contienen datos de clientes.

- `orders.csv`: pedidos de libros completados (fecha, canal, cliente, libro, nombre, dirección, cantidad).
- `pagos.csv`: aviso de que un cliente mandó su comprobante de pago (fecha, canal, cliente) — revisa el chat de ese cliente para ver la imagen y validarla manualmente.
- `consultas.csv`: consultas de "mi pedido" o "mis cuotas" (fecha, canal, cliente, tipo, DNI, nombre) — pendientes de que alguien responda manualmente.

## 1. Requisitos previos

- Node.js 18+ instalado.
- Tu cuenta de Meta Business / WhatsApp Business API ya configurada (como
  indicaste que ya tienes), con:
  - Un **Phone Number ID** (en developers.facebook.com → tu app → WhatsApp → Introducción).
  - Un **token de acceso** (temporal de prueba, válido ~24h, o permanente de un
    usuario del sistema — recomendado para no tener que renovarlo cada día).

## 2. Instalación

```bash
cd whatsapp-bot
npm install
```

Copia `.env.example` a `.env` y completa tus valores reales (ese archivo
nunca se sube a git, ya está en `.gitignore`):

```bash
cp .env.example .env
```

`BASE_URL` debe ser la URL pública donde corre el servidor (en Render, la
de tu servicio) — se usa para que Meta pueda descargar los archivos que el
bot envía, como el folleto de liquidación.

## 3. Correr el bot localmente

```bash
npm start
```

Esto levanta el servidor en `http://localhost:3000` con dos rutas:

- `GET /webhook` — usada por Meta para verificar el webhook.
- `POST /webhook` — donde Meta envía los mensajes entrantes de tus clientes.

## 4. Exponer tu servidor local a internet (para pruebas)

Meta necesita una URL **HTTPS pública** para enviarte los mensajes. Para
probar sin desplegar todavía, usa un túnel temporal, por ejemplo
[ngrok](https://ngrok.com/):

```bash
ngrok http 3000
```

Copia la URL `https://xxxx.ngrok-free.app` que te da ngrok.

## 5. Configurar el webhook en Meta

En developers.facebook.com → tu app → WhatsApp → Configuración:

- **Callback URL**: `https://xxxx.ngrok-free.app/webhook`
- **Verify Token**: el mismo valor que pusiste en `VERIFY_TOKEN` en tu `.env`
- Suscríbete al campo `messages`.

Al guardar, Meta llama a `GET /webhook` para verificar — si todo coincide,
verás en tu consola "Webhook verificado correctamente."

## 6. Probar

Desde un número de WhatsApp autorizado en tu app (en modo de prueba, Meta
solo permite números que agregues en la lista de "destinatarios de
prueba"), envía cualquier mensaje al número del bot. Deberías recibir el
menú de bienvenida y poder navegar las 6 opciones.

## 7. Pruebas automáticas de la lógica del menú

La lógica de la conversación (`src/conversation.js`) es una función pura,
sin red, así que se puede probar sin WhatsApp real:

```bash
npm test
```

## 8. Hosting recomendado (cuando quieras dejarlo corriendo 24/7)

Para no depender de tu PC ni de ngrok, opciones sencillas y económicas
para un servidor Node.js con webhook público:

- **Railway** o **Render**: despliegue directo desde este repo, capa
  gratuita/muy barata para empezar, URL HTTPS automática. Las más simples
  para un primer despliegue.
- **VPS económico** (DigitalOcean, Vultr, Hetzner, ~US$4-6/mes): más
  control, pero tú administras el servidor (PM2, nginx, certificado SSL).

Mientras decides, puedes seguir probando con ngrok sin costo.

## Estructura del proyecto

```
whatsapp-bot/
├── src/
│   ├── server.js        # Servidor Express + endpoints del webhook
│   ├── conversation.js  # Lógica del menú (estados y respuestas)
│   ├── sessionStore.js  # Estado de cada usuario (en memoria)
│   └── whatsapp.js      # Envío de mensajes vía Graph API de Meta
├── test/
│   └── conversation.test.js
├── .env.example
└── package.json
```

## Limitaciones de esta primera etapa (a propósito)

- El estado de cada cliente vive **en memoria** (`sessionStore.js`): se
  pierde si el servidor se reinicia. Está bien para probar; si esto pasa a
  producción, cambiarlo por algo persistente (Redis, base de datos).
- Las 6 opciones del menú responden con un texto fijo de marcador de
  posición. Ahí se conectará la lógica real en los próximos pasos.
