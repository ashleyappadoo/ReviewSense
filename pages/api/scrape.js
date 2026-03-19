/**
 * ReviewSense V2 — Scraper orchestrator
 * Basé sur les vraies réponses API observées dans RapidAPI
 *
 * TripAdvisor : résultats dans data.results[], 20/page, pagination par data.next
 * Amazon      : endpoint /getAmazReviews, params productId + geoCode (us|de uniquement)
 * Google      : Outscraper, query = nom établissement + ville extrait depuis URL Maps
 */

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const MAX_PAGES   = 5;    // max pages par plateforme
const MAX_REVIEWS = 100;  // cap pour garder l'analyse rapide

export const config = { maxDuration: 30 };

// ─── Détection plateforme ─────────────────────────────────────────────────────

export function detectPlatform(input) {
  if (!input) return null;
  try {
    const str = input.toLowerCase();
    if (str.includes('amazon.'))      return 'amazon';
    if (str.includes('tripadvisor.')) return 'tripadvisor';
    // Google Maps : supporte tous les domaines (google.com, google.fr, google.de, etc.)
    if (
      /google\.[a-z.]+\/maps/.test(str) ||
      str.includes('maps.google.')       ||
      str.includes('maps.app.goo.gl')    ||
      str.includes('g.page')
    ) return 'google';
    return null;
  } catch {
    return null;
  }
}

// ─── Helpers extraction ───────────────────────────────────────────────────────

