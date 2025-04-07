require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express().use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

app.listen(PORT, () => console.log(`🚀 Webhook is live on port ${PORT}`));

// ─────────────────────────────────────────────
// 🔐 Webhook Verification (GET)
// ─────────────────────────────────────────────
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const challenge = req.query["hub.challenge"];
  const token = req.query["hub.verify_token"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook Verified Successfully!");
    return res.status(200).send(challenge);
  }

  console.error("❌ Webhook Verification Failed!");
  res.sendStatus(403);
});

// ─────────────────────────────────────────────
// 📩 Webhook Receiver (POST)
// ─────────────────────────────────────────────
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;
    console.log("📩 Webhook Event Received:", JSON.stringify(body, null, 2));

    const changes = body.entry?.[0]?.changes?.[0]?.value;
    const phone_number_id = changes?.metadata?.phone_number_id;
    const messages = changes?.messages;
    const profileName = changes?.contacts?.[0]?.profile?.name || "User";

    if (!messages || !phone_number_id) {
      console.log("⚠️ No messages or phone_number_id. Skipping...");
      return res.sendStatus(200);
    }

    const message = messages[0];
    const from = message.from;
    console.log("📌 Full Message Payload:", JSON.stringify(message, null, 2));
    console.log("👤 From:", from, "| Name:", profileName);

    // ── Interactive Messages (List or Button)
    if (message.type === "interactive") {
      const { type, list_reply, button_reply } = message.interactive;
      const selectedId = list_reply?.id || button_reply?.id;

      console.log(`🟢 Interactive Message - Type: ${type} | Selected ID: ${selectedId}`);

      switch (selectedId) {
        case "web_dev":
        case "app_dev":
        case "devops":
        case "AI_ML":
          await handleServiceSelection(phone_number_id, from, selectedId);
          break;

        case "web_learn_more":
        case "app_learn_more":
        case "devops_learn_more":
        case "AI_learn_more":
          await handleLearnMore(phone_number_id, from, selectedId);
          break;

        case "contact_us":
          await sendMessage(phone_number_id, from, contactMessage());
          break;

        case "feedback_form":
          await sendMessage(phone_number_id, from, `📝 *Feedback Form*\nWe value your feedback!\n👉 https://bluebex.in/feedback`);
          break;

        case "back_to_menu":
          await sendGreetingListTemplate(phone_number_id, from, profileName);
          break;

        default:
          console.log("⚠️ Unknown interactive reply received.");
      }
    }

    // ── Text Message Handling
    if (message.text) {
      const msgText = message.text.body.trim().toLowerCase();
      console.log(`💬 Text Message from ${from}:`, msgText);

      const greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"];
      const thankYou = ["thank you", "thanks", "ok", "okay", "tnx"];

      if (greetings.some(g => msgText.includes(g))) {
        await sendGreetingListTemplate(phone_number_id, from, profileName);
      } else if (thankYou.some(t => msgText.includes(t))) {
        await sendMessage(phone_number_id, from, `🙏 *Thank you for choosing Bluebex Software!*\nLet us know if you need anything else.`);
        await sendMessage(phone_number_id, from, contactMessage());
      } else {
        await sendGreetingListTemplate(phone_number_id, from, profileName);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error processing webhook:", error.response?.data || error.message);
    res.sendStatus(500);
  }
});

// ─────────────────────────────────────────────
// 🔧 Handlers
// ─────────────────────────────────────────────

async function handleServiceSelection(phone_number_id, recipient, id) {
  const services = {
    web_dev: `🌐 *Web Development*\n• React, Angular, Vue\n• Node.js, Express, Laravel\n• eCommerce, Portals\n\n👇 *Choose an option below*`,
    app_dev: `📱 *App Development*\n• Android, iOS, Flutter\n• React Native, Kotlin\n• App Store Support\n\n👇 *Choose an option below*`,
    devops: `⚙️ *DevOps & Automation*\n• CI/CD, Docker, K8s\n• Jenkins, GitHub Actions\n• AWS, Azure, GCP\n\n👇 *Choose an option below*`,
    AI_ML: `🤖 *AI & ML*\n• NLP, Vision, Forecasting\n• OpenAI, Python, TensorFlow\n• Business Automation\n\n👇 *Choose an option below*`,
  };

  const buttons = [
    { type: "reply", reply: { id: `${id.split("_")[0]}_learn_more`, title: "📖 Know More" } },
    { type: "reply", reply: { id: "contact_us", title: "📞 Contact Us" } },
    { type: "reply", reply: { id: "back_to_menu", title: "🔙 Back to Menu" } },
  ];

  await sendButtonMessage(phone_number_id, recipient, services[id], buttons);
}

