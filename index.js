import express from "express";
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Bot WhatsApp Fervid ACTIVO (Railway)");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("✅ Web OK on port " + PORT));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("✅ QR generado, escanéalo con WhatsApp");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);

      console.log("❌ conexión cerrada. Reconnect:", shouldReconnect);

      if (shouldReconnect) startBot();
    }

    if (connection === "open") {
      console.log("🔥 BOT CONECTADO A WHATSAPP ✅");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;
    if (msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (!text) return;

    // Respuesta automática (puedes cambiarla)
    await sock.sendMessage(from, {
      text: `✅ Taller Fervid: Recibido tu mensaje: "${text}"\n\n📌 Escríbenos para cotizar puertas de seguridad y estructuras metálicas.`
    });
  });
}

startBot();
