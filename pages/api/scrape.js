/**
 * ReviewSense V2 — Scraper orchestrator
 * Détecte la plateforme depuis l'URL et appelle la bonne API RapidAPI
 * Gère la pagination automatiquement jusqu'à MAX_PAGES
 */

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const MAX_PAGES = 5;      // max pages à scraper par plateforme
const MAX_REVIEWS = 150;  // cap total pour garder l'analyse rapide

// ─── Vercel serverless config ─────────────────────────────────────────────────
export const config = {
  maxDuration: 30, // secondes (Vercel Pro = 300s, Hobby = 10s)
};

// ─── Platform detection ───────────────────────────────────────────────────────

export function detectPlatform(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    const host = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();

    if (host.includes('amazon.')) return 'amazon';
    if (host.includes('tripadvisor.')) return 'tripadvisor';
    if (
      host.includes('google.com') && (path.includes('/maps') || path.includes('place')) ||
      host.includes('maps.google.') ||
      host.includes('maps.app.goo.gl') ||
      host.includes('g.page') ||
      url.includes('CwVJAB') // Google Maps short URL pattern
    ) return 'google';

    return null;
  } catch {
    return null;
  }
}

// ─── URL parsers ──────────────────────────────────────────────────────────────

function extractAmazonAsin(url) {
  // Patterns: /dp/ASIN, /product/ASIN, /gp/product/ASIN
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/product\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/gp\/aw\/d\/([A-Z0-9]{10})/i,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractAmazonDomain(url) {
  // Returns marketplace code: com, fr, de, co.uk, etc.
  try {
    const host = new URL(url).hostname; // amazon.fr, www.amazon.co.uk
    const match = host.match(/amazon\.(.+)$/);
    return match ? match[1] : 'com';
  } catch {
    return 'com';
  }
}

// ─── Scrapers ─────────────────────────────────────────────────────────────────

async function scrapeAmazon(url) {
  const asin = extractAmazonAsin(url);
  if (!asin) throw new Error('ASIN Amazon introuvable dans l\'URL. Vérifiez que l\'URL pointe vers une page produit.');

  const domain = extractAmazonDomain(url);
  const reviews = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const response = await fetch(
      `https://amazon-review-scraping.p.rapidapi.com/?asin=${asin}&page=${page}&country=${domain}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'amazon-review-scraping.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      if (page === 1) throw new Error(`Amazon API erreur: ${response.status}`);
      break; // stop pagination silently if later pages fail
    }

    const data = await response.json();

    // Normalize — the API returns data.reviews or data.data or array directly
    const pageReviews = data?.reviews || data?.data || (Array.isArray(data) ? data : []);
    if (!pageReviews.length) break;

    for (const r of pageReviews) {
      reviews.push({
        author: r.author || r.name || r.reviewer || 'Anonyme',
        rating: parseFloat(r.rating || r.stars || r.score || 0),
        title: r.title || r.headline || '',
        text: r.body || r.text || r.content || r.review || '',
        date: r.date || r.verified_date || r.published_at || '',
        verified: r.verified_purchase ?? r.verified ?? false,
      });
    }

    if (reviews.length >= MAX_REVIEWS) break;
    if (pageReviews.length < 10) break; // likely last page
  }

  return reviews;
}

async function scrapeGoogle(url) {
  // Using Outscraper Google Maps Reviews API on RapidAPI
  // API: outscraper.p.rapidapi.com
  const reviews = [];

  // Encode the place URL for the query param
  const encodedUrl = encodeURIComponent(url);

  for (let skip = 0; skip < MAX_PAGES * 20; skip += 20) {
    const response = await fetch(
      `https://outscraper.p.rapidapi.com/maps/reviews-v3?query=${encodedUrl}&reviewsLimit=20&skip=${skip}&sort=mostRelevant&language=fr`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'outscraper.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      if (skip === 0) throw new Error(`Google Reviews API erreur: ${response.status}`);
      break;
    }

    const data = await response.json();

    // Outscraper returns data[0].reviews array
    const placeData = data?.data?.[0] || data?.[0];
    const pageReviews = placeData?.reviews || placeData?.reviews_data || [];

    if (!pageReviews.length) break;

    for (const r of pageReviews) {
      reviews.push({
        author: r.author_title || r.name || 'Anonyme',
        rating: parseFloat(r.review_rating || r.rating || 0),
        title: '',
        text: r.review_text || r.text || r.snippet || '',
        date: r.review_datetime_utc || r.date || '',
        verified: false,
      });
    }

    // Extract business name from first page
    if (skip === 0 && placeData?.name) {
      reviews._businessName = placeData.name;
    }

    if (reviews.length >= MAX_REVIEWS) break;
    if (pageReviews.length < 20) break;
  }

  return reviews;
}

