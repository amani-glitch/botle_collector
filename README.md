# Botler™ Process Discovery Collector

AI-powered interview agent that maps employee workflows at Holiday Moments (DMC, Dubai).
Built with React, Gemini API, and Google Sheets for data collection.

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Frontend (React + Vite)                        │
│  Landing → Login → Interview (Text / Voice)     │
│  └── Report → Auto-export to Google Sheets      │
├─────────────────────────────────────────────────┤
│  Backend (Express)                              │
│  POST /api/export-to-sheet                      │
│  GET  /api/health                               │
├─────────────────────────────────────────────────┤
│  Gemini API                                     │
│  Chat: gemini-2.5-flash-preview-05-20           │
│  Voice: gemini-2.5-flash-native-audio-preview   │
├─────────────────────────────────────────────────┤
│  Google Sheets (Service Account)                │
│  Structured interview data export               │
└─────────────────────────────────────────────────┘
```

## Setup

### Prerequisites

- Node.js 18+
- Gemini API key ([Google AI Studio](https://aistudio.google.com/))
- Google Cloud service account with Sheets API enabled (for export)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your keys:

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Gemini API key |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | For export | Service account JSON (single line) |
| `GOOGLE_SHEET_ID` | For export | Target spreadsheet ID |

### 3. Google Sheets setup (optional)

1. Create a Google Cloud service account
2. Enable Google Sheets API
3. Create a spreadsheet and share it with the service account email
4. Paste the service account JSON key into `GOOGLE_SERVICE_ACCOUNT_KEY`
5. Copy the spreadsheet ID into `GOOGLE_SHEET_ID`

### 4. Run the app

```bash
npm run dev
```

This starts both the Vite dev server (port 3000) and the Express API server (port 3001).

To run only the frontend: `npm run dev:client`
To run only the backend: `npm run dev:server`

### 5. Open in browser

Visit `http://localhost:3000`

## Google Sheets Columns

| Column | Type | Description |
|--------|------|-------------|
| timestamp | ISO 8601 | When the interview was completed |
| employee_name | String | Employee name |
| employee_role | String | Job title |
| department | String | Operations / Sales / Marketing / Finance / IT / Management |
| session_id | UUID | Unique session identifier |
| interview_transcript | JSON | Full structured summary |
| process_map | JSON | Processes identified |
| pain_points | JSON | Pain points uncovered |
| tools_used | JSON | Tools mentioned |
| automation_opportunities | JSON | Automation opportunities |
| time_estimates | JSON | Time estimates per task |
| interaction_style | JSON | Communication style metadata |
| completion_status | String | started / in_progress / completed / abandoned |

## Ghost Tester

Synthetic interview testing with 5 employee personas:

```bash
npm run ghost-test
```

Generates `GHOST_TEST_REPORT.md` with quality metrics, SPIN methodology adherence, and improvement recommendations.

### Personas

| Name | Role | Style |
|------|------|-------|
| Klara Müller | Marketing Director | Verbose, strategic, enthusiastic |
| Allen Brooks | Contracting Executive | Terse, impatient, practical |
| Hamdi Al-Rashid | Reservations Coordinator | Minimal, skeptical, reserved |
| John Kwame | IT Support Manager | Technical, structured, detailed |
| Shoukath Nair | Senior Sales Executive | Chatty, anecdotal, off-topic |

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS (CDN), Vite 6
- **Backend:** Express 5, Helmet, CORS, rate limiting
- **AI:** Gemini API (`@google/genai`) — text chat + live voice
- **Data:** Google Sheets API (googleapis)
- **Branding:** Holiday Moments (#1a365d) + Botler 360 (#E87722)
