require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function buildPrompt(idea) {
  return `You are 8 expert personas reviewing a business idea. Respond ONLY with valid JSON, no extra text.

Business idea: "${idea}"

First, decide if this is actually a real business idea (has some product, service, or concept to evaluate) or if it's just a vague request, greeting, or non-idea (e.g. "give me an idea", "hi", random text).

Return this exact JSON:
{
  "valid": true or false,
  "summary": "1-2 friendly, conversational sentences. If valid is false, gently explain that this doesn't look like a business idea yet and ask the user to describe one (what it does, who it's for). If valid is true, give a quick warm one-line overview reaction before the detailed breakdown.",
  "devil":      {"score": 0-100, "feedback": "2-3 sentence honest critique"},
  "investor":   {"score": 0-100, "feedback": "2-3 sentence ROI and scalability assessment"},
  "customer":   {"score": 0-100, "feedback": "2-3 sentences on whether customers would pay"},
  "lawyer":     {"score": 0-100, "feedback": "2-3 sentences on legal risks"},
  "competitor": {"score": 0-100, "feedback": "2-3 sentences on competitive response"},
  "analyst":    {"score": 0-100, "feedback": "2-3 sentences on market trends and timing"},
  "engineer":   {"score": 0-100, "feedback": "2-3 sentences on technical feasibility"},
  "ethicist":   {"score": 0-100, "feedback": "2-3 sentences on social impact"}
}

If valid is false, still fill in the persona fields but keep their feedback short (1 sentence) noting there's nothing concrete to evaluate yet.
Devil score = how hard it is to attack the idea (higher = fewer weaknesses).
All others = how positively they view it. Be brutally honest, but the "summary" field should always sound like a helpful person talking, not a harsh critic.`;
}

const GEMINI_MODEL = "gemini-2.5-flash"; // free tier, no credit card required

app.post("/api/analyze", async (req, res) => {
  const idea = (req.body && req.body.idea ? req.body.idea : "").trim();

  if (!idea) {
    return res.status(400).json({ error: "Please provide a business idea." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "Server is missing GEMINI_API_KEY. Add it to your .env file.",
    });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(idea) }] }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const results = JSON.parse(clean);

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/chat", async (req, res) => {
  const idea = (req.body && req.body.idea ? req.body.idea : "").trim();
  const history = Array.isArray(req.body?.history) ? req.body.history : [];
  const message = (req.body && req.body.message ? req.body.message : "").trim();

  if (!idea || !message) {
    return res.status(400).json({ error: "Missing idea or message." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "Server is missing GEMINI_API_KEY. Add it to your .env file.",
    });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    // Seed the conversation with context about the idea, then replay prior turns.
    const contents = [
      {
        role: "user",
        parts: [{
          text: `You're a helpful startup mentor. The user already ran a stress test on this business idea: "${idea}". Answer their follow-up questions conversationally, in plain English, with practical and specific advice. Keep replies short (3-6 sentences) unless they ask for more detail. Do not respond in JSON, just talk normally.`,
        }],
      },
      {
        role: "model",
        parts: [{ text: "Got it — I'll help you think through this idea conversationally. What would you like to know?" }],
      },
      ...history.map((turn) => ({
        role: turn.role === "assistant" ? "model" : "user",
        parts: [{ text: turn.text || "" }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";

    res.json({ reply: reply.trim() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Idea Stress Tester running at http://localhost:${PORT}`);
});