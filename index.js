import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("✅ Bot WhatsApp Fervid activo");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("🌐 Web activa en puerto:", PORT));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state
  });

  sock.ev.on("creds.update", saveCreds);

// ✅ QR para vincular WhatsApp Business (Railway)
sock.ev.on("connection.update", (update) => {
  const { connection, qr } = update;

  if (qr) {
    console.log("✅ ESCANEA ESTE QR CON WHATSAPP BUSINESS:");
    console.log(qr);
  }

  if (connection === "open") {
    console.log("✅ WhatsApp conectado correctamente (QR).");
  }
});

 
  }
}

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    if (from === "status@broadcast") return;

    await sock.sendMessage(from, {
      text: "👋 Hola! Soy el bot de Taller Fervid. ¿En qué puedo ayudarte?"
    });
  });

  console.log("✅ Bot iniciado y listo.");
}

startBot();
