const socket = io();

let username = "";
let currentLanguage = "en";
let activePoll = null;
let onlineUsers = {};
let chatMode = "global";
let currentRoom = null;
let currentTargetId = null;
let currentTargetName = "";

// Initialize user from localStorage
const storedUser = localStorage.getItem("currentUser");
if (storedUser) {
  username = storedUser;
}

// DOM elements
const input = document.getElementById("message");
const messages = document.getElementById("messages");
const typingDiv = document.getElementById("typing");
const chatControls = document.getElementById("chatControls");
const disconnectedUsers = document.getElementById("disconnectedUsers");
const languageSelect = document.getElementById("languageSelect");
const translationStatus = document.getElementById("translationStatus");
const sendButton = document.querySelector(".input button");
const leaveButton = document.querySelector(".leave-button");
const askAIButton = document.getElementById("askAIBtn");
const welcomePanel = document.getElementById("welcomePanel");
const topBar = document.querySelector(".topBar");
const pollPanel = document.getElementById("pollPanel");
const filePortal = document.getElementById("filePortal");
const portalStatus = document.getElementById("portalStatus");
const adminPanel = document.getElementById("adminPanel");
const adminUserList = document.getElementById("adminUserList");
const adminBtn = document.getElementById("adminBtn");
const usersList = document.getElementById("users");
const dmSelect = document.getElementById("dmSelect");
const modePanel = document.getElementById("modePanel");
const chatModeLabel = document.getElementById("chatModeLabel");
const dmControls = document.querySelector(".dm-controls");
const roomControls = document.querySelector(".room-controls");
const roomStatus = document.querySelector(".room-status");

const translationMap = {
  es: {
    "File:": "Archivo:",
    "is typing...": "está escribiendo...",
    "Connected": "Conectado",
    "Global Chat Pro": "Chat Global Pro",
    "Send": "Enviar",
    "Leave Chat": "Salir",
    "Disconnect": "Desconectar",
    "Upload File": "Subir archivo",
    "Current: English": "Actual: Inglés",
    "Type message...": "Escribe un mensaje...",
    "Start Chat": "Iniciar chat",
    "Start Poll": "Iniciar encuesta",
    "Start File Sharing Portal": "Iniciar portal de archivos",
    "Ask AI": "Preguntar IA",
    "Disconnect": "Desconectar",
    "Share File": "Compartir archivo",
    "Create Poll": "Crear encuesta"
  },
  fr: {
    "File:": "Fichier:",
    "is typing...": "est en train d'écrire...",
    "Connected": "Connecté",
    "Global Chat Pro": "Chat Global Pro",
    "Send": "Envoyer",
    "Leave Chat": "Quitter",
    "Disconnect": "Déconnecter",
    "Upload File": "Téléverser",
    "Current: English": "Courant: Anglais",
    "Type message...": "Tapez un message...",
    "Start Chat": "Démarrer le chat",
    "Start Poll": "Démarrer un sondage",
    "Start File Sharing Portal": "Démarrer le portail de fichiers",
    "Ask AI": "Demander à l'IA",
    "Disconnect": "Déconnecter",
    "Share File": "Partager fichier",
    "Create Poll": "Créer un sondage"
  },
  de: {
    "File:": "Datei:",
    "is typing...": "schreibt...",
    "Connected": "Verbunden",
    "Global Chat Pro": "Globaler Chat Pro",
    "Send": "Senden",
    "Leave Chat": "Chat verlassen",
    "Disconnect": "Trennen",
    "Upload File": "Datei hochladen",
    "Current: English": "Aktuell: Englisch",
    "Type message...": "Nachricht eingeben...",
    "Start Chat": "Chat starten",
    "Start Poll": "Umfrage starten",
    "Start File Sharing Portal": "Dateifreigabe-Portal starten",
    "Ask AI": "KI fragen",
    "Disconnect": "Trennen",
    "Share File": "Datei teilen",
    "Create Poll": "Umfrage erstellen"
  }
};

function translateText(text, lang) {
  if (lang === "en") return text;
  const map = translationMap[lang] || {};
  return map[text] || text;
}

function logout() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  window.location.href = "auth.html";
}

function goAdmin() {
  window.location.href = "admin-login.html";
}
function updateLanguageUI() {
  currentLanguage = languageSelect.value;
  translationStatus.textContent = `Current: ${languageSelect.options[languageSelect.selectedIndex].text}`;
  sendButton.textContent = translateText("Send", currentLanguage);
  leaveButton.textContent = translateText("Disconnect", currentLanguage);
  if (askAIButton) askAIButton.textContent = translateText("Ask AI", currentLanguage);
  const messageInput = document.querySelector(".input input");
  messageInput.placeholder = translateText("Type message...", currentLanguage);
}

