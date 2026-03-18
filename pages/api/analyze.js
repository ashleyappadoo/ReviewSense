/**
 * ReviewSense V2 — Analyse Claude
 * Utilise la clé Anthropic côté serveur (variable d'environnement)
 */

import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Configuration serveur manquante (ANTHROPIC_API_KEY).' });
  }

  const { reviewsText, sector, platform, businessName, totalReviews, avgRating } = req.body;

  if (!reviewsText?.trim()) {
    return res.status(400).json({ error: 'Aucun avis à analyser.' });
  }

  const sectorContext = {
    ecommerce: 'e-commerce (livraison, qualité produit, service client, retours, expérience d\'achat, packaging)',
    restaurant: 'restauration (qualité des plats, accueil, temps d\'attente, ambiance, rapport qualité/prix, propreté)',
  }[sector] || 'commerce (qualité produit/service, expérience client, rapport qualité/prix)';

  const platformLabels = {
    amazon: 'Amazon',
    google: 'Google My Business',
    tripadvisor: 'TripAdvisor',
  };

  const platformName = platformLabels[platform] || platform;
  const statsContext = [
    totalReviews ? `${totalReviews} avis analysés` : '',
    avgRating ? `note moyenne brute: ${avgRating}/5` : '',
  ].filter(Boolean).join(', ');

  const prompt = `Tu es un expert en analyse de la voix client pour le secteur ${sectorContext}.

Analyse les avis clients suivants pour l'établissement "${businessName || 'cet établissement'}" provenant de ${platformName}.
${statsContext ? `Contexte statistique: ${statsContext}.` : ''}

AVIS CLIENTS :
${reviewsText}

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans backticks) avec exactement cette structure :
{
  "score": <entier entre 1 et 10 représentant la satisfaction globale>,
  "scoreComment": "<phrase courte contextualisant le score>",
  "summary": "<résumé de 2-3 phrases du sentiment général, en français>",
  "painPoints": [
    "<problème récurrent 1 formulé clairement, avec fréquence si notable>",
    "<problème récurrent 2>",
    "<problème récurrent 3>",
    "<problème récurrent 4>"
  ],
  "positives": [
    "<point fort 1 mentionné fréquemment>",
    "<point fort 2>",
    "<point fort 3>"
  ],
  "verbatims": [
    "<citation quasi-exacte d'un avis représentatif d'une friction>",
    "<citation représentative d'un point positif>",
    "<citation représentative d'une demande client>"
  ],
  "actions": [
    { "title": "<action prioritaire 1>", "description": "<comment la mettre en place concrètement, étapes clés>", "priority": "haute" },
    { "title": "<action prioritaire 2>", "description": "<comment la mettre en place>", "priority": "haute" },
    { "title": "<action 3>", "description": "<comment la mettre en place>", "priority": "moyenne" },
    { "title": "<action 4>", "description": "<comment la mettre en place>", "priority": "moyenne" }
  ],
  "opportunities": [
    "<opportunité business identifiée dans les avis 1>",
    "<opportunité 2>",
    "<opportunité 3>"
  ],
  "keyThemes": [
    "<thème récurrent 1>",
    "<thème récurrent 2>",
    "<thème récurrent 3>",
    "<thème récurrent 4>",
    "<thème récurrent 5>"
  ]
}`;

  try {
    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].text.trim();
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const data = JSON.parse(jsonText);

    return res.status(200).json(data);
  } catch (error) {
    console.error('Analysis error:', error);
    if (error.status === 401) return res.status(401).json({ error: 'Clé API Anthropic invalide côté serveur.' });
    if (error instanceof SyntaxError) return res.status(500).json({ error: 'Erreur de parsing JSON. Réessayez.' });
    return res.status(500).json({ error: error.message || 'Erreur lors de l\'analyse.' });
  }
}
