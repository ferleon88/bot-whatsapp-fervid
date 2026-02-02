import express from "express";
import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import qrcode from "qrcode";

const app = express();
app.use(express.json());

let lastQR = null;

// Ruta principal
app.get("/", (req, res) => {
  res.send("✅ Bot WhatsApp Fervid activo");
});

// Ruta para ver el QR
app.get("/qr", async (req, res) => {
  if (!lastQR) {
    return res.send("❌ Aún no hay QR. Espera unos segundos y recarga la página.");
  }

  const qrImage = await qrcode.toDataURL(lastQR);
  res.send(`
    <h2>📲 Escanea este QR con WhatsApp</h2>
    <img src="${qrImage}" />
    <p>Si expira, recarga la página.</p>
  `);
});

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, qr } = update;

    if (qr) {
      lastQR = qr;
      console.log("✅ QR recibido. Abre /qr para escanear.");
    }

    if (connection === "open") {
      lastQR = null;
      console.log("✅ WhatsApp conectado correctamente!");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages?.[0];
    if (!msg?.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    console.log("📩 Mensaje:", from, text);

    await sock.sendMessage(from, { text: `✅ Fervid: Recibido tu mensaje: "${text}"` });
  });
}

startBot();

// Puerto Railway
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("🌐 Web activa en puerto:", PORT));