async function scrapeTripAdvisor(url) {
  // Using Tripadvisor Scraper by Chetan11dev on RapidAPI
  const reviews = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    // TripAdvisor uses offset-based pagination (0, 10, 20…)
    const offset = page * 10;
    const encodedUrl = encodeURIComponent(url);

    const response = await fetch(
      `https://tripadvisor-scraper.p.rapidapi.com/reviews?url=${encodedUrl}&offset=${offset}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'tripadvisor-scraper.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      if (page === 0) throw new Error(`TripAdvisor API erreur: ${response.status}`);
      break;
    }

    const data = await response.json();
    const pageReviews = data?.reviews || data?.data || (Array.isArray(data) ? data : []);

    if (!pageReviews.length) break;

    for (const r of pageReviews) {
      reviews.push({
        author: r.username || r.author || r.name || 'Anonyme',
        rating: parseFloat(r.rating || r.bubbleRating || r.score || 0),
        title: r.title || r.headline || '',
        text: r.text || r.review || r.content || r.reviewText || '',
        date: r.date || r.publishedDate || r.createdAt || '',
        verified: false,
      });
    }

    if (reviews.length >= MAX_REVIEWS) break;
    if (pageReviews.length < 10) break;
  }

  return reviews;
}

// ─── Normalizer for Claude ────────────────────────────────────────────────────

function reviewsToText(reviews) {
  return reviews
    .filter(r => r.text && r.text.trim().length > 5)
    .map(r => {
      const stars = r.rating ? `${r.rating}/5 ⭐` : '';
      const title = r.title ? `"${r.title}" — ` : '';
      const date = r.date ? ` (${r.date})` : '';
      return `${stars} ${title}${r.text}${date}`.trim();
    })
    .join('\n\n---\n\n');
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!RAPIDAPI_KEY) {
    return res.status(500).json({ error: 'Configuration serveur manquante (RAPIDAPI_KEY).' });
  }

  const { url } = req.body;
  if (!url?.trim()) return res.status(400).json({ error: 'URL requise.' });

  const platform = detectPlatform(url);
  if (!platform) {
    return res.status(400).json({
      error: 'Plateforme non reconnue. ReviewSense supporte Amazon, Google My Business et TripAdvisor.',
    });
  }

  try {
    let reviews = [];
    let detectedName = null;

    if (platform === 'amazon') {
      reviews = await scrapeAmazon(url);
    } else if (platform === 'google') {
      reviews = await scrapeGoogle(url);
      detectedName = reviews._businessName || null;
    } else if (platform === 'tripadvisor') {
      reviews = await scrapeTripAdvisor(url);
    }

    if (!reviews.length) {
      return res.status(404).json({
        error: 'Aucun avis trouvé. Vérifiez que l\'URL est bien une page d\'avis et qu\'elle est accessible.',
      });
    }

    const reviewsText = reviewsToText(reviews);
    const avgRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.filter(r => r.rating).length;

    return res.status(200).json({
      platform,
      reviewsText,
      totalReviews: reviews.length,
      avgRating: isNaN(avgRating) ? null : Math.round(avgRating * 10) / 10,
      detectedName,
    });
  } catch (error) {
    console.error('Scrape error:', error);
    return res.status(500).json({ error: error.message || 'Erreur lors de la récupération des avis.' });
  }
}
