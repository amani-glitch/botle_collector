# Botler 360 — Process Discovery for Holiday Moments

Interview app that helps understand how Holiday Moments' team works day to day.

## Setup

```bash
npm install
cp .env.example .env
# Fill in your API keys in .env
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| ANTHROPIC_API_KEY | Yes | Claude API key |
| GOOGLE_SERVICE_ACCOUNT_JSON | No | Google Sheets service account JSON |
| GOOGLE_SHEETS_ID | No | Google Sheets spreadsheet ID |
| ADMIN_PASSWORD | Yes | Admin dashboard password |
| SESSION_SECRET | Yes | Express session secret |
| PORT | No | Server port (default: 3000) |

## Deploy to Fly.io

```bash
fly launch
fly secrets set ANTHROPIC_API_KEY=sk-... ADMIN_PASSWORD=... SESSION_SECRET=...
fly deploy
```
