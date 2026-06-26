const personas = [
  { id: "devil",      name: "Devil's Advocate", role: "Finds every flaw",         icon: "😈", color: "#E24B4A" },
  { id: "investor",   name: "Shark Investor",   role: "ROI & scalability",        icon: "💰", color: "#378ADD" },
  { id: "customer",   name: "Target Customer",  role: "Would I pay for this?",    icon: "🧑", color: "#1D9E75" },
  { id: "lawyer",     name: "Lawyer",           role: "Legal & compliance risks", icon: "⚖️", color: "#7F77DD" },
  { id: "competitor", name: "Top Competitor",   role: "How I'd crush this",       icon: "🏆", color: "#D85A30" },
  { id: "analyst",    name: "Market Analyst",   role: "Trends & timing",          icon: "📊", color: "#BA7517" },
  { id: "engineer",   name: "Lead Engineer",    role: "Technical feasibility",    icon: "🛠️", color: "#639922" },
  { id: "ethicist",   name: "Ethics Reviewer",  role: "Social impact & harm",     icon: "🌍", color: "#D4537E" },
];

let currentIdea = "";
let chatHistory = [];

function getScoreColor(score) {
  if (score >= 70) return "#1D9E75";
  if (score >= 45) return "#BA7517";
  return "#E24B4A";
}

function getVerdict(score) {
  if (score >= 75) return "Strong idea — worth building 🚀";
  if (score >= 60) return "Promising — address the key risks first";
  if (score >= 45) return "Needs significant work before launching";
  return "High risk — rethink core assumptions";
}

function renderCards() {
  const grid = document.getElementById("personas-grid");
  grid.innerHTML = "";
  personas.forEach((p) => {
    grid.innerHTML += `
      <div class="card" id="card-${p.id}">
        <div class="card-header">
          <div class="icon" style="background:${p.color}22">${p.icon}</div>
          <div>
            <div class="persona-name">${p.name}</div>
            <div class="persona-role">${p.role}</div>
          </div>
        </div>
        <div class="bar-row hidden" id="bar-${p.id}">
          <div class="track"><div class="fill" id="fill-${p.id}" style="background:${p.color}"></div></div>
          <div class="score-num" id="score-${p.id}">—</div>
        </div>
        <div class="feedback" id="feedback-${p.id}">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </div>
      </div>`;
  });
}

async function analyzeIdea() {
  const idea = document.getElementById("idea-input").value.trim();
  if (!idea) return alert("Please enter a business idea first.");

  const btn = document.getElementById("analyze-btn");
  btn.disabled = true;
  btn.textContent = "⏳ Analyzing...";

  document.getElementById("results").classList.remove("hidden");
  document.getElementById("survival-card").classList.add("hidden");
  document.getElementById("ai-summary").classList.add("hidden");
  document.getElementById("chat-section").classList.add("hidden");
  document.getElementById("chat-log").innerHTML = "";
  chatHistory = [];
  renderCards();

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea }),
    });

    const results = await response.json();
    if (!response.ok) throw new Error(results.error || "Request failed");

    const summaryEl = document.getElementById("ai-summary");
    if (results.summary) {
      summaryEl.textContent = results.summary;
      summaryEl.classList.remove("hidden");
      summaryEl.classList.toggle("invalid", results.valid === false);
    } else {
      summaryEl.classList.add("hidden");
    }

    let total = 0;
    personas.forEach((p) => {
      const r = results[p.id];
      if (!r) return;
      total += r.score;
      document.getElementById(`feedback-${p.id}`).textContent = r.feedback;
      document.getElementById(`bar-${p.id}`).classList.remove("hidden");
      setTimeout(() => {
        document.getElementById(`fill-${p.id}`).style.width = r.score + "%";
        document.getElementById(`score-${p.id}`).textContent = r.score;
      }, 100);
    });

    const avg = Math.round(total / personas.length);
    document.getElementById("survival-score").textContent = avg + "/100";
    document.getElementById("survival-score").style.color = getScoreColor(avg);
    document.getElementById("survival-verdict").textContent = getVerdict(avg);
    document.getElementById("survival-card").classList.remove("hidden");

    currentIdea = idea;
    document.getElementById("chat-section").classList.remove("hidden");
  } catch (err) {
    personas.forEach((p) => {
      document.getElementById(`feedback-${p.id}`).textContent = "Error: " + err.message;
    });
  }

  btn.disabled = false;
  btn.textContent = "🔬 Stress test this idea";
}

function addChatBubble(text, role) {
  const log = document.getElementById("chat-log");
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role === "user" ? "user" : "ai"}`;
  bubble.textContent = text;
  log.appendChild(bubble);
  log.scrollTop = log.scrollHeight;
  return bubble;
}

async function sendChatMessage() {
  const input = document.getElementById("chat-input");
  const message = input.value.trim();
  if (!message || !currentIdea) return;

  input.value = "";
  addChatBubble(message, "user");

  const sendBtn = document.getElementById("chat-send-btn");
  sendBtn.disabled = true;

  const loadingBubble = addChatBubble("Thinking...", "ai");
  loadingBubble.classList.add("loading");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea: currentIdea, history: chatHistory, message }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed");

    loadingBubble.classList.remove("loading");
    loadingBubble.textContent = data.reply;

    chatHistory.push({ role: "user", text: message });
    chatHistory.push({ role: "assistant", text: data.reply });
  } catch (err) {
    loadingBubble.classList.remove("loading");
    loadingBubble.textContent = "Error: " + err.message;
  }

  sendBtn.disabled = false;
}

document.addEventListener("DOMContentLoaded", () => {
  const chatInput = document.getElementById("chat-input");
  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendChatMessage();
    });
  }
});