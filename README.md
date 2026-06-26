# Idea Stress Tester

An app where 8 AI "expert personas" (investor, lawyer, engineer, ethicist, etc.) review your business idea and score it.


demo: https://idea-stress-tester-2.onrender.com


## Why this version is different from the single-file one

The original file called an AI API straight from the browser with the API key sitting inside the JavaScript. That's fine inside a Claude.ai artifact (which proxies the key for you), but if you run that same code anywhere else, anyone who opens dev tools can steal your key.

This version fixes that by splitting the project in two:
- **`public/`** — the frontend (HTML, CSS, JS) that runs in the browser. It never touches the API key.
- **`server.js`** — a small Node/Express backend. It holds the API key as an environment variable and is the only thing that talks to the AI API.

It uses **Google's Gemini API** (`gemini-2.5-flash`), which has a genuine free tier — no credit card required.

## Folder structure

```
idea-stress-tester/
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── server.js
├── package.json
├── .env.example
└── .gitignore
```

## Setup steps (run these in order)

1. Open the `idea-stress-tester` folder in VS Code.
2. Open a terminal in VS Code (`` Ctrl+` ``) and run:
   ```
   npm install
   ```
3. Get a free Gemini API key:
   - Go to **aistudio.google.com**, sign in with Google
   - Click **Get API key → Create API key** (no card needed)
4. Make a copy of `.env.example`, rename the copy to `.env`, and paste your key in:
   ```
   GEMINI_API_KEY=AIzaSyxxxxxxxxxxxx
   PORT=3000
   ```
5. Start the server:
   ```
   npm start
   ```
6. Open `http://localhost:3000` in your browser. Type a business idea and click "Stress test this idea."

## Free tier limits to know

`gemini-2.5-flash` on the free tier is generous enough for a personal project, but it's rate-limited (a handful of requests per minute, a few hundred per day). If you ever hit a `429` error, you've hit the limit for the minute — just wait and retry. Check current numbers in Google AI Studio since Google updates them periodically.

## Deploying it (matches your usual setup)

Since this is now a single Express app that serves its own frontend, you can deploy the whole thing to **Render** (free tier) as one Node web service — no separate Vercel/Netlify frontend needed. Just set the `GEMINI_API_KEY` environment variable in Render's dashboard the same way you do for your other projects.

## Notes

- `node-fetch` isn't needed — Node 18+ has `fetch` built in. Check your Node version with `node -v`; if it's below 18, run `nvm install 18` or download a newer Node from nodejs.org.
- Never commit your `.env` file — it's already in `.gitignore`.
