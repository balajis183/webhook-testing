require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express().use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.TOKEN; // WhatsApp API Access Token
const VERIFY_TOKEN = process.env.VERIFY_TOKEN; // Custom Webhook Verification Token

// 🚀 Start Webhook Server
app.listen(PORT, () => console.log(`✅ Webhook is live on port ${PORT}`));

// 📌 Webhook Verification for WhatsApp Cloud API
app.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const challenge = req.query["hub.challenge"];
    const verifyToken = req.query["hub.verify_token"];

    if (mode === "subscribe" && verifyToken === VERIFY_TOKEN) {
        console.log("✅ Webhook Verified Successfully!");
        return res.status(200).send(challenge);
    }
    console.error("❌ Webhook Verification Failed!");
    res.sendStatus(403);
});

// 📌 Webhook to Receive Messages
app.post("/webhook", async (req, res) => {
    try {
        const body = req.body;
        console.log("📩 Webhook Event Received:", JSON.stringify(body, null, 2));

        if (!body.object) return res.sendStatus(404);

        const changes = body.entry?.[0]?.changes?.[0]?.value;
        const phone_number_id = changes?.metadata?.phone_number_id;
        const messages = changes?.messages;

        if (!phone_number_id) {
            console.error("❌ No phone number ID found in webhook payload.");
            return res.sendStatus(400);
        }

        if (messages) {
            const message = messages[0];
            const from = message.from;
            const messageType = message.type;

            if (messageType === "template") {
                const templateName = message.template.name;
                const languageCode = message.template.language.code;
                console.log(`📩 Received Template Message from ${from}: ${templateName} [${languageCode}]`);
                return res.sendStatus(200);
            }

            if (message.text) {
                console.log(`💬 User replied from ${from}: ${message.text.body}`);
                await sendMessage(phone_number_id, from, `Hi! You said: ${message.text.body}`);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error("❌ Error processing webhook:", error.message);
        res.sendStatus(500);
    }
});


app.post('/webhook', (req, res) => {
    console.log('Webhook received!', req.body);
    res.status(200).send('OK');
});


// 📌 Function to Send a WhatsApp Message
async function sendMessage(phone_number_id, recipient, text) {
    try {
        await axios.post(
            `https://graph.facebook.com/v13.0/${phone_number_id}/messages?access_token=${TOKEN}`,
            {
                messaging_product: "whatsapp",
                to: recipient,
                text: { body: text },
            },
            { headers: { "Content-Type": "application/json" } }
        );
        console.log(`✅ Message sent to ${recipient}: ${text}`);
    } catch (error) {
        console.error("❌ Error sending message:", error.response?.data || error.message);
    }
}

// 📌 Home Route
app.get("/", (req, res) => res.status(200).send("✅ Webhook is up and running!"));
