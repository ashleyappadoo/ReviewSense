# ReviewSense V2 🔍

> Collez une URL Amazon, Google My Business ou TripAdvisor. ReviewSense extrait automatiquement vos avis et génère un rapport d'insights actionnable par Claude AI.

## Nouveautés V2

- **Zéro copier-coller** — l'utilisateur colle juste une URL
- **Détection automatique** de la plateforme depuis l'URL
- **Extraction multi-pages** (jusqu'à 5 pages / 150 avis)
- **Clés API côté serveur** — plus de champ API key dans l'UI
- **Rapport enrichi** — thèmes clés, priorités d'action, verbatims ciblés

## Plateformes supportées

| Plateforme | API RapidAPI | Pagination |
|---|---|---|
| Amazon | amazon-review-scraping | ✅ par page |
| Google My Business | Outscraper | ✅ par offset |
| TripAdvisor | tripadvisor-scraper (Chetan11dev) | ✅ par offset |

## Stack

- **Next.js 14** — Pages Router
- **Anthropic SDK** — Claude Opus 4.6 pour l'analyse
- **RapidAPI** — scraping Amazon, Google, TripAdvisor
- **Vercel** — déploiement serverless

## Installation locale

```bash
# 1. Cloner et installer
npm install

# 2. Configurer les variables d'environnement
cp .env.local.example .env.local
# Éditer .env.local avec vos clés

# 3. Lancer
npm run dev
```

## Déploiement Vercel

```bash
vercel
```

Puis dans **Vercel Dashboard → Settings → Environment Variables**, ajouter :

| Variable | Valeur |
|---|---|
| `ANTHROPIC_API_KEY` | sk-ant-... |
| `RAPIDAPI_KEY` | Votre clé RapidAPI |

## Architecture

```
reviewsense/
├── pages/
│   ├── index.jsx           # UI complète (landing → setup → analyse → résultats)
│   ├── _app.js
│   └── api/
│       ├── scrape.js       # Détection plateforme + appels RapidAPI + pagination
│       └── analyze.js      # Analyse Claude AI (clé serveur)
├── .env.local.example      # Template variables d'environnement
├── package.json
└── next.config.js
```

## Flux d'une analyse

```
URL utilisateur
    ↓
scrape.js : detectPlatform(url)
    ↓
scrape.js : scrapeAmazon() | scrapeGoogle() | scrapeTripAdvisor()
    ↓ (pagination automatique, max 150 avis)
scrape.js : reviewsToText() — normalisation en texte structuré
    ↓
analyze.js : Claude Opus — prompt structuré par secteur
    ↓
JSON : score, painPoints, positives, verbatims, actions, opportunities, keyThemes
    ↓
Dashboard résultats (bento grid)
```

## Roadmap V3

- [ ] Etsy, Booking.com, Trustpilot
- [ ] Export PDF du rapport
- [ ] Analyse comparative période A vs B
- [ ] Webhooks pour alertes sur nouvelles frictions
- [ ] Mode white-label
