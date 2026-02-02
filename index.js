import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
} from "@whiskeysockets/baileys";

import express from "express";

// ✅ Servidor web (Railway necesita puerto)
const app = express();

app.get("/", (req, res) => {
  res.send("✅ Bot WhatsApp Fervid activo");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("✅ Web activa en puerto:", PORT));

// ✅ BOT
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;

      console.log("❌ Conexión cerrada. Razón:", reason);

      // reconectar salvo cierre manual
      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔄 Reintentando conexión...");
        startBot();
      }
    }

    if (connection === "open") {
      console.log("✅ WhatsApp conectado correctamente");
    }
  });

  // ✅ Responder mensajes
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message) return;

    const from = msg.key.remoteJid;
    if (from === "status@broadcast") return;

    await sock.sendMessage(from, {
      text: "👋 Hola! Soy el bot de Taller Fervid. ¿En qué puedo ayudarte?",
    });
  });
}

startBot();
