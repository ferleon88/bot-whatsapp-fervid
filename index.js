import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("✅ Bot WhatsApp Fervid activo");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("🌐 Web activa en puerto:", PORT));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("/app/auth");


  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      console.log("❌ Conexión cerrada. Reconectar:", shouldReconnect);

      if (shouldReconnect) startBot();
    }

    if (connection === "open") {
      console.log("✅ WhatsApp conectado!");
    }
  });


  }

  // ✅ Respuesta automática simple
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    if (from === "status@broadcast") return;

    await sock.sendMessage(from, {
      text: "👋 Hola! Soy el bot de Taller Fervid. ¿En qué puedo ayudarte?",
    });
  });
}

startBot();
