# WhatsApp API Integration and Webhook Handling

## Overview
This document covers the integration of the WhatsApp Cloud API, handling incoming messages via a webhook, sending automated responses, using Ngrok for public URL exposure, and optimizing message personalization with a database-driven approach.

---

## 1. Setting Up WhatsApp Cloud API
To integrate the WhatsApp Cloud API, follow these steps:

1. **Create a Meta App** on [Meta for Developers](https://developers.facebook.com/).
2. **Enable the WhatsApp API** in your app settings.
3. **Obtain API Credentials**, including the `Access Token`, `Phone Number ID`, and `Webhook URL`.
4. **Configure Webhooks** to receive messages and events from WhatsApp.

---

## 2. Webhook Setup for Receiving Messages
To set up a webhook in an Express.js server:

### **Webhook Verification**
```javascript
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
```

### **Handling Incoming Messages**
```javascript
app.post("/webhook", async (req, res) => {
    try {
        const body = req.body;
        console.log("📩 Webhook Event Received:", JSON.stringify(body, null, 2));

        const changes = body.entry?.[0]?.changes?.[0]?.value;
        const phone_number_id = changes?.metadata?.phone_number_id;
        const messages = changes?.messages;

        if (!phone_number_id) return res.sendStatus(400);

        if (messages) {
            const message = messages[0];
            const from = message.from;
            const messageText = message.text?.body.trim().toLowerCase();

            const greetings = ["hi", "hello", "hey", "morning", "good evening"];

            if (greetings.some(greet => messageText.includes(greet))) {
                await sendTemplateMessage(phone_number_id, from);
            } else {
                await sendContactInfo(phone_number_id, from);
            }
        }
        res.sendStatus(200);
    } catch (error) {
        console.error("❌ Error processing webhook:", error.message);
        res.sendStatus(500);
    }
});
```

---

## 3. Sending Automated Messages

### **Sending a WhatsApp Text Message**
```javascript
async function sendContactInfo(phone_number_id, recipient) {
    const message = `🙏 Thank you for reaching out to *Bluebex Software*! \n\n📧 Email: bluebexsoftware@gmail.com \n🌐 Website: https://bluebex.in \n📱 Call Us: +919164949099`;
    await sendMessage(phone_number_id, recipient, message);
}
```

### **Sending a Template Message**
```javascript
async function sendTemplateMessage(phone_number_id, recipient) {
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
                    { type: "header", parameters: [{ type: "image", image: { id: "9801615363183757" } }] },
                    { type: "body", parameters: [{ type: "text", text: "user," }] }
                ]
            }
        },
        { headers: { "Content-Type": "application/json" } }
    );
    console.log(`✅ Template message sent to ${recipient}`);
}
```

---

## 4. Using Ngrok for Public Webhook URL
Ngrok allows you to expose your local server to the internet, making it easier to test webhooks.

### **Steps to Use Ngrok**
1. **Install Ngrok**: `npm install -g ngrok`
2. **Authenticate Ngrok**:
   ```sh
   ngrok config add-authtoken YOUR_NGROK_AUTH_TOKEN
   ```
3. **Run Ngrok**:
   ```sh
   npx ngrok http 3000
   ```
4. **Update Webhook URL** in your Meta App settings with the generated public URL.

---

## 5. Handling Usernames in WhatsApp Message Templates  

### Issue Overview  
When using WhatsApp message templates, the text variables passed in the template do not automatically fetch the user’s WhatsApp profile name. This creates a challenge because:  
- Many users do not set their profile names, making it unreliable to extract them.  
- Since we are using predefined templates, modifying parameters dynamically within the API can lead to errors.  

### Current Approach  
At present, there is no database storing customer details, so names are not being passed dynamically in the templates. Instead, names are handled manually for each message, which is not scalable.  

### Suggested Solution  
A more reliable and scalable solution would be to maintain a database where customer details, including names and mobile numbers, are stored. This would allow us to:  
- Fetch and display accurate customer names without relying on WhatsApp profile names.  
- Ensure consistency and avoid errors caused by missing or incorrect profile names.  
- Automate the process once an API is in place, eliminating the need for manual intervention.  

### Next Steps  
Once the database is set up and an API is implemented, the system can dynamically fetch customer names based on their phone numbers. This will make the process more efficient and seamless while maintaining accuracy in message personalization.  

---

## 6. Optimized Code
Here is the optimized code for WhatsApp webhook handling and message automation:

```javascript
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express().use(bodyParser.json());
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

app.listen(PORT, () => console.log(`✅ Webhook is live on port ${PORT}`));

// Webhook Verification & Message Handling (Optimized)
app.post("/webhook", async (req, res) => { /* optimized handler logic here */ });

async function sendMessage(phone_number_id, recipient, text) { /* optimized function */ }
async function sendTemplateMessage(phone_number_id, recipient) { /* optimized function */ }
```

This document ensures a **structured and scalable** approach to integrating WhatsApp API, handling messages, and improving personalization using a database. 🚀

## Handling Usernames in WhatsApp Message Templates  

### Issue Overview  
When using WhatsApp message templates, the text variables passed in the template do not automatically fetch the user’s WhatsApp profile name. This creates a challenge because:  

- Many users do not set their profile names, making it unreliable to extract them.  
- Since we are using predefined templates, modifying parameters dynamically within the API can lead to errors.  

### Current Approach  
At present, there is no database storing customer details, so names are not being passed dynamically in the templates. Instead, names are handled manually for each message, which is not scalable.  

### Suggested Solution  
A more reliable and scalable solution would be to maintain a database where customer details, including names and mobile numbers, are stored. This would allow us to:  

- Fetch and display accurate customer names without relying on WhatsApp profile names.  
- Ensure consistency and avoid errors caused by missing or incorrect profile names.  
- Automate the process once an API is in place, eliminating the need for manual intervention.  

### Next Steps  
Once the database is set up and an API is implemented, the system can dynamically fetch customer names based on their phone numbers. This will make the process more efficient and seamless while maintaining accuracy in message personalization.  
