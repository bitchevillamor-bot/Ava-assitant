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

## Deploy with GitHub Pages

1. Push the project to a GitHub repository.
2. On GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select your primary branch (usually `main`), choose the `/ (root)` folder, and click **Save**.
5. After GitHub finishes publishing, use the site URL shown on the Pages settings screen.

Because the project is static and `index.html` is in the repository root, it needs no extra GitHub Pages configuration.

## Connecting an AI backend later

The integration point is clearly marked in `getAssistantResponse()` in `script.js`. Connect that function only to a server endpoint you control. Keep all AI provider keys on the server—never commit or expose secrets in browser code.
