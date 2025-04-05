# 🔐 WhatsApp Cloud API Webhooks - Secure Implementation Guide

This documentation covers everything you need to know to securely implement and verify WhatsApp Cloud API webhooks. The focus is on **payload verification**, **Meta's webhook verification process**, and the best practices for handling and trusting webhook events.

---

## 🔐 Payload Verification Using `X-Hub-Signature-256` (Top Priority)

When Meta sends a webhook (real-time event) to your server, it's essential to **verify that the data is truly from Meta** and **hasn't been modified**.

### ✅ Why is this important?
Anyone can send a request to your webhook URL. If you don't verify the payload, malicious actors could spoof messages and trigger false behaviors in your system.

### ⚙️ How Meta Secures Payloads:
- Each payload includes a special HTTP header: `X-Hub-Signature-256`
- This header contains a **SHA256 HMAC hash** of the payload, signed using your **App Secret**.
- You should compute the same hash on your side and compare it with the one received.

### 📁 Node.js Verification Code:
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

> ⚠️ Although Meta does not *require* this verification, it is **highly recommended** to prevent spoofing and unauthorized access.

---

## 🕵️ Webhook Verification Process (GET /webhook)

Before Meta sends you real-time messages, it verifies your webhook with a one-time challenge.

### 📥 What Meta Sends:
When you register your webhook, Meta sends a GET request with these query parameters:

- `hub.mode` – Should be "subscribe"
- `hub.verify_token` – A token you define in your code and register in the Meta dashboard
- `hub.challenge` – A random string that you must return if verification is successful

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

---

## 🔄 Real-Time Webhook Challenges

The `hub.challenge` is a **one-time, random string** generated during the webhook verification process.

- You **won't see** this value anywhere in the Meta Developer dashboard.
- You must **immediately echo it back** in your HTTP response to complete verification.

---

## 📨 Handling Incoming Webhook Messages (POST /webhook)

Once verified, Meta sends actual user messages via POST requests to `/webhook`.

### 📊 Typical Workflow:
1. Meta sends a structured JSON payload when a user interacts with your bot.
2. Your server reads the payload and extracts:
   - `phone_number_id`
   - `from` (sender's number)
   - `text.body` (user's message)
3. Based on the message, your logic determines how to respond.

### 🧰 Example:
```js
const messageText = req.body.entry[0].changes[0].value.messages[0].text.body;
const greetings = ["hi", "hello", "hey"];

if (greetings.includes(messageText.toLowerCase())) {
  await sendTemplateMessage(...);
} else {
  await sendMessage(...);
}
```

---

## 🔒 API Token vs Payload Verification

| Feature             | Purpose                            | Required | Used For               |
|---------------------|------------------------------------|----------|------------------------|
| **Access Token**     | Authenticate API calls             | ✅ Yes | Sending messages       |
| **Payload Signature**| Validate webhook authenticity      | ❌ No  | Receiving messages     |

- Access Tokens authenticate **your requests to Meta**.
- Payload Signature verifies **Meta’s messages to you**.

Both are important for full security.

---

## ⚠️ Why You Should Verify Payloads

Without payload verification:
- Attackers can spoof POST requests to your endpoint.
- You may respond to **fake user messages**.

With payload verification:
- You ensure the message came from Meta.
- Your system only processes **authentic** data.

---

## 📆 How Token & Signature Work Together

1. **You use Access Token** to send replies via Meta’s APIs.
2. **Meta uses Signature Header** to prove it sent the webhook payload.

This two-way trust ensures a secure loop:
- You trust Meta’s webhooks.
- Meta trusts your requests.

---

## 📜 Meta’s Security Philosophy (Optional)

Meta relies on a **shared-secret trust model**:
- You keep the app secret secure.
- Meta uses it to sign payloads.
- You verify that signature before acting on the message.

It's simple but effective security.

---

## 🔧 Logging & Debugging Tips

- Use `console.log(JSON.stringify(req.body, null, 2))` to inspect payloads.
- Look for key fields like `messages`, `entry`, and `changes`.
- Log all POST requests during development.
- Validate field presence before replying.

---

## ✅ Final Best Practices Checklist

- ✅ **Always use HTTPS** for webhooks (Meta requires it).
- ✅ Store `ACCESS_TOKEN` and `APP_SECRET` in environment variables.
- ✅ Verify webhook payloads in production.
- ✅ Log all webhooks during development.
- ⚠️ **Never hardcode secrets** in your source code.

---


