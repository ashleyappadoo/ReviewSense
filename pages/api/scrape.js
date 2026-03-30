/**
 * ReviewSense V2 — Scraper orchestrator
 * Basé sur les vraies réponses API observées dans RapidAPI
 *
 * TripAdvisor : résultats dans data.results[], 20/page, pagination par data.next
 * Amazon      : endpoint /getAmazReviews, params productId + geoCode (us|de uniquement)
 * Google      : Local Business Data, place_id extrait depuis URL Maps
 * Trustpilot  : trustpilot-company-and-reviews-data, domain extrait depuis URL
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
    if (str.includes('trustpilot.'))  return 'trustpilot';
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
// API : Realtime Amazon Data (jobykjoseph10) sur RapidAPI
// Host : realtime-amazon-data.p.rapidapi.com
// Endpoint : GET /product-reviews?asin=ASIN&country=fr
// Supporte : us, ca, uk, de, fr, it, es, mx, be, pl, au, br, nl, sg...

async function scrapeAmazon(url) {
  const asin = extractAmazonAsin(url);
  if (!asin) throw new Error(
    "ASIN Amazon introuvable. Vérifiez que l'URL pointe vers une page produit (ex: amazon.fr/dp/B09XXXXXX)."
  );

  // Détecte le pays depuis le domaine Amazon
  const countryMap = {
    'amazon.fr': 'fr', 'amazon.de': 'de', 'amazon.co.uk': 'uk',
    'amazon.it': 'it', 'amazon.es': 'es', 'amazon.ca': 'ca',
    'amazon.com.au': 'au', 'amazon.co.jp': 'jp', 'amazon.com.br': 'br',
    'amazon.nl': 'nl', 'amazon.pl': 'pl', 'amazon.se': 'se',
  };
  let country = 'us';
  try {
    const host = new URL(url).hostname.replace('www.', '');
    country = countryMap[host] || 'us';
  } catch {}

  console.log('[Amazon] ASIN:', asin, '| country:', country);

  const reviews = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const response = await fetch(
      `https://realtime-amazon-data.p.rapidapi.com/product-reviews?asin=${asin}&country=${country}&page=${page}`,
      {
        headers: {
          'X-RapidAPI-Key':  RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'realtime-amazon-data.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      if (page === 1) throw new Error(`Amazon API erreur ${response.status}`);
      break;
    }

    const data = await response.json();
    console.log('[Amazon] page', page, 'keys:', Object.keys(data || {}));

    // Realtime Amazon Data retourne data.reviews[] ou data.data[]
    const pageReviews = data?.reviews || data?.data || data?.results || (Array.isArray(data) ? data : []);
    console.log('[Amazon] page', page, 'reviews found:', pageReviews.length);

    if (!pageReviews.length) break;

    for (const r of pageReviews) {
      const text = r.review_comment || r.body || r.text || r.content || r.review || r.reviewText || '';
      if (!text.trim()) continue;
      reviews.push({
        author:   r.reviewer_name || r.author || r.reviewer || r.name || 'Anonyme',
        rating:   parseFloat(r.review_star_rating || r.rating || r.stars || r.score || 0),
        title:    r.review_title || r.title || r.headline || '',
        text,
        date:     r.review_date || r.date || r.published_at || '',
        verified: r.is_verified_purchase ?? r.verified_purchase ?? r.verified ?? false,
      });
    }

    if (reviews.length >= MAX_REVIEWS) break;
    if (pageReviews.length < 10) break; // dernière page
  }

  return reviews;
}
// ─── Scraper Google (Local Business Data) ────────────────────────────────────
// API : Local Business Data (v3) sur RapidAPI
// Host : local-business-data.p.rapidapi.com
// Endpoint : GET /business-reviews-v2?business_id=PLACE_ID
// Le place_id (ChIJ...) est extrait depuis l'URL Google Maps

function extractGooglePlaceId(url) {
  // Format 1 : 0x hex CID dans data= (ex: !1s0xd5525b3c22b39a9:0xdcb57f3098cce1aa)
  // C'est le format le plus courant sur google.fr/maps
  const match1 = url.match(/!1s(0x[a-f0-9]+:0x[a-f0-9]+)/i);
  if (match1) return match1[1];

  // Format 2 : ChIJ place_id dans data= (ex: !1sChIJxxxxxxxx)
  const match2 = url.match(/!1s(ChIJ[a-zA-Z0-9_-]+)/);
  if (match2) return match2[1];

  // Format 3 : place_id dans query param
  try {
    const u = new URL(url);
    const pid = u.searchParams.get('place_id');
    if (pid) return pid;
  } catch {}

  // Format 4 : 0x hex CID seul dans l'URL (sans !1s)
  const match4 = url.match(/(0x[a-f0-9]{10,}:0x[a-f0-9]{10,})/i);
  if (match4) return match4[1];

  return null;
}

async function scrapeGoogle(url) {
  const placeId = extractGooglePlaceId(url);
  if (!placeId) throw new Error(
    "Impossible d'extraire l'identifiant Google depuis l'URL. Copiez l'URL complete depuis la barre d'adresse Google Maps (pas le lien de partage)."
  );

  console.log('[Google] place_id:', placeId);

  const reviews = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const offset = (page - 1) * 20;
    const response = await fetch(
      `https://local-business-data.p.rapidapi.com/business-reviews-v2?business_id=${encodeURIComponent(placeId)}&limit=20&sort_by=most_relevant&region=us&language=en&offset=${offset}`,
      {
        headers: {
          'X-RapidAPI-Key':  RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'local-business-data.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      if (page === 1) throw new Error(`Google Reviews API erreur ${response.status}`);
      break;
    }

    const data = await response.json();
    console.log('[Google] page', page, 'keys:', Object.keys(data || {}));

    // Local Business Data retourne data.data[] avec les reviews
    // Structure réelle : { status, data: { reviews: [...], cursor } }
    const pageReviews = data?.data?.reviews || data?.data || data?.reviews || data?.results || (Array.isArray(data) ? data : []);
    console.log('[Google] page', page, 'reviews found:', pageReviews.length, '| keys:', Object.keys(data || {}));
    if (data?.data) console.log('[Google] data.data keys:', Object.keys(data.data || {}));

    // Récupère le nom de l'établissement si disponible
    if (page === 1 && data?.data?.business_name) reviews._businessName = data.data.business_name;
    if (page === 1 && data?.data?.name) reviews._businessName = data.data.name;
    if (page === 1 && data?.business_name) reviews._businessName = data.business_name;

    if (!pageReviews.length) break;

    for (const r of pageReviews) {
      // Champs réels confirmés depuis l'API Local Business Data
      const text = r.review_text || r.text || r.snippet || r.body || r.content || '';
      if (!text.trim()) continue;
      reviews.push({
        author: r.author_name || r.author_title || r.reviewer_name || r.name || 'Anonyme',
        rating: parseFloat(r.rating || r.review_rating || r.stars || 0),
        title:  '',
        text,
        date:   r.review_datetime_utc || r.published_at || r.date || '',
      });
    }

    if (reviews.length >= MAX_REVIEWS) break;
    if (pageReviews.length < 20) break;
  }

  return reviews;
}
// ─── Scraper Trustpilot ───────────────────────────────────────────────────────
// API : Trustpilot Company and Reviews Data sur RapidAPI
// Host : trustpilot-company-and-reviews-data.p.rapidapi.com
// Endpoint : GET /company-reviews?company_domain=smileandpay.com
// URL exemple : https://www.trustpilot.com/review/www.smileandpay.com

function extractTrustpilotDomain(url) {
  // Patterns supportés :
  // https://www.trustpilot.com/review/www.smileandpay.com   → smileandpay.com
  // https://fr.trustpilot.com/review/www.smileandpay.com    → smileandpay.com
  // https://www.trustpilot.com/review/smileandpay.com       → smileandpay.com
  try {
    const match = url.match(/trustpilot\.com\/review\/(?:www\.)?([^/?#\s]+)/i);
    if (match) return match[1].replace(/^www\./, '');
  } catch {}
  return null;
}

async function scrapeTrustpilot(url) {
  const domain = extractTrustpilotDomain(url);
  if (!domain) throw new Error(
    "Impossible d'extraire le domaine depuis l'URL Trustpilot. Format attendu : trustpilot.com/review/votresite.com"
  );

  console.log('[Trustpilot] domain:', domain);

  const reviews = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const response = await fetch(
      `https://trustpilot-company-and-reviews-data.p.rapidapi.com/company-reviews?company_domain=${encodeURIComponent(domain)}&date_posted=any&locale=fr-FR&page=${page}`,
      {
        headers: {
          'X-RapidAPI-Key':  RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'trustpilot-company-and-reviews-data.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      if (page === 1) throw new Error(`Trustpilot API erreur ${response.status}`);
      break;
    }

    const data = await response.json();
    console.log('[Trustpilot] page', page, 'keys:', Object.keys(data || {}));

    // Structure réelle : { status, request_id, parameters, data: { reviews: [...] } }
    const pageReviews = data?.data?.reviews || data?.data || data?.reviews || (Array.isArray(data) ? data : []);
    console.log('[Trustpilot] page', page, 'reviews:', pageReviews?.length, '| data keys:', Object.keys(data?.data || {}));

    // Detect business name
    if (page === 1) {
      const biz = data?.data?.businessUnit || data?.data?.company || data?.company || {};
      reviews._businessName = biz?.displayName || biz?.name || data?.businessName || data?.name || null;
      console.log('[Trustpilot] businessName:', reviews._businessName);
    }

    if (!pageReviews.length) break;

    for (const r of pageReviews) {
      const text = r.text || r.review || r.content || r.body || r.reviewText || '';
      if (!text.trim()) continue;
      reviews.push({
        author: r.consumer?.displayName || r.author || r.reviewer || r.name || 'Anonyme',
        rating: parseFloat(r.rating || r.stars || r.score || 0),
        title:  r.title || r.headline || '',
        text,
        date:   r.dates?.publishedDate || r.date || r.createdAt || r.published_at || '',
      });
    }

    if (reviews.length >= MAX_REVIEWS) break;

    // Check if more pages available
    const totalPages = data?.data?.totalPages || data?.data?.pagination?.totalPages || data?.totalPages || 999;
    console.log('[Trustpilot] totalPages:', totalPages);
    if (page >= totalPages) break;
    if (pageReviews.length < 20) break;
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
    error: 'Plateforme non reconnue. ReviewSense supporte Amazon, Google My Business, TripAdvisor et Trustpilot.',
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
    } else if (platform === 'trustpilot') {
      reviews = await scrapeTrustpilot(url);
      detectedName = reviews._businessName || null;
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
