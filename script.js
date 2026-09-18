const STORAGE_KEY = "ava-conversation-v1";
const WELCOME_MESSAGE = "Hi! I’m AVA, assistant ni Boss Allan. How can I help you today?";
const MANILA_TIME_ZONE = "Asia/Manila";
const STATUS = Object.freeze({ AVAILABLE: "AVAILABLE", BUSY: "BUSY", SLEEPING: "SLEEPING" });

const SLEEP_REPLY = "Hi, si AVA ito, assistant ni Boss Allan. Tulog pa po siya sa oras na ito. Maaari po ninyong iwan ang inyong message at ipapaabot ko ito sa kanya kapag available na siya. Salamat po.";
const BUSY_REPLY = "Hi, si AVA ito, assistant ni Boss Allan. Busy pa po ang boss ko sa oras na ito. Maaari po ninyong iwan ang inyong message at ipapaabot ko ito sa kanya kapag available na siya.";
const URGENT_REPLY = "Nagmamadali po ba kayo? Importante po ba ito at hindi maaaring hintayin hanggang matapos ang pagpapahinga o ginagawa ni Boss Allan? Si AVA ito, assistant niya. Maaari po ninyong iwan ang kumpletong message at ipapaabot ko ito sa kanya.";

// Add daytime periods here when Boss Allan wants Busy Mode enabled.
// Hours use Philippine time and an end hour that is not included (for example, 13–15).
const BUSY_SCHEDULE = [];

// Read only the hour in Manila, regardless of the visitor's own time zone.
function getManilaHour(date = new Date()) {
  const hourPart = new Intl.DateTimeFormat("en-US", {
    timeZone: MANILA_TIME_ZONE,
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(date).find((part) => part.type === "hour");
  return Number(hourPart.value);
}

function determineCurrentStatus(date = new Date(), busySchedule = BUSY_SCHEDULE) {
  const hour = getManilaHour(date);
  if (hour >= 23 || hour < 7) return STATUS.SLEEPING;
  if (busySchedule.some(({ startHour, endHour }) => hour >= startHour && hour < endHour)) return STATUS.BUSY;
  return STATUS.AVAILABLE;
}

// Keep urgent phrases in one place so every future messaging channel behaves alike.
function detectUrgentKeywords(message) {
  const urgentPattern = /\b(urgent|urgently|emergency|asap|very important|important(?:e)?|madalian|nagmamadali|agad)\b/i;
  return urgentPattern.test(String(message));
}

function generateAutomaticReply(message, status = determineCurrentStatus()) {
  if (detectUrgentKeywords(message)) return URGENT_REPLY;
  if (status === STATUS.SLEEPING) return SLEEP_REPLY;
  if (status === STATUS.BUSY) return BUSY_REPLY;
  return null;
}

// Shared entry point for Telegram, Messenger, SMS, and this browser chat.
function receiveMessage(message, options = {}) {
  const status = options.status || determineCurrentStatus(options.date, options.busySchedule);
  return { message: String(message).trim(), status, response: generateAutomaticReply(message, status) };
}

function returnAvaResponse(message, options = {}) {
  return receiveMessage(message, options).response;
}

// The following block runs only in a browser; the reusable helpers above also work on a backend.
if (typeof document !== "undefined") {
  const messagesElement = document.querySelector("#messages");
  const chatWindow = document.querySelector("#chatWindow");
  const form = document.querySelector("#chatForm");
  const input = document.querySelector("#messageInput");
  const clearButton = document.querySelector("#clearButton");
  const typingIndicator = document.querySelector("#typingIndicator");
  const micButton = document.querySelector("#micButton");
  const voiceNote = document.querySelector("#voiceNote");
  const statusBadge = document.querySelector("#statusBadge");
  const statusText = document.querySelector("#statusText");
  const statusDot = document.querySelector("#statusDot");

  let conversation = loadConversation();
  let voiceNoteTimer;

  if (conversation.length === 0) {
    conversation = [createMessage("assistant", WELCOME_MESSAGE)];
    saveConversation();
  }

  renderConversation();
  updateStatusDisplay();
  window.setInterval(updateStatusDisplay, 60_000);

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
    const automaticReply = returnAvaResponse(message);
    if (automaticReply) return automaticReply;

    const normalized = message.toLowerCase().trim().replace(/[?.!]+$/, "");

    const commands = {
      help: "You can ask me what I can do, ask who I am, or type ‘clear’ to start fresh. I’m ready to help you think, plan, and stay organized.",
      "who are you": "I’m AVA, Boss Allan’s personal assistant. This first version runs locally in your browser and is designed to connect to a secure AI service in the future.",
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

  function updateStatusDisplay() {
    const status = determineCurrentStatus();
    const statusClass = status.toLowerCase();
    statusText.textContent = status;
    statusBadge.classList.remove("available", "busy", "sleeping");
    statusBadge.classList.add(statusClass);
    statusDot.classList.remove("available", "busy", "sleeping");
    statusDot.classList.add(statusClass);
    statusDot.title = `Boss Allan is ${status.toLowerCase()} (Asia/Manila)`;
  }
}

/*
 * FUTURE MESSAGING INTEGRATIONS
 * Telegram, Facebook Messenger, and SMS webhooks should call receiveMessage()
 * on a secure backend. Bot tokens, phone credentials, and other secrets belong
 * in server environment variables—never in this browser file or repository.
 */

// This small export makes the schedule helpers reusable and easy to test in Node.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { STATUS, detectUrgentKeywords, determineCurrentStatus, generateAutomaticReply, getManilaHour, receiveMessage, returnAvaResponse };
}