function extractAmazonAsin(url) {
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/product\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/gp\/aw\/d\/([A-Z0-9]{10})/i,
    /\/([A-Z0-9]{10})(?:\/|\?|$)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function extractAmazonGeoCode(url) {
  // API supporte uniquement 'us' et 'de'
  try {
    const host = new URL(url).hostname;
    if (host.includes('amazon.de')) return 'de';
    return 'us'; // fallback pour .fr, .com, .co.uk, etc.
  } catch {
    return 'us';
  }
}

function extractGooglePlaceName(url) {
  // Supporte google.com, google.fr, google.de, etc.
  // Patterns : /maps/place/Nom+Du+Lieu/ ou /maps/place/Nom%20Du%20Lieu/
  try {
    const match = url.match(/\/maps\/place\/([^/@?#]+)/);
    if (match) {
      return decodeURIComponent(match[1])
        .replace(/\+/g, ' ')   // + → espace
        .replace(/\s+-\s+/g, ' - ')  // normalise les tirets
        .trim();
    }
  } catch {}
  return null;
}

// ─── Scraper TripAdvisor ──────────────────────────────────────────────────────
// Réponse réelle : { count, per_page: 20, total_pages, current_page, next, results: [] }
// Chaque résultat : { review_id, title, text, rating, review_tip, subratings[] }

async function scrapeTripAdvisor(url) {
  const reviews = [];
  const encodedUrl = encodeURIComponent(url);

  for (let page = 1; page <= MAX_PAGES; page++) {
    const response = await fetch(
      `https://tripadvisor-scraper.p.rapidapi.com/reviews?query=${encodedUrl}&page=${page}`,
      {
        headers: {
          'X-RapidAPI-Key':  RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'tripadvisor-scraper.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      if (page === 1) throw new Error(`TripAdvisor API erreur ${response.status}`);
      break;
    }

    const data = await response.json();

    // La vraie structure : data.results (pas data.reviews)
    const pageReviews = data?.results || data?.reviews || (Array.isArray(data) ? data : []);
    const totalPages  = data?.total_pages || 999;

    if (!pageReviews.length) break;

    for (const r of pageReviews) {
      const text = r.text || r.review || r.content || r.body || '';
      if (!text.trim()) continue;

      reviews.push({
        author: r.username || r.author || r.name || 'Anonyme',
        rating: parseFloat(r.rating || r.score || 0),
        title:  r.title || r.headline || '',
        text,
        date: r.date || r.published_date || r.publishedDate || '',
      });
    }

    if (reviews.length >= MAX_REVIEWS) break;
    if (page >= totalPages) break;           // plus de pages disponibles
    if (pageReviews.length < 20) break;      // page incomplète = dernière page
  }

  return reviews;
}

// ─── Scraper Amazon ───────────────────────────────────────────────────────────
// Endpoint réel : GET /getAmazReviews?productId=ASIN&geoCode=us|de
// Pas de pagination documentée — on fait 1 appel

async function scrapeAmazon(url) {
  const asin = extractAmazonAsin(url);
  if (!asin) throw new Error(
    'ASIN Amazon introuvable. Vérifiez que l\'URL pointe vers une page produit (ex: amazon.com/dp/B09XXXXXX).'
  );

  const geoCode = extractAmazonGeoCode(url);

  // L'API supporte deux endpoints selon la version souscrite
  // On essaie /getAmazReviews en premier, puis / en fallback
  let data = null;

  const endpoints = [
    `https://amazon-review-scraping.p.rapidapi.com/getAmazReviews?productId=${asin}&geoCode=${geoCode}`,
    `https://amazon-review-scraping.p.rapidapi.com/?asin=${asin}&page=1&country=${geoCode}`,
  ];

  for (const endpoint of endpoints) {
    const response = await fetch(endpoint, {
      headers: {
        'X-RapidAPI-Key':  RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'amazon-review-scraping.p.rapidapi.com',
      },
    });

    if (response.ok) {
      data = await response.json();
      console.log('[Amazon] endpoint OK:', endpoint);
      console.log('[Amazon] response keys:', Object.keys(data || {}));
      break;
    }
    console.log('[Amazon] endpoint failed:', response.status, endpoint);
  }

  if (!data) throw new Error('Amazon API inaccessible. Vérifiez votre abonnement RapidAPI.');

  // Log complet pour identifier la vraie structure
  console.log('[Amazon] FULL RESPONSE:', JSON.stringify(data).substring(0, 1500));
  console.log('[Amazon] top-level keys:', Object.keys(data || {}));
  if (Array.isArray(data)) {
    console.log('[Amazon] is direct array, length:', data.length);
    if (data[0]) console.log('[Amazon] first item keys:', Object.keys(data[0]));
  } else {
    for (const key of Object.keys(data || {})) {
      if (Array.isArray(data[key])) {
        console.log('[Amazon] array at key ' + JSON.stringify(key) + ' length:', data[key].length);
        if (data[key][0]) console.log('[Amazon] ' + JSON.stringify(key) + '[0] keys:', Object.keys(data[key][0]));
      }
    }
  }

  // Cherche les avis dans toutes les clés possibles
  let raw = data?.reviews || data?.data || data?.results || data?.customerReviews || data?.Items || data?.reviewsList || data?.review_list || (Array.isArray(data) ? data : []);

  // Fallback : premier tableau non vide trouvé dynamiquement
  if (!raw.length) {
    for (const key of Object.keys(data || {})) {
      if (Array.isArray(data[key]) && data[key].length > 0) {
        console.log('[Amazon] fallback: using array at key', key);
        raw = data[key];
        break;
      }
    }
  }

  const reviews = [];
  for (const r of raw) {
    const text = r.body || r.text || r.content || r.review || r.reviewText || r.reviewBody || '';
    if (!text.trim()) continue;
    reviews.push({
      author:   r.author || r.reviewer || r.reviewerName || r.name || 'Anonyme',
      rating:   parseFloat(r.rating || r.stars || r.score || r.overallRating || 0),
      title:    r.title || r.headline || r.reviewTitle || '',
      text,
      date:     r.date || r.verified_date || r.published_at || r.reviewDate || '',
      verified: r.verified_purchase ?? r.verifiedPurchase ?? r.verified ?? false,
    });
    if (reviews.length >= MAX_REVIEWS) break;
  }

  return reviews;
}

// ─── Scraper Google (Outscraper) ──────────────────────────────────────────────
// Query = nom établissement + ville (pas l'URL Google Maps directement)
// On extrait le nom depuis l'URL Maps puis on le passe à Outscraper

async function scrapeGoogle(url) {
  const placeName = extractGooglePlaceName(url);
  if (!placeName) throw new Error(
    'Impossible d\'extraire le nom de l\'établissement depuis l\'URL Google Maps. ' +
    'Copiez l\'URL directement depuis la barre d\'adresse sur maps.google.com.'
  );

  const reviews = [];
  const encodedQuery = encodeURIComponent(placeName);

  for (let skip = 0; skip < MAX_PAGES * 20; skip += 20) {
    const response = await fetch(
      `https://local-businesses-by-outscraper.p.rapidapi.com/maps/reviews-v3` +
      `?query=${encodedQuery}&reviewsLimit=20&skip=${skip}&language=fr&region=FR`,
      {
        headers: {
          'X-RapidAPI-Key':  RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'local-businesses-by-outscraper.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      if (skip === 0) throw new Error(`Google Reviews API erreur ${response.status}`);
      break;
    }

    const data = await response.json();

    // Structure Outscraper : data[0] ou data.data[0] = établissement
    const placeData   = data?.data?.[0] || data?.[0];
    const pageReviews = placeData?.reviews || placeData?.reviews_data || [];

    if (!pageReviews.length) break;

    for (const r of pageReviews) {
      const text = r.review_text || r.text || r.snippet || '';
      if (!text.trim()) continue;
      reviews.push({
        author: r.author_title || r.name || 'Anonyme',
        rating: parseFloat(r.review_rating || r.rating || 0),
        title:  '',
        text,
        date:   r.review_datetime_utc || r.date || '',
      });
    }

    if (skip === 0 && placeData?.name) reviews._businessName = placeData.name;
    if (reviews.length >= MAX_REVIEWS)  break;
    if (pageReviews.length < 20)        break;
  }

  return reviews;
}

// ─── Normalisation pour Claude ────────────────────────────────────────────────

function reviewsToText(reviews) {
  return reviews
    .filter(r => r.text?.trim().length > 5)
    .map(r => {
      const stars = r.rating ? `${r.rating}/5 ⭐` : '';
      const title = r.title  ? `"${r.title}" — ` : '';
      const date  = r.date   ? ` (${r.date})`    : '';
      return `${stars} ${title}${r.text}${date}`.trim();
    })
    .join('\n\n---\n\n');
}

// ─── Handler principal ────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!RAPIDAPI_KEY) return res.status(500).json({
    error: 'RAPIDAPI_KEY manquante dans les variables d\'environnement Vercel.'
  });

  const { url } = req.body;
  if (!url?.trim()) return res.status(400).json({ error: 'URL requise.' });

  const platform = detectPlatform(url);
  if (!platform) return res.status(400).json({
    error: 'Plateforme non reconnue. ReviewSense supporte Amazon, Google My Business et TripAdvisor.',
  });

  try {
    let reviews      = [];
    let detectedName = null;

    if (platform === 'amazon') {
      reviews = await scrapeAmazon(url);
    } else if (platform === 'google') {
      reviews = await scrapeGoogle(url);
      detectedName = reviews._businessName || null;
    } else if (platform === 'tripadvisor') {
      reviews = await scrapeTripAdvisor(url);
    }

    if (!reviews.length) return res.status(404).json({
      error: 'Aucun avis trouvé. Vérifiez que l\'URL est bien une page d\'avis publique.'
    });

    const withRating = reviews.filter(r => r.rating > 0);
    const avgRating  = withRating.length
      ? withRating.reduce((s, r) => s + r.rating, 0) / withRating.length
      : null;

    return res.status(200).json({
      platform,
      reviewsText:  reviewsToText(reviews),
      totalReviews: reviews.length,
      avgRating:    avgRating ? Math.round(avgRating * 10) / 10 : null,
      detectedName,
    });

  } catch (error) {
    console.error('Scrape error:', error);
    return res.status(500).json({ error: error.message || 'Erreur lors de la récupération des avis.' });
  }
}
