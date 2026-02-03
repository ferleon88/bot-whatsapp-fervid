import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("✅ Bot WhatsApp Fervid activo");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("✅ Web activa en puerto:", PORT));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, isNewLogin } = update;

    if (connection === "open") {
      console.log("✅ WhatsApp conectado y listo!");
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log("❌ Conexión cerrada. Razón:", reason);

      const shouldReconnect = reason !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log("🔁 Reintentando conexión...");
        startBot();
      }
    }

    // 🔥 Pairing code solo cuando no está registrado
    if (!sock.authState.creds.registered) {
      const phoneNumber = process.env.PHONE_NUMBER;

      if (!phoneNumber) {
        console.log("❌ Falta PHONE_NUMBER en variables de Railway");
        return;
      }

      try {
        const code = await sock.requestPairingCode(phoneNumber);
        console.log("📌 PAIRING CODE:", code);
      } catch (err) {
        console.log("❌ Error generando pairing code:", err);
      }
    }
  });

  // ✅ responder mensajes
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages?.[0];
    if (!msg?.message) return;

    const from = msg.key.remoteJid;
    if (from === "status@broadcast") return;

    await sock.sendMessage(from, {
      text: "👋 Hola! Soy el bot de Taller Fervid 🔥\n\n✅ Puertas de seguridad\n✅ Estructuras metálicas\n📍 Cuenca\n\nEscríbeme tu necesidad y te respondo.",
    });
  });
}

startBot();
