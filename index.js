import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
import express from "express";
import qrcode from "qrcode-terminal";
import qrcodeWeb from "qrcode";




const app = express();

app.get("/", (req, res) => {
  res.send("✅ Bot WhatsApp Fervid activo");
});
app.get("/qr", async (req, res) => {
  if (!global.latestQR) return res.send("❌ Aún no hay QR. Espera 10 segundos y recarga.");

  const img = await qrcodeWeb.toDataURL(global.latestQR);

  res.send(`
    <html>
      <body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#111;">
        <img src="${img}" style="width:320px;height:320px;background:white;padding:12px;border-radius:12px" />
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("🌐 Web activa en puerto:", PORT));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
  version,
  auth: state,
  printQRInTerminal: false,
  browser: ["Chrome", "Windows", "10"]

  });
  //✅ Vincular por CÓDIGO (NO QR)
if (!sock.authState.creds.registered) {
  const phoneNumber = "593985003752";
  const code = await sock.requestPairingCode(phoneNumber);
  console.log("✅ Pairing Code:", code);
}




  sock.ev.on("creds.update", saveCreds);


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
