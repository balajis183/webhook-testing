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
                console.log(`📩 Received Template Message from ${from}`);
                return res.sendStatus(200);
            }

            if (message.text) {
                const messageText = message.text.body.trim().toLowerCase();
                console.log(`💬 User replied from ${from}: ${messageText}`);
            
                // Recognizing different variations of greetings
                const greetings = [
                    "hi", "hii", "hiii", "hello", "hey", "heyy", "heyyy",
                    "good morning", "good afternoon", "good evening", "good night",
                    "morning", "afternoon", "evening", "night",
                    "what's up", "whats up", "sup", "yo", "hola", "howdy",
                    "namaste", "bonjour", "salut", "greetings"
                ];
                
                if (greetings.some(greet => messageText.includes(greet))) {
                    console.log(`🤖 Greeting detected! Sending template to ${from}...`);
                    await sendTemplateMessage(phone_number_id, from);
                } else {
                    console.log(`📩 Sending Contact Us message to ${from}...`);
                    const contactMessage = `🙏 Thank you for reaching out to *Bluebex Software*! \n\n📞 *Need Assistance?* \n We're here to help! \n📧 Email: bluebexsoftware@gmail.com \n🌐 Website: https://bluebex.in \n📱 Call Us:  +919164949099 \n\nWe truly appreciate your interest and look forward to assisting you! 🚀`;
                    await sendMessage(phone_number_id, from, contactMessage);
                }
                
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error("❌ Error processing webhook:", error.message);
        res.sendStatus(500);
    }
});

// 📌 Function to Send a WhatsApp Text Message
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

// 📌 Function to Send a WhatsApp Template Message
async function sendTemplateMessage(phone_number_id, recipient) {
    try {
        await axios.post(
            `https://graph.facebook.com/v13.0/${phone_number_id}/messages?access_token=${TOKEN}`,
            {
                messaging_product: "whatsapp",
                to: recipient,
                type: "template",
                template: {
                    name: "bluebex_info",
                    language: { code: "en" },
                    components: [
                        {
                            type: "header",
                            parameters: [{ type: "image", image: { id: "9801615363183757" } }]
                        },
                        {
                            type: "body",
                            parameters: [{ type: "text", text: "user," }]
                        }
                    ]
                }
            },
            { headers: { "Content-Type": "application/json" } }
        );
        console.log(`✅ Template message sent to ${recipient}`);
    } catch (error) {
        console.error("❌ Error sending template message:", error.response?.data || error.message);
    }
}

// 📌 Home Route
app.get("/", (req, res) => res.status(200).send("✅ Webhook is up and running!"));
