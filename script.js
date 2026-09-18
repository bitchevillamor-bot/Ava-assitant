const STORAGE_KEY = "ava-conversation-v1";
const WELCOME_MESSAGE = "Hi! I’m AVA. How can I help you today?";

const messagesElement = document.querySelector("#messages");
const chatWindow = document.querySelector("#chatWindow");
const form = document.querySelector("#chatForm");
const input = document.querySelector("#messageInput");
const clearButton = document.querySelector("#clearButton");
const typingIndicator = document.querySelector("#typingIndicator");
const micButton = document.querySelector("#micButton");
const voiceNote = document.querySelector("#voiceNote");

let conversation = loadConversation();
let voiceNoteTimer;

if (conversation.length === 0) {
  conversation = [createMessage("assistant", WELCOME_MESSAGE)];
  saveConversation();
}

renderConversation();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  addMessage("user", text);
  input.value = "";
  input.focus();

  if (text.toLowerCase() === "clear") {
    await showTyping();
    clearConversation();
    return;
  }

  await showTyping();
  addMessage("assistant", await getAssistantResponse(text));
});

clearButton.addEventListener("click", clearConversation);

micButton.addEventListener("click", () => {
  window.clearTimeout(voiceNoteTimer);
  voiceNote.classList.add("visible");
  voiceNoteTimer = window.setTimeout(() => voiceNote.classList.remove("visible"), 2200);
});

function createMessage(role, text) {
  return { role, text, timestamp: new Date().toISOString() };
}

function addMessage(role, text) {
  const message = createMessage(role, text);
  conversation.push(message);
  saveConversation();
  messagesElement.append(createMessageElement(message));
  scrollToLatest();
}

function createMessageElement(message) {
  const wrapper = document.createElement("article");
  wrapper.className = `message ${message.role === "user" ? "user" : "assistant"}`;

  if (message.role === "assistant") {
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.append(document.createElement("span"));
    wrapper.append(avatar);
  }

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  const content = document.createElement("div");
  content.textContent = message.text;
  const time = document.createElement("time");
  time.className = "message-time";
  time.dateTime = message.timestamp;
  time.textContent = formatTime(message.timestamp);
  bubble.append(content, time);
  wrapper.append(bubble);
  return wrapper;
}

function renderConversation() {
  messagesElement.replaceChildren(...conversation.map(createMessageElement));
  requestAnimationFrame(scrollToLatest);
}

function clearConversation() {
  typingIndicator.hidden = true;
  conversation = [createMessage("assistant", WELCOME_MESSAGE)];
  saveConversation();
  renderConversation();
  input.focus();
}

function loadConversation() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(stored)) return [];
    return stored.filter(
      (message) =>
        ["user", "assistant"].includes(message?.role) &&
        typeof message?.text === "string" &&
        typeof message?.timestamp === "string",
    );
  } catch {
    return [];
  }
}

function saveConversation() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversation));
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(new Date(timestamp));
}

function scrollToLatest() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showTyping() {
  typingIndicator.hidden = false;
  scrollToLatest();
  return new Promise((resolve) => {
    window.setTimeout(() => {
      typingIndicator.hidden = true;
      resolve();
    }, 650);
  });
}

async function getAssistantResponse(message) {
  const normalized = message.toLowerCase().trim().replace(/[?.!]+$/, "");

  const commands = {
    help: "You can ask me what I can do, ask who I am, or type ‘clear’ to start fresh. I’m ready to help you think, plan, and stay organized.",
    "who are you": "I’m AVA, your calm and capable personal AI assistant. This first version runs locally in your browser and is designed to connect to a secure AI service in the future.",
    "what can you do": "Right now I can guide you through this demo, explain my features, and remember this conversation on your device. A future secure AI connection will let me answer broader questions and help with more complex tasks.",
  };

  if (commands[normalized]) return commands[normalized];

  // FUTURE AI BACKEND CONNECTION:
  // Replace the fallback below with a fetch request to your own secure server endpoint.
  // The server—not this frontend—must store the AI provider API key and call the AI API.
  // Example: const response = await fetch("/api/chat", { method: "POST", ... });
  // Never add API keys, secrets, or provider credentials to this file.
  return "I’m currently in demo mode, so I can respond to: “help”, “clear”, “who are you”, and “what can you do”. My full AI capabilities are coming soon.";
}
