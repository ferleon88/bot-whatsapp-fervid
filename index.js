import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import express from "express";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Bot WhatsApp Fervid activo");
});

const PORT = process.env.PORT || 8080;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      console.log("✅ WhatsApp conectado!");
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      console.log("❌ Conexión cerrada. Reconnect:", shouldReconnect);

      if (shouldReconnect) startBot();
    }
  });

  // ✅ Este es el pairing code:
  if (!sock.authState.creds.registered) {
    const phoneNumber = "593985003752"; // <-- AQUI TU NUMERO EN FORMATO INTERNACIONAL SIN +
    const code = await sock.requestPairingCode(phoneNumber);
    console.log("📌 PAIRING CODE:", code);
  }

  // ✅ Respuesta automática simple
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    if (from === "status@broadcast") return;

    await sock.sendMessage(from, { text: "✅ Hola! Soy el Bot de Taller Fervid. ¿En qué puedo ayudarte?" });
  });
}

startBot();

app.listen(PORT, () => console.log("🌐 Web activa en puerto:", PORT));