function ensureUser() {
  if (!username) {
    const name = localStorage.getItem("currentUser");
    if (!name) return false;
    username = name;
    socket.emit("join", username);
  }
  return true;
}

function startChat() {
  if (!ensureUser()) return;
  activateChat();
}

function askAI() {
  if (!ensureUser()) return;
  activateChat();
  const question = prompt("Ask AI a question:");
  if (!question) return;
  socket.emit("askAI", question);
}

function activateChat() {
  chatMode = "global";
  currentRoom = null;
  currentTargetId = null;
  currentTargetName = "";
  chatModeLabel.textContent = "Global Chat";
  modePanel.style.display = "flex";
  dmControls.style.display = "flex";
  roomControls.style.display = "flex";
  roomStatus.style.display = "none";
  welcomePanel.style.display = "none";
  topBar.style.display = "flex";
  chatControls.style.display = "flex";
  pollPanel.style.display = "none";
  filePortal.style.display = "none";
  adminPanel.style.display = "none";
  messages.style.display = "block";
  typingDiv.style.display = "block";
  updateLanguageUI();
  
  // Add a welcome message
  const welcomeLi = document.createElement("li");
  welcomeLi.className = "msg";
  welcomeLi.innerHTML = `<span class="message-badge">System</span> <b>System:</b> Welcome to the chat! You can now send messages and interact with others.`;
  messages.appendChild(welcomeLi);
  messages.scrollTop = messages.scrollHeight;
}

function startPoll() {
  if (!ensureUser()) return;
  welcomePanel.style.display = "none";
  topBar.style.display = "none";
  chatControls.style.display = "none";
  pollPanel.style.display = "block";
  filePortal.style.display = "none";
  adminPanel.style.display = "none";
  modePanel.style.display = "none";
  messages.style.display = "none";
  typingDiv.style.display = "none";
}

function openFilePortal() {
  if (!ensureUser()) return;
  welcomePanel.style.display = "none";
  topBar.style.display = "none";
  chatControls.style.display = "none";
  filePortal.style.display = "block";
  pollPanel.style.display = "none";
  adminPanel.style.display = "none";
  modePanel.style.display = "none";
  messages.style.display = "none";
  typingDiv.style.display = "none";
}

function startDirectMessage() {
  if (!ensureUser()) return;
  if (Object.keys(onlineUsers).length <= 1) {
    alert("No one else is online for a direct message.");
    return;
  }
  chatMode = "dm";
  currentRoom = null;
  currentTargetId = null;
  currentTargetName = "";
  welcomePanel.style.display = "none";
  topBar.style.display = "flex";
  chatControls.style.display = "flex";
  pollPanel.style.display = "none";
  filePortal.style.display = "none";
  adminPanel.style.display = "none";
  modePanel.style.display = "flex";
  dmControls.style.display = "flex";
  roomControls.style.display = "none";
  roomStatus.style.display = "none";
  chatModeLabel.textContent = "Direct Message";
  messages.style.display = "block";
  typingDiv.style.display = "block";
  updateLanguageUI();
  renderOnlineUsers();
}

function startDM() {
  const targetId = dmSelect.value;
  if (!targetId) {
    alert("Please select a user to DM.");
    return;
  }
  openDirectMessage(targetId);
}

function openDirectMessage(targetId) {
  if (!ensureUser()) return;
  const targetName = onlineUsers[targetId];
  if (!targetName) {
    alert("That user is no longer online.");
    return;
  }
  currentTargetId = targetId;
  currentTargetName = targetName;
  chatMode = "dm";
  currentRoom = null;
  chatModeLabel.textContent = `DM with ${currentTargetName}`;
  modePanel.style.display = "flex";
  dmControls.style.display = "flex";
  roomControls.style.display = "none";
  welcomePanel.style.display = "none";
  topBar.style.display = "flex";
  chatControls.style.display = "flex";
  pollPanel.style.display = "none";
  filePortal.style.display = "none";
  adminPanel.style.display = "none";
  messages.style.display = "block";
  typingDiv.style.display = "block";
  updateLanguageUI();
  dmSelect.value = targetId;
}

function joinRoom(room) {
  if (!ensureUser()) return;
  currentRoom = room;
  currentTargetId = null;
  currentTargetName = "";
  chatMode = "room";
  chatModeLabel.textContent = room === "dark-room" ? "Dark Room" : "Project Discussion";
  modePanel.style.display = "flex";
  dmControls.style.display = "none";
  roomControls.style.display = "none";
  roomStatus.style.display = "flex";
  welcomePanel.style.display = "none";
  topBar.style.display = "flex";
  chatControls.style.display = "flex";
  pollPanel.style.display = "none";
  filePortal.style.display = "none";
  adminPanel.style.display = "none";
  messages.style.display = "block";
  typingDiv.style.display = "block";
  socket.emit("joinRoom", room);
  updateLanguageUI();
}

