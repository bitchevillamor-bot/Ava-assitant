# AVA — Your Personal AI Assistant

AVA is a beginner-friendly, responsive text chat interface with a calm, futuristic visual style. Version 1 includes built-in commands, a typing indicator, local conversation history, and a voice-control preview.

## Preview locally

No build step or dependencies are required.

1. Clone or download this repository.
2. Open `index.html` directly in a browser, **or** run a small local server from the project folder:
   ```bash
   python3 -m http.server 8000
   ```
3. Visit [http://localhost:8000](http://localhost:8000).

Try `help`, `clear`, `who are you`, or `what can you do` in the message box. Conversation history is kept in your browser's `localStorage`.

## Availability, Sleep Mode, and Busy Mode

AVA always identifies herself as **AVA, Boss Allan's assistant**. The status badge in the header shows Boss Allan's current availability using the **Asia/Manila** time zone:

- **AVAILABLE** — normal daytime operation.
- **SLEEPING** — automatically active every day from 11:00 PM through 6:59 AM. AVA sends a polite sleep reply and records the visitor's message.
- **BUSY** — ready for optional daytime periods. Add objects such as `{ startHour: 13, endHour: 15 }` to `BUSY_SCHEDULE` in `script.js`; no Busy hours are enabled by default.

Urgent wording such as “urgent,” “emergency,” “very important,” or “ASAP” receives the dedicated urgent follow-up instead of the normal unavailable reply. The reusable `determineCurrentStatus()`, `detectUrgentKeywords()`, `generateAutomaticReply()`, `receiveMessage()`, and `returnAvaResponse()` functions keep this behavior consistent across channels.

The browser calculates status for this demo. A production backend should calculate it again before replying, because a visitor can alter frontend code or their device clock.

## Deploy with GitHub Pages

1. Push the project to a GitHub repository.
2. On GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select your primary branch (usually `main`), choose the `/ (root)` folder, and click **Save**.
5. After GitHub finishes publishing, use the site URL shown on the Pages settings screen.

Because the project is static and `index.html` is in the repository root, it needs no extra GitHub Pages configuration.

## Connecting an AI backend later

The integration point is clearly marked in `getAssistantResponse()` in `script.js`. Connect that function only to a server endpoint you control. Keep all AI provider keys on the server—never commit or expose secrets in browser code.

## Future messaging integrations

Telegram, Facebook Messenger, and SMS providers can later send incoming webhook messages to a secure backend. That backend should:

1. Verify the provider's webhook signature or secret.
2. Pass the message text to the shared AVA status/reply logic (or a server-side equivalent of `receiveMessage()`).
3. Store or notify Boss Allan about the message according to his privacy preferences.
4. Send AVA's returned response through the provider API.

Keep Telegram bot tokens, Messenger app secrets and access tokens, SMS credentials, phone details, and AI keys in server-side environment variables or a secret manager. **Never** place credentials in `index.html`, `script.js`, a public GitHub repository, or any other frontend asset.
