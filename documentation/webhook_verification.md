# 🔐 WhatsApp Cloud API Webhooks – Secure & Structured Implementation Guide

This guide walks you through implementing and securing a webhook for receiving messages via the WhatsApp Cloud API. It covers **payload verification**, **Meta's webhook verification process**, and best practices for handling messages.

---

## 1. ✅ Payload Verification Using `X-Hub-Signature-256` (Highly Recommended)

To ensure that incoming webhook payloads are genuinely from Meta and not tampered with, use **SHA256 signature verification**:

### 🔧 How it works:

- Every webhook payload from Meta includes an HTTP header:

```
X-Hub-Signature-256: sha256=abcdef123456...
```

- You need to:
  1. Generate a SHA256 hash using your **App Secret** and the raw payload body.
  2. Compare your hash with the signature from the header.
  3. If they match → ✅ The payload is valid.

### 📌 Node.js Example:
```js
const crypto = require("crypto");

function verifyPayloadSignature(req, appSecret) {
  const receivedSignature = req.headers["x-hub-signature-256"];
  const payload = JSON.stringify(req.body);

  const expectedSignature = "sha256=" +
    crypto.createHmac("sha256", appSecret).update(payload).digest("hex");

  return receivedSignature === expectedSignature;
}
```

> ⚠️ Meta does not require payload verification, but strongly recommends it.

---

## 2. 🔁 Webhook Verification Process (`GET /webhook`)

Meta verifies the webhook URL with a one-time subscription challenge. Your server must respond correctly to the following query params:

### 📥 Parameters:
- `hub.mode` – should be "subscribe"
- `hub.verify_token` – your pre-shared token (must match what you set in Meta dashboard)
- `hub.challenge` – random string sent by Meta

### ✅ Code Example:
```js
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});
```

> 🧠 Note: The `hub.challenge` is not shown in the Meta dashboard. It’s dynamically generated during setup.

---

## 3. 📨 Receiving and Responding to Messages (`POST /webhook`)

Once verified, your server starts receiving real-time messages from users:

### Key Components:
- Extract `phone_number_id`, `from`, `text.body` from the webhook.
- Respond with a templated or standard text message.

### 🤖 Greeting Detection Example:
```js
const greetings = ["hi", "hello", "hey"];
if (greetings.includes(messageText.toLowerCase())) {
  await sendTemplateMessage(...);
} else {
  await sendMessage(...);
}
```

---

## 4. 🔐 Access Token vs. Payload Verification

| Feature            | Purpose                         | Required | Used For                  |
|--------------------|----------------------------------|----------|----------------------------|
| **Access Token**   | Authenticate API calls           | ✅ Yes  | Sending messages to users |
| **Payload Signature** | Validate webhook authenticity | ❌ No, but recommended | Receiving secure messages |

You need an access token to call Meta's APIs, but should use payload verification to validate messages coming from Meta.

---

## 5. 🛡️ Why Use Payload Verification?

Without payload verification:
- Anyone could POST fake data to your webhook endpoint.
- You risk acting on forged messages.

With verification:
- You're assured that Meta sent the message.
- You can trust the integrity of the content.

---

## 6. 🧪 Debugging & Logging Tips

- Use `console.log(JSON.stringify(req.body, null, 2))` to inspect structure.
- Check for `entry[0].changes[0].value.messages`.
- Always validate important fields like `phone_number_id` before responding.

---

## 7. 🧠 Best Practices

- ✅ Use **HTTPS** for your webhook URL (Meta requires it).
- ✅ Keep your `ACCESS_TOKEN` and `APP_SECRET` in **environment variables**.
- ✅ Log all incoming events for initial testing.
- ✅ **Validate payloads** in production.
- ⚠️ Never hardcode sensitive tokens in code.

---