function joinDarkRoom() {
  joinRoom("dark-room");
}

function joinProjectDiscussion() {
  joinRoom("project-discussion");
}

function leaveRoom() {
  if (!currentRoom) return;
  socket.emit("leaveRoom", currentRoom);
  currentRoom = null;
  chatMode = "global";
  chatModeLabel.textContent = "Global Chat";
  activateChat();
}

function updateFileDetails(file) {
  if (!file) {
    document.getElementById("fileName").textContent = "None";
    document.getElementById("fileType").textContent = "None";
    document.getElementById("fileSize").textContent = "0 KB";
    return;
  }

  document.getElementById("fileName").textContent = file.name;
  document.getElementById("fileType").textContent = file.type || "Unknown";
  document.getElementById("fileSize").textContent = `${(file.size / 1024).toFixed(2)} KB`;
}

function createPoll() {
  const question = document.getElementById("pollQuestion").value.trim();
  const options = [
    document.getElementById("pollOption1").value.trim(),
    document.getElementById("pollOption2").value.trim()
  ].filter(Boolean);

  if (!question || options.length < 2) {
    alert("Please enter a question and at least two options.");
    return;
  }

  activePoll = {
    question,
    options: options.map((text) => ({ text, votes: 0 }))
  };
  renderPoll();
}

function renderPoll() {
  const pollResults = document.getElementById("pollResults");
  pollResults.innerHTML = `
    <div class="poll-card">
      <strong>${activePoll.question}</strong>
      <div class="poll-options"></div>
    </div>
  `;

  const optionsContainer = pollResults.querySelector(".poll-options");
  activePoll.options.forEach((option, index) => {
    const optionEl = document.createElement("div");
    optionEl.className = "poll-option";
    optionEl.innerHTML = `
      <span>${option.text}</span>
      <button onclick="votePoll(${index})">Vote</button>
      <span class="vote-count">${option.votes} votes</span>
    `;
    optionsContainer.appendChild(optionEl);
  });
}

function votePoll(index) {
  activePoll.options[index].votes += 1;
  renderPoll();
}

function setLanguage() {
  updateLanguageUI();
}

function sendMessage() {
  const msg = input.value.trim();
  if (!msg) return;

  if (chatMode === "dm") {
    if (!currentTargetId) {
      alert("Pick a user from the DM selector first.");
      return;
    }
    socket.emit("directMessage", {
      toId: currentTargetId,
      text: msg
    });
    input.value = "";
    return;
  }

  if (chatMode === "room" && currentRoom) {
    socket.emit("roomMessage", {
      room: currentRoom,
      text: msg
    });
    input.value = "";
    return;
  }

  socket.emit("sendMessage", msg);
  input.value = "";
}

function renderMessage(data) {
  const li = document.createElement("li");
  li.className = "msg";

  if (typeof data === "string") {
    li.textContent = translateText(data, currentLanguage);
  } else {
    let prefix = "";
    let label = "";

    if (data.type === "dm") {
      prefix = data.self ? `You → ${data.toName}` : `${data.from} → You`;
      label = `<span class="message-badge">DM</span>`;
    } else if (data.type === "room") {
      prefix = data.user;
      label = `<span class="message-badge">${data.roomLabel}</span>`;
    } else if (data.type === "system") {
      prefix = "System";
      label = `<span class="message-badge">System</span>`;
    } else {
      prefix = data.user;
    }

    li.innerHTML = `${label} <b>${prefix}:</b> ${translateText(data.text, currentLanguage)}`;
  }

  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
}

function renderOnlineUsers() {
  usersList.innerHTML = "";
  dmSelect.innerHTML = "<option value=''>Select user...</option>";

  Object.entries(onlineUsers).forEach(([id, name]) => {
    const li = document.createElement("li");
    li.textContent = id === socket.id ? `${name} (You)` : name;
    if (id !== socket.id) {
      li.classList.add("user-clickable");
      li.addEventListener("click", () => openDirectMessage(id));
      const option = document.createElement("option");
      option.value = id;
      option.textContent = name;
      dmSelect.appendChild(option);
    }
    usersList.appendChild(li);
  });
}

function leaveChat() {
  if (username) {
    const li = document.createElement("li");
    li.textContent = username;
    disconnectedUsers.appendChild(li);
    socket.emit("leave");
    username = "";
  }
  topBar.style.display = "none";
  chatControls.style.display = "none";
  pollPanel.style.display = "none";
  filePortal.style.display = "none";
  adminPanel.style.display = "none";
  modePanel.style.display = "none";
  welcomePanel.style.display = "block";
  messages.style.display = "none";
  typingDiv.style.display = "none";
}
socket.on("typing", (user) => {
  document.getElementById("typing").innerText = `${user} is typing...`;
});

