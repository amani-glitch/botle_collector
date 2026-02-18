# AUDIT — Botler Process Discovery Collector

**Date:** 2026-02-13
**Auditor:** Claude Code (Opus 4.6)
**Repo:** Yacine0801/Botler-assist-getting-to-know-holiday-moment

---

## 1. Architecture Overview

| Layer | Stack | Notes |
|-------|-------|-------|
| Frontend | React 19 + TypeScript | Single-page app |
| Bundler | Vite 6 | Dev server on port 3000 |
| AI | Gemini API (`@google/genai`) | Chat + Live Voice |
| Styling | Tailwind CSS (CDN) | Not installed as dependency |
| Icons | Font Awesome 6 (CDN) | |
| Fonts | Plus Jakarta Sans (Google Fonts CDN) | |
| Backend | **NONE** | Pure client-side app |

**Critical finding:** There is NO backend server. The Gemini API key is injected at build time via `vite.config.ts` → `process.env.API_KEY`. This means the key ends up in the client bundle.

---

## 2. File Inventory (16 files)

### Entry Points
| File | Purpose | Status |
|------|---------|--------|
| `index.html` | HTML shell, CDN imports, importmap | Working |
| `index.tsx` | React root mount | Working |
| `App.tsx` | Main app — tabs (text/voice), day selector, summary | Working |

### Components (4)
| File | Purpose | Status |
|------|---------|--------|
| `components/ChatInterface.tsx` | Text chat with Gemini chat API | Working |
| `components/LiveVoiceInterface.tsx` | Real-time voice with Gemini Live API | Working |
| `components/ReportDocument.tsx` | Editable report modal after interview | Working |
| `components/SummaryModal.tsx` | **DEAD CODE** — replaced by ReportDocument | Deprecated |

### Services (1)
| File | Purpose | Status |
|------|---------|--------|
| `services/gemini.ts` | Gemini client, summary generation, audio encode/decode | Working |

### Config & Types
| File | Purpose | Status |
|------|---------|--------|
| `constants.tsx` | System prompt, summary prompt, day suggestions | Working |
| `types.ts` | TS types (InterviewDay, Message, InterviewSummary) | Working |
| `vite.config.ts` | Vite config with API key injection | Working |
| `tsconfig.json` | TypeScript config | Working |
| `package.json` | Dependencies (5 deps, 4 devDeps) | Working |
| `metadata.json` | AI Studio metadata | Info only |
| `.gitignore` | Standard Node gitignore | Working |
| `README.md` | Basic AI Studio readme | Incomplete |

---

## 3. Existing Features

### What Works
1. **Text chat interface** — Gemini chat API (`gemini-3-pro-preview`), maintains conversation context
2. **Voice interface** — Gemini Live API (`gemini-2.5-flash-native-audio-preview`), real-time audio streaming, input/output transcription
3. **5-day interview structure** — Day 1: Intro, Day 2: Tasks, Day 3: Pain Points, Day 4: Communication, Day 5: Tools
4. **Quick-reply suggestions** — Context-aware chips per day topic
5. **Summary generation** — Uses Gemini to extract structured JSON from transcript
6. **Editable report** — Modal showing extracted data, all fields editable before "submit"
7. **Basic system prompt** — Phased interview approach (Role → Tasks → Tools → Pain Points → Closing)
8. **Responsive UI** — Glass morphism design, mobile-friendly layout

### What Partially Works
1. **Report submission** — `handleFinalSubmit` just does `console.log`. No actual storage.
2. **Report "Confirm & Finalize"** — Uses `setTimeout` to simulate API call. Data goes nowhere.

---

## 4. What's Missing

### Critical Gaps
| Gap | Impact | Phase |
|-----|--------|-------|
| No backend server | Cannot store data, API key in client | Phase 2 |
| No Google Sheets integration | Interview data is lost | Phase 2 |
| No login/identification | Cannot attribute interviews to employees | Phase 4 |
| No landing page | No context for participants | Phase 5 |
| No data persistence | Refresh = lost session | Phase 2 |
| No session management | Cannot track interview status | Phase 2 |

### System Prompt Gaps
| Gap | Impact | Phase |
|-----|--------|-------|
| No SPIN Selling methodology | Questions lack depth progression | Phase 3 |
| No JTBD framework | Misses underlying motivations | Phase 3 |
| No interaction style capture | Loses persona data for testing | Phase 3 |
| No periodic summaries | User doesn't feel heard | Phase 3 |
| Multi-language support | Should be English-only per spec | Phase 3 |
| Generic introduction | Should mention Botler 360 specifically | Phase 3 |

### Security Gaps
| Gap | Impact | Phase |
|-----|--------|-------|
| API key in client bundle | Key exposed in browser | Phase 2 |
| No rate limiting | Abuse possible | Phase 2 |
| No CORS config | No server = no CORS | Phase 2 |
| No input validation | XSS risk on report fields | Phase 2 |
| No Helmet headers | No server = no headers | Phase 2 |
| System prompt in client JS | Visible in DevTools | Phase 2 |

### Missing Files
- `.env.example` — No template for required env vars
- `server/` — No backend directory
- `scripts/` — No testing scripts
- `GHOST_TEST_REPORT.md` — No test results

---

## 5. Dependencies Audit

### Current (package.json)
```
@google/genai: ^1.40.0    — Gemini SDK (OK)
react: ^19.2.4             — React (OK)
react-dom: ^19.2.4         — React DOM (OK)
@types/node: ^22.14.0      — Node types (OK)
@vitejs/plugin-react: ^5.0 — Vite React plugin (OK)
typescript: ~5.8.2         — TypeScript (OK)
vite: ^6.2.0               — Vite bundler (OK)
```

### Need to Add
```
googleapis         — Google Sheets API
express            — Backend server
cors               — CORS middleware
helmet             — Security headers
express-rate-limit — Rate limiting
uuid               — Session IDs
dotenv             — Server env loading
concurrently       — Run Vite + Express in dev
```

---

## 6. Code Quality Notes

- Clean component structure, good separation of concerns
- Consistent styling approach (Tailwind utility classes)
- `SummaryModal.tsx` is dead code — should be removed
- `handleFinalSubmit` in `App.tsx` is a no-op (`console.log` only)
- Audio encoding/decoding functions are well-implemented
- TypeScript types are well-defined but incomplete for the full spec

---

## 7. Action Plan

| Phase | Task | Priority |
|-------|------|----------|
| 2 | Add Express backend + Google Sheets export | HIGH |
| 3 | Rewrite system prompt (SPIN + JTBD) | HIGH |
| 4 | Add login/identification flow | MEDIUM |
| 5 | Create landing page with branding | MEDIUM |
| 6 | Build ghost tester script | MEDIUM |
| - | Update README + .env.example | LOW |
| - | Clean dead code (SummaryModal) | LOW |
