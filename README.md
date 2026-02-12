# Botler Assistant - Holiday Moments

![CI](https://github.com/Yacine0801/Botler-assist-getting-to-know-holiday-moment/actions/workflows/ci.yml/badge.svg)

> Agent IA d'interview structure pour decouvrir et cartographier les workflows des equipes Holiday Moments. Chat texte et voix, generation automatique de rapports.

## Fonctionnalites

- **Interview IA structuree en 5 jours** : collecte progressive d'informations (introduction, taches, points de friction, collaboration, outils)
- **Interface Chat texte** : conversation interactive avec suggestions contextuelles selon le jour selectionne
- **Interface Voix en direct** : reconnaissance vocale via l'API Live de Gemini pour des entretiens naturels
- **Generation de rapport** : synthese automatique de l'interview en fiche structuree (role, taches, outils, problemes, opportunites d'automatisation)
- **Document de rapport editable** : visualisation et modification du rapport avant soumission finale
- **Multilingue** : detection automatique de la langue (francais, anglais, arabe, turc, indonesien, neerlandais)

## Stack technique

- **Framework** : React 19 + TypeScript
- **Bundler** : Vite 6
- **IA** : Google Generative AI (@google/genai) avec Gemini
- **Tests** : Vitest + jsdom

## Installation

```bash
git clone https://github.com/Yacine0801/Botler-assist-getting-to-know-holiday-moment.git
cd Botler-assist-getting-to-know-holiday-moment
npm install
```

## Configuration

Creer un fichier `.env.local` :
```
GEMINI_API_KEY=votre_cle_api_gemini
```

## Lancement

```bash
npm run dev
```

## Structure du projet

```
Botler-assist-getting-to-know-holiday-moment/
├── App.tsx                          # Point d'entree, gestion des onglets et sessions
├── index.html
├── index.tsx
├── types.ts                         # Types (InterviewDay, Message, InterviewSummary, InterviewSession)
├── constants.tsx                     # Prompts systeme Botler, suggestions par jour
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── components/
│   ├── ChatInterface.tsx             # Interface de chat texte avec Gemini
│   ├── LiveVoiceInterface.tsx        # Interface vocale temps reel
│   ├── ReportDocument.tsx            # Document de synthese editable
│   └── SummaryModal.tsx              # Modale de resume d'interview
├── services/
│   └── gemini.ts                     # Service d'integration Gemini (chat + resume)
└── __tests__/
    └── App.test.tsx                  # Tests unitaires
```

## Tests

```bash
npm test
```

## Licence

Ce projet est protege par la **BOTLER Proprietary License**.
Voir le fichier [LICENSE](./LICENSE).

---
*Developpe par [Botler 360](https://botler360.com)*