socket.on("stopTyping", () => {
  document.getElementById("typing").innerText = "";
});

socket.on("message", (data) => {
  renderMessage(data);
});

socket.on("directMessage", (data) => {
  renderMessage(data);
});

socket.on("roomMessage", (data) => {
  renderMessage(data);
});

socket.on("roomJoined", (data) => {
  renderMessage({ type: "system", text: `You joined ${data.roomLabel}` });
});

socket.on("roomLeft", (data) => {
  renderMessage({ type: "system", text: `You left ${data.roomLabel}` });
});

socket.on("onlineUsers", (users) => {
  onlineUsers = users;
  renderOnlineUsers();
});

socket.on("userJoined", (data) => {
  onlineUsers[data.id] = data.username;
  renderOnlineUsers();
});

socket.on("userLeft", (socketId) => {
  delete onlineUsers[socketId];
  renderOnlineUsers();
});

socket.on("typing", (user) => {
  typingDiv.innerText = translateText(`${user} is typing...`, currentLanguage);
});

socket.on("stopTyping", () => {
  typingDiv.innerText = "";
});

input.addEventListener("input", () => {
  if (!username) return;
  socket.emit("typing");
  setTimeout(() => socket.emit("stopTyping"), 1000);
});

function react(id, emoji) {
  socket.emit("react", { messageId: id, emoji });
}

socket.on("reactionUpdate", ({ messageId, emoji }) => {
  console.log("Reaction:", messageId, emoji);
});

async function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/upload", { method: "POST", body: formData });
  const data = await res.json();
  socket.emit("sendMessage", `File: ${data.fileUrl}`);
}

async function uploadFilePortal() {
  const file = document.getElementById("fileInputPortal").files[0];
  if (!file) {
    portalStatus.textContent = "Please select a file first.";
    return;
  }
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/upload", { method: "POST", body: formData });
  const data = await res.json();
  portalStatus.textContent = `Shared: ${data.fileUrl}`;
  socket.emit("sendMessage", `File: ${data.fileUrl}`);
}

window.addEventListener("load", () => {
  topBar.style.display = "none";
  pollPanel.style.display = "none";
  filePortal.style.display = "none";
  adminPanel.style.display = "none";
  modePanel.style.display = "none";
  messages.style.display = "none";
  typingDiv.style.display = "none";
});

function openAdminPanel() {
  if (!ensureUser()) return;
  welcomePanel.style.display = "none";
  topBar.style.display = "none";
  chatControls.style.display = "none";
  pollPanel.style.display = "none";
  filePortal.style.display = "none";
  adminPanel.style.display = "block";
  messages.style.display = "none";
  typingDiv.style.display = "none";
  updateAdminUserList();
}

function closeAdminPanel() {
  adminPanel.style.display = "none";
  welcomePanel.style.display = "block";
}

function updateAdminUserList() {
  adminUserList.innerHTML = "";
  Object.keys(onlineUsers).forEach(socketId => {
    const userDiv = document.createElement("div");
    userDiv.className = "admin-user-item";
    userDiv.innerHTML = `
      <span class="user-name">${onlineUsers[socketId]}</span>
      <button onclick="kickUser('${socketId}')" class="kick-btn">Kick</button>
    `;
    adminUserList.appendChild(userDiv);
  });
}

function kickUser(socketId) {
  if (confirm(`Are you sure you want to kick ${onlineUsers[socketId]}?`)) {
    socket.emit("kickUser", socketId);
  }
}

// Update online users when users join/leave
socket.on("userJoined", (data) => {
  onlineUsers[data.id] = data.username;
  renderOnlineUsers();
  updateAdminUserList();
});

socket.on("userLeft", (socketId) => {
  delete onlineUsers[socketId];
  renderOnlineUsers();
  updateAdminUserList();
});

// Initialize online users list when connecting
socket.on("connect", () => {
  // Request current online users from server
  socket.emit("requestOnlineUsers");
  // Join with stored username if available
  if (storedUser && !username) {
    username = storedUser;
    socket.emit("join", username);
  }
});

socket.on("onlineUsers", (users) => {
  onlineUsers = users;
  renderOnlineUsers();
  updateAdminUserList();
});

window.addEventListener("load", () => {
  topBar.style.display = "none";
  pollPanel.style.display = "none";
  filePortal.style.display = "none";
  adminPanel.style.display = "none";
  messages.style.display = "none";
  typingDiv.style.display = "none";
});