async function handleLearnMore(phone_number_id, recipient, id) {
  const service = id.split("_")[0];
  const details = {
    web: `🔍 *Web Tech Stack*\n• HTML, CSS, JS, React\n• Projects: eCommerce, Portals\n• SEO, Analytics, Optimization`,
    app: `🔍 *Mobile Stack*\n• Flutter, React Native, Kotlin\n• Projects: Delivery, Learning, Ride Sharing\n• Deployed on Play/App Store`,
    devops: `🔍 *DevOps Tools*\n• Docker, Jenkins, K8s\n• IaC: Terraform\n• Pipelines, Monitoring, Scaling`,
    AI: `🔍 *AI/ML Use Cases*\n• Forecasting, NLP, Computer Vision\n• TensorFlow, OpenAI\n• Chatbots, Automation`,
  };

  await sendButtonMessage(phone_number_id, recipient, details[service], [
    { type: "reply", reply: { id: "feedback_form", title: "📝 Feedback" } },
    { type: "reply", reply: { id: "contact_us", title: "📞 Contact Us" } },
    { type: "reply", reply: { id: "back_to_menu", title: "🔙 Back to Menu" } },
  ]);
}

// ─────────────────────────────────────────────
// 📤 Message Senders
// ─────────────────────────────────────────────

async function sendMessage(phone_number_id, recipient, text) {
  try {
    await axios.post(
      `https://graph.facebook.com/v13.0/${phone_number_id}/messages`,
      {
        messaging_product: "whatsapp",
        to: recipient,
        text: { body: text },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
      }
    );
    console.log(`✅ Text Message sent to ${recipient}`);
  } catch (error) {
    console.error("❌ Error sending message:", error.response?.data || error.message);
  }
}

async function sendButtonMessage(phone_number_id, recipient, text, buttons) {
  try {
    await axios.post(
      `https://graph.facebook.com/v13.0/${phone_number_id}/messages`,
      {
        messaging_product: "whatsapp",
        to: recipient,
        type: "interactive",
        interactive: {
          type: "button",
          body: { text },
          action: { buttons },
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
      }
    );
    console.log(`✅ Button Message sent to ${recipient}`);
  } catch (error) {
    console.error("❌ Error sending button message:", error.response?.data || error.message);
  }
}

async function sendGreetingListTemplate(phone_number_id, recipient, name) {
  try {
    await axios.post(
      `https://graph.facebook.com/v13.0/${phone_number_id}/messages`,
      {
        messaging_product: "whatsapp",
        to: recipient,
        type: "interactive",
        interactive: {
          type: "list",
          header: { type: "text", text: `👋 Hello ${name}` },
          body: {
            text: `🎉 Welcome to *Bluebex Software Pvt Ltd*!\n\nWe provide modern tech solutions.\n\n💡 Choose a service to explore:`,
          },
          footer: { text: "👇 Select a service" },
          action: {
            button: "Explore Services",
            sections: [
              {
                title: "Our Services",
                rows: [
                  { id: "web_dev", title: "🌐 Web Development", description: "Websites, SEO, Portals" },
                  { id: "app_dev", title: "📱 App Development", description: "Android, iOS, Flutter" },
                  { id: "devops", title: "⚙ DevOps & Cloud", description: "CI/CD, AWS, Docker" },
                  { id: "AI&ML", title: "🤖 AI & ML", description: "Chatbots, Forecasting, OpenAI" },
                ],
              },
            ],
          },
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
      }
    );
    console.log(`✅ List Menu sent to ${recipient}`);
  } catch (error) {
    console.error("❌ Error sending list template:", error.response?.data || error.message);
  }
}

// ─────────────────────────────────────────────
// 📞 Contact Message Generator
// ─────────────────────────────────────────────
function contactMessage() {
  return `📞 *Contact Us*\nEmail: bluebexsoftware@gmail.com\nWebsite: https://bluebex.in\nPhone: +91 91649 49099\n\nWe’re excited to connect with you! 💙`;
}

// ─────────────────────────────────────────────
// 🏠 Root Health Check
// ─────────────────────────────────────────────
app.get("/", (req, res) => res.status(200).send("✅ Webhook is up and running!"));
