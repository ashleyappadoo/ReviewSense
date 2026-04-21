import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';

const PLATFORMS = {
  amazon:      { label: 'Amazon',            icon: '📦' },
  google:      { label: 'Google My Business', icon: '⭐' },
  tripadvisor: { label: 'TripAdvisor',        icon: '🦉' },
  trustpilot:  { label: 'Trustpilot',         icon: '🟢' },
};

const URL_PATTERNS = {
  amazon:      /amazon\.|amzn\.eu|amzn\.to/i,
  tripadvisor: /tripadvisor\./i,
  google:      /google\.[a-z.]+\/maps|maps\.google\.|maps\.app\.goo\.gl|g\.page/i,
  trustpilot:  /trustpilot\./i,
};

const T = {
  fr: {
    tagline:       '✦ Analyse d\'avis par IA',
    heroTitle:     'Collez une URL.',
    heroHighlight: 'Obtenez vos insights.',
    heroSub:       'ReviewSense extrait automatiquement vos avis Amazon, Google, TripAdvisor ou Trustpilot et génère un rapport actionnable en 30 secondes.',
    ctaAnalyze:    'Analyser mes avis',
    ctaHistory:    'Mes analyses',
    featExtract:   '⚡ Extraction automatique',
    featMulti:     '📄 Multi-pages',
    featActions:   '🎯 Actions concrètes',
    featHistory:   '💾 Historique local',
    navHistory:    'Historique',
    setup:         'Configuration',
    setupTitle:    'Paramètres de l\'analyse',
    urlLabel:      'URL DE LA PAGE D\'AVIS',
    urlPlaceholder:'https://...',
    urlDetected:   'détecté — prêt à extraire',
    urlError:      'Plateforme non supportée. Utilisez Amazon, Google Maps, TripAdvisor ou Trustpilot.',
    sectorLabel:   'SECTEUR',
    sectorOpt:     '(optionnel, améliore l\'analyse)',
    ecommerce:     '🛍️ E-commerce',
    restaurant:    '🍽️ Restauration',
    langLabel:     'LANGUE DU RAPPORT',
    nameLabel:     'NOM DE L\'ÉTABLISSEMENT',
    nameOpt:       '(optionnel)',
    namePlaceholder:'Laissez vide pour détection automatique',
    nameHint:      'Si vide, ReviewSense tentera de détecter le nom depuis la page.',
    launchBtn:     '✦ Lancer l\'extraction et l\'analyse',
    analyzing:     'Analyse en cours…',
    analyzingSub:  'ReviewSense analyse les patterns dans vos avis et identifie les opportunités d\'amélioration.',
    steps: [
      'Connexion à la plateforme…',
      'Extraction des avis…',
      'Récupération des pages…',
      'Analyse par ReviewSense…',
      'Génération du rapport…',
    ],
    reportTitle:   'Rapport d\'analyse',
    newAnalysis:   '+ Nouvelle',
    historyTitle:  'Mes analyses',
    historyNew:    '+ Nouvelle analyse',
    historySub:    (n) => `${n} analyse${n!==1?'s':''} sauvegardée${n!==1?'s':''} dans ce navigateur`,
    historyEmpty:  'Aucune analyse pour l\'instant. Lancez votre première analyse pour la voir apparaître ici.',
    reviewsCount:  'avis analysés',
    scoreLabel:    'Score satisfaction',
    summaryLabel:  'Résumé général',
    themesLabel:   'Thèmes clés détectés',
    frictionLabel: 'Points de friction',
    strengthLabel: 'Points forts',
    verbatimLabel: 'Verbatims clients',
    actionsLabel:  'Actions recommandées',
    oppLabel:      'Opportunités identifiées',
    examplesLabel: 'Exemples d\'URL valides',
  },
  en: {
    tagline:       '✦ AI-powered review analysis',
    heroTitle:     'Paste a URL.',
    heroHighlight: 'Get your insights.',
    heroSub:       'ReviewSense automatically extracts your Amazon, Google, TripAdvisor or Trustpilot reviews and generates an actionable report in 30 seconds.',
    ctaAnalyze:    'Analyze my reviews',
    ctaHistory:    'My analyses',
    featExtract:   '⚡ Auto extraction',
    featMulti:     '📄 Multi-page',
    featActions:   '🎯 Concrete actions',
    featHistory:   '💾 Local history',
    navHistory:    'History',
    setup:         'Setup',
    setupTitle:    'Analysis settings',
    urlLabel:      'REVIEWS PAGE URL',
    urlPlaceholder:'https://...',
    urlDetected:   'detected — ready to extract',
    urlError:      'Platform not supported. Use Amazon, Google Maps, TripAdvisor or Trustpilot.',
    sectorLabel:   'SECTOR',
    sectorOpt:     '(optional, improves analysis)',
    ecommerce:     '🛍️ E-commerce',
    restaurant:    '🍽️ Restaurant',
    langLabel:     'REPORT LANGUAGE',
    nameLabel:     'BUSINESS NAME',
    nameOpt:       '(optional)',
    namePlaceholder:'Leave blank for auto detection',
    nameHint:      'If empty, ReviewSense will try to detect the name from the page.',
    launchBtn:     '✦ Start extraction & analysis',
    analyzing:     'Analyzing…',
    analyzingSub:  'ReviewSense is analyzing patterns in your reviews and identifying improvement opportunities.',
    steps: [
      'Connecting to platform…',
      'Extracting reviews…',
      'Retrieving pages…',
      'Analyzing with ReviewSense…',
      'Generating report…',
    ],
    reportTitle:   'Analysis Report',
    newAnalysis:   '+ New',
    historyTitle:  'My analyses',
    historyNew:    '+ New analysis',
    historySub:    (n) => `${n} ${n!==1?'analyses':'analysis'} saved in this browser`,
    historyEmpty:  'No analyses yet. Launch your first analysis to see it appear here.',
    reviewsCount:  'reviews analyzed',
    scoreLabel:    'Satisfaction score',
    summaryLabel:  'General summary',
    themesLabel:   'Key themes detected',
    frictionLabel: 'Friction points',
    strengthLabel: 'Strengths',
    verbatimLabel: 'Customer quotes',
    actionsLabel:  'Recommended actions',
    oppLabel:      'Identified opportunities',
    examplesLabel: 'Valid URL examples',
  },
};

function detectPlatformClient(url) {
  for (const [platform, pattern] of Object.entries(URL_PATTERNS)) {
    if (pattern.test(url)) return platform;
  }
  return null;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getScoreColor(score) {
  return score >= 8 ? '#27ae60' : score >= 6 ? '#e67e22' : '#e74c3c';
}

const STEP_ICONS = ['🔗', '📥', '📄', '🧠', '📊'];

export default function Home() {
  const [step, setStep]               = useState('landing');
  const [lang, setLang]               = useState('fr');
  const [url, setUrl]                 = useState('');
  const [detectedPlatform, setDP]     = useState(null);
  const [sector, setSector]           = useState('');
  const [businessName, setBN]         = useState('');
  const [results, setResults]         = useState(null);
  const [currentMeta, setCM]          = useState(null);
  const [error, setError]             = useState('');
  const [history, setHistory]         = useState([]);
  const [analyzingStep, setAS]        = useState(0);

  const t = T[lang];

  useEffect(() => {
    try {
      const h = localStorage.getItem('rs_history_v2');
      if (h) setHistory(JSON.parse(h));
    } catch {}
  }, []);

  useEffect(() => {
    setDP(detectPlatformClient(url));
  }, [url]);

  const saveToHistory = (res, meta, stats) => {
    try {
      const entry = { id: Date.now().toString(), date: new Date().toISOString(), ...meta, ...stats, score: res.score, summary: res.summary, results: res };
      const newH = [entry, ...history].slice(0, 20);
      setHistory(newH);
      localStorage.setItem('rs_history_v2', JSON.stringify(newH));
    } catch {}
  };

  const deleteEntry = (id) => {
    const n = history.filter(h => h.id !== id);
    setHistory(n);
    try { localStorage.setItem('rs_history_v2', JSON.stringify(n)); } catch {}
  };

  const loadEntry = (entry) => {
    setResults(entry.results);
    setCM({ businessName: entry.businessName, sector: entry.sector, platform: entry.platform, totalReviews: entry.totalReviews, avgRating: entry.avgRating });
    setStep('results');
  };

  const runAnalysis = async () => {
    if (!url.trim() || !detectedPlatform) return;
    setError('');
    setStep('analyzing');
    setAS(0);
    const timer = setInterval(() => setAS(prev => Math.min(prev + 1, 4)), 2200);
    try {
      const scrapeRes = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const scrapeData = await scrapeRes.json();
      if (scrapeData.error) throw new Error(scrapeData.error);
      setAS(3);
      const finalName = businessName || scrapeData.detectedName || '';
      const meta = { businessName: finalName, sector, platform: scrapeData.platform || detectedPlatform };
      setCM({ ...meta, totalReviews: scrapeData.totalReviews, avgRating: scrapeData.avgRating });
      const analyzeRes = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reviewsText: scrapeData.reviewsText, sector, platform: scrapeData.platform, businessName: finalName, totalReviews: scrapeData.totalReviews, avgRating: scrapeData.avgRating, lang }) });
      const analysisData = await analyzeRes.json();
      if (analysisData.error) throw new Error(analysisData.error);
      setAS(4);
      clearInterval(timer);
      saveToHistory(analysisData, meta, { totalReviews: scrapeData.totalReviews, avgRating: scrapeData.avgRating });
      setResults(analysisData);
      setTimeout(() => setStep('results'), 600);
    } catch (e) {
      clearInterval(timer);
      setError(e.message);
      setStep('setup');
    }
  };

  const reset = () => { setStep('landing'); setResults(null); setCM(null); setUrl(''); setBN(''); setSector(''); setError(''); setDP(null); };

  const pInfo = (id) => PLATFORMS[id] || { label: id, icon: '📋' };
  const sLabel = (id) => id === 'ecommerce' ? t.ecommerce : id === 'restaurant' ? t.restaurant : id;

  return (
    <>
      <Head>
        <title>ReviewSense — Analyse d'avis clients par IA pour TPE et PME</title>
        <meta name="description" content="Analysez automatiquement vos avis Google My Business, Amazon et TripAdvisor. Obtenez des insights actionnables en 30 secondes grâce à l'IA. Outil gratuit par ONA." />
        <meta name="keywords" content="analyse avis clients, Google My Business, TripAdvisor, Amazon reviews, e-réputation, TPE PME, intelligence artificielle" />
        <meta property="og:title" content="ReviewSense — Analyse d'avis clients par IA" />
        <meta property="og:description" content="Collez une URL. Obtenez vos insights clients en 30 secondes. Outil gratuit pour TPE et PME par ONA." />
        <meta property="og:url" content="https://reviewsense.vercel.app" />
        <meta name="twitter:title" content="ReviewSense — Analyse d'avis clients par IA" />
        <meta name="twitter:description" content="Analysez vos avis Google, Amazon et TripAdvisor automatiquement." />
      </Head>

      <style jsx global>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif;background:#faf8ff;min-height:100vh;overflow-x:hidden}
        :root{--lavender:#c5b8f8;--peach:#ffc8a8;--mint:#b8f0e0;--rose:#f8c5d8;--card:rgba(255,255,255,0.88);--text:#1a1525;--muted:#7a6d8a;--border:rgba(197,184,248,0.3)}
        .mesh-bg{position:fixed;inset:0;z-index:0;background:radial-gradient(ellipse at 8% 15%,rgba(197,184,248,0.45) 0%,transparent 50%),radial-gradient(ellipse at 88% 8%,rgba(255,200,168,0.4) 0%,transparent 45%),radial-gradient(ellipse at 45% 85%,rgba(184,240,224,0.38) 0%,transparent 52%),radial-gradient(ellipse at 92% 75%,rgba(248,197,216,0.32) 0%,transparent 42%),#faf8ff}
        .app{position:relative;z-index:1;min-height:100vh;display:flex;flex-direction:column}
        nav{padding:18px 48px;display:flex;align-items:center;justify-content:space-between;backdrop-filter:blur(16px);border-bottom:1px solid var(--border);background:rgba(250,248,255,0.72);position:sticky;top:0;z-index:100}
        .logo{font-family:'Bricolage Grotesque',sans-serif;font-size:1.45rem;font-weight:800;background:linear-gradient(135deg,#7c5cbf,#d4609a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;cursor:pointer;letter-spacing:-0.5px}
        .logo span{background:linear-gradient(135deg,#d4609a,#f4a261);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .nav-right{display:flex;align-items:center;gap:10px}
        .nav-btn{padding:8px 18px;background:rgba(255,255,255,0.75);border:1.5px solid var(--border);border-radius:40px;font-size:0.82rem;font-weight:600;color:var(--muted);cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:6px}
        .nav-btn:hover,.nav-btn.active{border-color:#b08fe0;color:#7c5cbf;background:rgba(197,184,248,0.18)}
        .lang-toggle{display:flex;align-items:center;background:rgba(255,255,255,0.7);border:1.5px solid var(--border);border-radius:40px;padding:3px;gap:2px}
        .lang-btn{padding:5px 12px;border-radius:30px;border:none;font-size:0.8rem;font-weight:700;cursor:pointer;transition:all 0.2s;background:transparent;color:var(--muted)}
        .lang-btn.active{background:linear-gradient(135deg,#7c5cbf,#d4609a);color:white;box-shadow:0 2px 8px rgba(124,92,191,0.3)}
        .nav-badge{font-size:0.72rem;font-weight:700;background:linear-gradient(135deg,var(--lavender),var(--peach));padding:5px 14px;border-radius:20px;color:#5b3ea0}
        .nav-rdv-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 18px;background:linear-gradient(135deg,#7c5cbf,#d4609a);color:white;font-size:0.82rem;font-weight:700;border-radius:40px;text-decoration:none;transition:all 0.2s;box-shadow:0 3px 12px rgba(124,92,191,0.3);white-space:nowrap}
        .nav-rdv-btn:hover{transform:translateY(-1px);box-shadow:0 5px 18px rgba(124,92,191,0.45)}
        .landing{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 24px;text-align:center;gap:36px}
        .hero-tag{display:inline-flex;align-items:center;gap:8px;font-size:0.78rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#7c5cbf;background:rgba(197,184,248,0.22);padding:7px 18px;border-radius:20px;border:1px solid rgba(197,184,248,0.45)}
        h1{font-family:'Bricolage Grotesque',sans-serif;font-size:clamp(2.8rem,6vw,4.4rem);font-weight:800;line-height:1.08;color:var(--text);letter-spacing:-2.5px;max-width:780px}
        .hl{background:linear-gradient(135deg,#7c5cbf 0%,#d4609a 55%,#f4a261 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .hero-sub{font-size:1.12rem;color:var(--muted);max-width:540px;line-height:1.75}
        .quick-input-wrap{width:100%;max-width:580px;position:relative}
        .quick-input{width:100%;padding:18px 170px 18px 22px;background:rgba(255,255,255,0.95);border:2px solid var(--border);border-radius:16px;font-family:'DM Sans',sans-serif;font-size:1rem;color:var(--text);outline:none;transition:all 0.2s;box-shadow:0 4px 24px rgba(0,0,0,0.06)}
        .quick-input:focus{border-color:#b08fe0;box-shadow:0 4px 24px rgba(176,143,224,0.2)}
        .quick-input::placeholder{color:#b0a5c0}
        .quick-submit{position:absolute;right:8px;top:50%;transform:translateY(-50%);padding:10px 22px;background:linear-gradient(135deg,#7c5cbf,#d4609a);color:white;font-family:'Bricolage Grotesque',sans-serif;font-size:0.9rem;font-weight:700;border-radius:10px;border:none;cursor:pointer;transition:all 0.2s}
        .quick-submit:hover{box-shadow:0 4px 16px rgba(124,92,191,0.4)}
        .quick-submit:disabled{opacity:0.5;cursor:not-allowed}
        .platform-detected{display:inline-flex;align-items:center;gap:8px;font-size:0.82rem;font-weight:600;color:#5b3ea0;background:rgba(197,184,248,0.2);padding:6px 14px;border-radius:20px;border:1px solid rgba(197,184,248,0.4);margin-top:10px}
        .platforms-row,.features-row{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:680px}
        .platform-pill,.feat-pill{display:flex;align-items:center;gap:7px;padding:9px 18px;background:rgba(255,255,255,0.75);border:1px solid var(--border);border-radius:40px;font-size:0.84rem;font-weight:500;color:var(--text);backdrop-filter:blur(8px)}
        .cta-row{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
        .cta-btn{display:inline-flex;align-items:center;gap:10px;padding:16px 38px;background:linear-gradient(135deg,#7c5cbf,#d4609a);color:white;font-family:'Bricolage Grotesque',sans-serif;font-size:1.05rem;font-weight:700;border-radius:50px;border:none;cursor:pointer;transition:all 0.3s;box-shadow:0 8px 32px rgba(124,92,191,0.35)}
        .cta-btn:hover{transform:translateY(-2px);box-shadow:0 14px 42px rgba(124,92,191,0.45)}
        .cta-btn:disabled{opacity:0.6;cursor:not-allowed;transform:none}
        .cta-btn-sm{padding:10px 22px;font-size:0.9rem}
        .cta-btn-outline{display:inline-flex;align-items:center;gap:8px;padding:16px 28px;background:rgba(255,255,255,0.8);border:1.5px solid var(--border);color:var(--text);font-family:'Bricolage Grotesque',sans-serif;font-size:1rem;font-weight:600;border-radius:50px;cursor:pointer;transition:all 0.3s}
        .cta-btn-outline:hover{border-color:#b08fe0;color:#7c5cbf;transform:translateY(-2px)}
        .setup{flex:1;display:flex;flex-direction:column;align-items:center;padding:40px 24px;gap:18px;max-width:680px;margin:0 auto;width:100%}
        .page-eyebrow{font-size:0.75rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#b08fe0;margin-bottom:8px;text-align:center}
        .page-h2{font-family:'Bricolage Grotesque',sans-serif;font-size:2rem;font-weight:800;color:var(--text);letter-spacing:-1px;text-align:center}
        .card{background:var(--card);border:1px solid var(--border);border-radius:22px;padding:22px;width:100%;backdrop-filter:blur(14px);box-shadow:0 4px 28px rgba(0,0,0,0.04)}
        .card-title{font-size:0.8rem;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);margin-bottom:14px}
        .url-input{width:100%;padding:13px 40px 13px 16px;background:rgba(255,255,255,0.95);border:2px solid var(--border);border-radius:12px;font-family:'DM Sans',sans-serif;font-size:0.95rem;color:var(--text);outline:none;transition:all 0.25s;position:relative}
        .url-input:focus{border-color:#b08fe0;box-shadow:0 0 0 3px rgba(176,143,224,0.12)}
        .url-wrap{position:relative}
        .url-clear{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--muted);font-size:1.2rem;line-height:1}
        .platform-badge{display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:12px;font-size:0.88rem;font-weight:600;margin-top:10px;border:1.5px solid}
        .badge-ok{background:rgba(197,184,248,0.15);border-color:rgba(197,184,248,0.5);color:#5b3ea0}
        .badge-err{background:rgba(231,76,60,0.08);border-color:rgba(231,76,60,0.3);color:#c0392b}
        .pill-grid{display:flex;gap:10px;flex-wrap:wrap}
        .pill{display:flex;align-items:center;gap:8px;padding:10px 20px;background:rgba(255,255,255,0.85);border:2px solid transparent;border-radius:40px;cursor:pointer;font-size:0.9rem;font-weight:600;color:var(--text);transition:all 0.2s}
        .pill:hover{border-color:var(--lavender)}
        .pill.sel{background:linear-gradient(135deg,rgba(197,184,248,0.3),rgba(255,200,168,0.2));border-color:#b08fe0;color:#5b3ea0}
        .form-input{width:100%;background:rgba(255,255,255,0.95);border:1.5px solid var(--border);border-radius:12px;padding:12px 16px;font-family:'DM Sans',sans-serif;font-size:0.95rem;color:var(--text);outline:none;transition:border-color 0.2s}
        .form-input:focus{border-color:#b08fe0;box-shadow:0 0 0 3px rgba(176,143,224,0.12)}
        .field-hint{font-size:0.76rem;color:var(--muted);margin-top:6px;font-style:italic}
        .analyze-btn{width:100%;padding:17px;background:linear-gradient(135deg,#7c5cbf,#d4609a);color:white;font-family:'Bricolage Grotesque',sans-serif;font-size:1.08rem;font-weight:700;border-radius:14px;border:none;cursor:pointer;transition:all 0.3s;box-shadow:0 6px 28px rgba(124,92,191,0.3)}
        .analyze-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 36px rgba(124,92,191,0.42)}
        .analyze-btn:disabled{opacity:0.6;cursor:not-allowed}
        .error-msg{background:rgba(231,76,60,0.08);border:1.5px solid rgba(231,76,60,0.25);border-radius:12px;padding:13px 16px;font-size:0.85rem;color:#c0392b;width:100%;line-height:1.5}
        .analyzing{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:32px;padding:60px 24px;text-align:center}
        .pulse-orb{width:110px;height:110px;border-radius:50%;background:linear-gradient(135deg,var(--lavender),var(--peach),var(--mint));display:flex;align-items:center;justify-content:center;font-size:2.6rem;animation:pulse 2s ease-in-out infinite}
        @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(197,184,248,0.7)}70%{box-shadow:0 0 0 28px rgba(197,184,248,0)}100%{box-shadow:0 0 0 0 rgba(197,184,248,0)}}
        .an-h2{font-family:'Bricolage Grotesque',sans-serif;font-size:1.9rem;font-weight:800;color:var(--text);letter-spacing:-1px}
        .an-sub{color:var(--muted);max-width:380px;line-height:1.6}
        .steps-list{display:flex;flex-direction:column;gap:10px;text-align:left;min-width:280px}
        .step-item{display:flex;align-items:center;gap:12px;padding:10px 16px;border-radius:12px;font-size:0.88rem;font-weight:500;transition:all 0.4s;color:var(--muted)}
        .step-item.active{background:rgba(255,255,255,0.8);color:var(--text);font-weight:600;box-shadow:0 2px 12px rgba(0,0,0,0.05)}
        .step-item.done{color:#27ae60;background:rgba(39,174,96,0.06)}
        .history-page{flex:1;padding:40px 48px;max-width:920px;margin:0 auto;width:100%}
        .history-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:6px}
        .history-sub{color:var(--muted);font-size:0.9rem;margin-bottom:28px}
        .history-empty{text-align:center;padding:64px 24px;color:var(--muted)}
        .history-empty .ei{font-size:3.2rem;margin-bottom:16px}
        .history-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:16px}
        .hc{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:22px;backdrop-filter:blur(14px);cursor:pointer;transition:all 0.25s;box-shadow:0 3px 18px rgba(0,0,0,0.04);position:relative;overflow:hidden}
        .hc::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--lavender),var(--peach));opacity:0;transition:opacity 0.2s}
        .hc:hover{transform:translateY(-3px);box-shadow:0 10px 36px rgba(124,92,191,0.12);border-color:rgba(197,184,248,0.5)}
        .hc:hover::before{opacity:1}
        .hc-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px}
        .hc-score{font-family:'Bricolage Grotesque',sans-serif;font-size:1.5rem;font-weight:800}
        .hc-name{font-family:'Bricolage Grotesque',sans-serif;font-size:1rem;font-weight:700;color:var(--text);margin-bottom:4px}
        .hc-meta{font-size:0.76rem;color:var(--muted);margin-bottom:10px}
        .hc-summary{font-size:0.82rem;color:var(--muted);line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        .hc-footer{display:flex;align-items:center;justify-content:space-between;margin-top:14px}
        .hc-date{font-size:0.74rem;color:var(--muted)}
        .hc-count{font-size:0.74rem;color:var(--muted);background:rgba(197,184,248,0.2);padding:3px 10px;border-radius:20px}
        .hc-del{position:absolute;top:14px;right:14px;width:26px;height:26px;border-radius:50%;background:rgba(255,100,100,0.1);border:none;cursor:pointer;font-size:0.72rem;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;color:#c0392b}
        .hc:hover .hc-del{opacity:1}
        .results{flex:1;padding:40px 24px 60px;max-width:900px;margin:0 auto;width:100%}
        .rh{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:32px;flex-wrap:wrap;gap:16px}
        .rh-left h2{font-family:'Bricolage Grotesque',sans-serif;font-size:2.1rem;font-weight:800;color:var(--text);letter-spacing:-1px;margin-bottom:6px}
        .rh-meta{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
        .rh-badge{display:inline-flex;align-items:center;gap:6px;font-size:0.78rem;font-weight:600;padding:5px 12px;border-radius:20px;background:rgba(255,255,255,0.8);border:1px solid var(--border);color:var(--muted)}
        .rh-actions{display:flex;gap:10px;flex-wrap:wrap}
        .ghost-btn{padding:10px 20px;background:white;border:1.5px solid var(--border);border-radius:40px;font-size:0.84rem;font-weight:600;color:var(--muted);cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:6px}
        .ghost-btn:hover{border-color:#b08fe0;color:#7c5cbf}
        .bento{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .bc{background:var(--card);border:1px solid var(--border);border-radius:22px;padding:24px;backdrop-filter:blur(14px);box-shadow:0 4px 28px rgba(0,0,0,0.04)}
        .bc.full{grid-column:1/-1}
        .bc.purple{background:linear-gradient(135deg,rgba(197,184,248,0.28),rgba(197,184,248,0.08));border-color:rgba(197,184,248,0.45)}
        .bc.peach{background:linear-gradient(135deg,rgba(255,200,168,0.28),rgba(255,200,168,0.08));border-color:rgba(255,200,168,0.45)}
        .bc.mint{background:linear-gradient(135deg,rgba(184,240,224,0.28),rgba(184,240,224,0.08));border-color:rgba(184,240,224,0.45)}
        .bc.rose{background:linear-gradient(135deg,rgba(248,197,216,0.28),rgba(248,197,216,0.08));border-color:rgba(248,197,216,0.45)}
        .bc.yellow{background:linear-gradient(135deg,rgba(253,232,160,0.28),rgba(253,232,160,0.08));border-color:rgba(253,232,160,0.5)}
        .bc-lbl{font-size:0.72rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:14px;display:flex;align-items:center;gap:8px}
        .bc-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:0.9rem;background:rgba(255,255,255,0.65)}
        .score-num{font-family:'Bricolage Grotesque',sans-serif;font-size:3.8rem;font-weight:800;line-height:1;letter-spacing:-3px;margin-bottom:6px}
        .score-den{font-size:1.6rem;opacity:0.5}
        .score-cmt{font-size:0.88rem;color:var(--muted);line-height:1.5;margin-top:4px}
        .ilist{list-style:none;display:flex;flex-direction:column;gap:10px}
        .iitem{display:flex;gap:10px;align-items:flex-start;font-size:0.88rem;color:var(--text);line-height:1.55}
        .dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:6px}
        .dr{background:#e57373}.dg{background:#66bb6a}.db{background:#42a5f5}
        .verbatim{background:rgba(255,255,255,0.65);border-left:3px solid var(--lavender);padding:13px 15px;border-radius:0 12px 12px 0;font-size:0.86rem;color:var(--text);line-height:1.65;font-style:italic;margin-bottom:10px}
        .action-row{display:flex;gap:12px;align-items:flex-start;padding:13px 14px;background:rgba(255,255,255,0.65);border-radius:14px;margin-bottom:10px;border:1px solid rgba(255,255,255,0.9)}
        .action-num{width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,#b08fe0,#d4609a);color:white;font-size:0.75rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .action-body strong{display:block;font-size:0.9rem;font-weight:700;color:var(--text);margin-bottom:3px}
        .action-body span{font-size:0.8rem;color:var(--muted);line-height:1.5}
        .priority-tag{display:inline-block;font-size:0.68rem;font-weight:700;padding:2px 8px;border-radius:10px;margin-left:8px;text-transform:uppercase;vertical-align:middle}
        .themes-wrap{display:flex;gap:8px;flex-wrap:wrap}
        .theme-tag{padding:7px 14px;background:rgba(255,255,255,0.65);border:1px solid var(--border);border-radius:20px;font-size:0.82rem;font-weight:500;color:var(--text)}
        @media(max-width:700px){
          .bento{grid-template-columns:1fr}.bc.full{grid-column:1}
          nav{padding:16px 20px}
          h1{font-size:2.4rem;letter-spacing:-1.5px}
          .setup,.results,.history-page{padding:24px 16px}
          .history-grid{grid-template-columns:1fr}
          .quick-input{padding-right:130px}
        }
      `}</style>

      <div className="mesh-bg" />
      <div className="app">

        {/* NAV */}
        <nav>
          <div className="logo" onClick={reset}>Review<span>Sense</span></div>
          <div className="nav-right">
            <button className={`nav-btn ${step==='history'?'active':''}`} onClick={() => setStep('history')}>
              📋 {t.navHistory}{history.length > 0 ? ` (${history.length})` : ''}
            </button>
            <div className="lang-toggle">
              <button className={`lang-btn ${lang==='fr'?'active':''}`} onClick={() => setLang('fr')}>🇫🇷 FR</button>
              <button className={`lang-btn ${lang==='en'?'active':''}`} onClick={() => setLang('en')}>🇬🇧 EN</button>
            </div>
            <a
              href="https://calendly.com/ona-action/30min"
              target="_blank"
              rel="noreferrer"
              className="nav-rdv-btn"
            >
              📅 {lang==='fr' ? 'Prendre RDV' : 'Book a call'}
            </a>
          </div>
        </nav>

        {/* LANDING */}
        {step === 'landing' && (
          <div className="landing">
            <div className="hero-tag">{t.tagline}</div>
            <h1>{t.heroTitle}<br /><span className="hl">{t.heroHighlight}</span></h1>
            <p className="hero-sub">{t.heroSub}</p>
            <div className="quick-input-wrap">
              <input className="quick-input" type="url" placeholder={t.urlPlaceholder} value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && detectedPlatform && setStep('setup')} />
              <button className="quick-submit" disabled={!detectedPlatform} onClick={() => setStep('setup')}>
                {lang==='fr'?'Analyser →':'Analyze →'}
              </button>
              {detectedPlatform && (
                <div style={{display:'flex',justifyContent:'center',marginTop:'10px'}}>
                  <div className="platform-detected">{pInfo(detectedPlatform).icon} {pInfo(detectedPlatform).label} {t.urlDetected}</div>
                </div>
              )}
            </div>
            <div className="platforms-row">
              <div className="platform-pill">📦 Amazon</div>
              <div className="platform-pill">⭐ Google My Business</div>
              <div className="platform-pill">🦉 TripAdvisor</div>
              <div className="platform-pill">🟢 Trustpilot</div>
            </div>
            <div className="features-row">
              <div className="feat-pill">{t.featExtract}</div>
              <div className="feat-pill">{t.featMulti}</div>
              <div className="feat-pill">{t.featActions}</div>
              <div className="feat-pill">{t.featHistory}</div>
            </div>
            {history.length > 0 && (
              <button className="cta-btn-outline" onClick={() => setStep('history')}>
                📋 {t.ctaHistory} ({history.length})
              </button>
            )}
          </div>
        )}

        {/* SETUP */}
        {step === 'setup' && (
          <div className="setup">
            <div>
              <div className="page-eyebrow">{t.setup}</div>
              <div className="page-h2">{t.setupTitle}</div>
            </div>

            <div className="card">
              <div className="card-title">🔗 {t.urlLabel}</div>
              <div className="url-wrap">
                <input className="url-input" type="url" placeholder={t.urlPlaceholder} value={url}
                  onChange={e => setUrl(e.target.value)} />
                {url && <button className="url-clear" onClick={() => { setUrl(''); setDP(null); }}>×</button>}
              </div>
              {detectedPlatform
                ? <div className="platform-badge badge-ok">{pInfo(detectedPlatform).icon} <strong>{pInfo(detectedPlatform).label}</strong> {t.urlDetected}</div>
                : url.length > 5 && <div className="platform-badge badge-err">⚠️ {t.urlError}</div>
              }
            </div>

            <div className="card">
              <div className="card-title">🏪 {t.sectorLabel} <span style={{fontSize:'0.75rem',fontWeight:'400',textTransform:'none',letterSpacing:0,marginLeft:'6px',opacity:0.7}}>{t.sectorOpt}</span></div>
              <div className="pill-grid">
                <button className={`pill ${sector==='ecommerce'?'sel':''}`} onClick={() => setSector(sector==='ecommerce'?'':'ecommerce')}>{t.ecommerce}</button>
                <button className={`pill ${sector==='restaurant'?'sel':''}`} onClick={() => setSector(sector==='restaurant'?'':'restaurant')}>{t.restaurant}</button>
              </div>
            </div>

            <div className="card">
              <div className="card-title">🏷️ {t.nameLabel} <span style={{fontSize:'0.75rem',fontWeight:'400',textTransform:'none',letterSpacing:0,marginLeft:'6px',opacity:0.7}}>{t.nameOpt}</span></div>
              <input className="form-input" type="text" placeholder={t.namePlaceholder} value={businessName} onChange={e => setBN(e.target.value)} />
              <p className="field-hint">{t.nameHint}</p>
            </div>

            {error && <div className="error-msg">⚠️ {error}</div>}
            <button className="analyze-btn" onClick={runAnalysis} disabled={!url.trim() || !detectedPlatform}>{t.launchBtn}</button>
          </div>
        )}

        {/* ANALYZING */}
        {step === 'analyzing' && (
          <div className="analyzing">
            <div className="pulse-orb">🔍</div>
            <h2 className="an-h2">{t.analyzing}</h2>
            <p className="an-sub">{t.analyzingSub}</p>
            <div className="steps-list">
              {t.steps.map((label, i) => (
                <div key={i} className={`step-item ${i < analyzingStep ? 'done' : i === analyzingStep ? 'active' : ''}`}>
                  <span style={{width:'24px',textAlign:'center'}}>{i < analyzingStep ? '✓' : STEP_ICONS[i]}</span>
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HISTORY */}
        {step === 'history' && (
          <div className="history-page">
            <div className="history-header">
              <h2 className="page-h2">{t.historyTitle}</h2>
              <button className="cta-btn cta-btn-sm" onClick={() => setStep('setup')}>{t.historyNew}</button>
            </div>
            <p className="history-sub">{t.historySub(history.length)}</p>
            {history.length === 0
              ? <div className="history-empty"><div className="ei">📋</div><p>{t.historyEmpty}</p></div>
              : <div className="history-grid">
                  {history.map(entry => (
                    <div key={entry.id} className="hc" onClick={() => loadEntry(entry)}>
                      <button className="hc-del" onClick={e => { e.stopPropagation(); deleteEntry(entry.id); }}>✕</button>
                      <div className="hc-top">
                        <div style={{fontSize:'1.3rem'}}>{pInfo(entry.platform).icon}</div>
                        <div className="hc-score" style={{color: getScoreColor(entry.score)}}>{entry.score}/10</div>
                      </div>
                      <div className="hc-name">{entry.businessName || (lang==='fr'?'Sans nom':'Unnamed')}</div>
                      <div className="hc-meta">{pInfo(entry.platform).label}{entry.sector ? ` · ${sLabel(entry.sector)}` : ''}</div>
                      <div className="hc-summary">{entry.summary}</div>
                      <div className="hc-footer">
                        <span className="hc-date">🕐 {formatDate(entry.date)}</span>
                        {entry.totalReviews && <span className="hc-count">{entry.totalReviews} {t.reviewsCount}</span>}
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {/* RESULTS */}
        {step === 'results' && results && (
          <div className="results">
            <div className="rh">
              <div className="rh-left">
                <h2>{t.reportTitle}</h2>
                <div className="rh-meta">
                  {currentMeta?.platform && <span className="rh-badge">{pInfo(currentMeta.platform).icon} {pInfo(currentMeta.platform).label}</span>}
                  {currentMeta?.sector && <span className="rh-badge">{sLabel(currentMeta.sector)}</span>}
                  {currentMeta?.totalReviews && <span className="rh-badge">📝 {currentMeta.totalReviews} {t.reviewsCount}</span>}
                  {currentMeta?.avgRating && <span className="rh-badge">⭐ {currentMeta.avgRating}/5</span>}
                </div>
              </div>
              <div className="rh-actions">
                <button className="ghost-btn" onClick={() => setStep('history')}>📋 {t.navHistory}</button>
                <button className="ghost-btn" onClick={() => setStep('setup')}>{t.newAnalysis}</button>
              </div>
            </div>

            <div className="bento">
              <div className="bc purple">
                <div className="bc-lbl"><span className="bc-icon">📊</span> {t.scoreLabel}</div>
                <div className="score-num" style={{color: getScoreColor(results.score)}}>{results.score}<span className="score-den">/10</span></div>
                <div className="score-cmt">{results.scoreComment}</div>
              </div>
              <div className="bc mint">
                <div className="bc-lbl"><span className="bc-icon">📝</span> {t.summaryLabel}</div>
                <p style={{fontSize:'0.91rem',color:'var(--text)',lineHeight:'1.65'}}>{results.summary}</p>
              </div>
              {results.keyThemes?.length > 0 && (
                <div className="bc full yellow">
                  <div className="bc-lbl"><span className="bc-icon">🏷️</span> {t.themesLabel}</div>
                  <div className="themes-wrap">{results.keyThemes.map((t2,i) => <div key={i} className="theme-tag">{t2}</div>)}</div>
                </div>
              )}
              <div className="bc rose">
                <div className="bc-lbl"><span className="bc-icon">🚨</span> {t.frictionLabel}</div>
                <ul className="ilist">{results.painPoints?.map((p,i) => <li key={i} className="iitem"><span className="dot dr"/>{p}</li>)}</ul>
              </div>
              <div className="bc mint">
                <div className="bc-lbl"><span className="bc-icon">✨</span> {t.strengthLabel}</div>
                <ul className="ilist">{results.positives?.map((p,i) => <li key={i} className="iitem"><span className="dot dg"/>{p}</li>)}</ul>
              </div>
              <div className="bc full">
                <div className="bc-lbl"><span className="bc-icon">💬</span> {t.verbatimLabel}</div>
                {results.verbatims?.map((v,i) => <div key={i} className="verbatim">"{v}"</div>)}
              </div>
              <div className="bc full purple">
                <div className="bc-lbl"><span className="bc-icon">🎯</span> {t.actionsLabel}</div>
                {results.actions?.map((a,i) => (
                  <div key={i} className="action-row">
                    <div className="action-num">{i+1}</div>
                    <div className="action-body">
                      <strong>
                        {a.title}
                        {a.priority && <span className="priority-tag" style={{background: a.priority==='haute'||a.priority==='high'?'rgba(231,76,60,0.1)':'rgba(230,126,22,0.1)', color: a.priority==='haute'||a.priority==='high'?'#e74c3c':'#e67e22', border: `1px solid ${a.priority==='haute'||a.priority==='high'?'#e74c3c40':'#e67e2240'}`}}>{a.priority}</span>}
                      </strong>
                      <span>{a.description}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bc full peach">
                <div className="bc-lbl"><span className="bc-icon">💡</span> {t.oppLabel}</div>
                <ul className="ilist">{results.opportunities?.map((o,i) => <li key={i} className="iitem"><span className="dot db"/>{o}</li>)}</ul>
              </div>
            </div>
          </div>
        )}
      {/* FOOTER ONA */}
        <footer style={{
          borderTop: '1px solid rgba(197,184,248,0.25)',
          background: 'rgba(250,248,255,0.8)',
          backdropFilter: 'blur(12px)',
          padding: '40px 48px',
          marginTop: 'auto',
        }}>
          <div style={{maxWidth:'900px', margin:'0 auto', display:'flex', flexWrap:'wrap', gap:'40px', justifyContent:'space-between', alignItems:'flex-start'}}>

            {/* Logo + description */}
            <div style={{flex:'1', minWidth:'220px'}}>
              <div style={{fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'1.2rem', fontWeight:800, background:'linear-gradient(135deg,#7c5cbf,#d4609a)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', marginBottom:'8px'}}>
                Review<span style={{background:'linear-gradient(135deg,#d4609a,#f4a261)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text'}}>Sense</span>
              </div>
              <p style={{fontSize:'0.82rem', color:'#7a6d8a', lineHeight:'1.6', maxWidth:'260px'}}>
                Un outil digital d'aide aux TPE, PME et entrepreneurs indépendants pour analyser leur réputation en ligne.
              </p>
              <p style={{fontSize:'0.75rem', color:'#b0a5c0', marginTop:'12px'}}>
                Conçu et développé par <a href="https://ona-asso.fr" target="_blank" rel="noreferrer" style={{color:'#7c5cbf', fontWeight:600, textDecoration:'none'}}>ONA</a>
              </p>
            </div>

            <div style={{display:'flex', gap:'48px', flexWrap:'wrap'}}>

              {/* Outil */}
              <div>
                <div style={{fontSize:'0.72rem', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'#b0a5c0', marginBottom:'12px'}}>Outil</div>
                <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                  <Link href="/" style={{fontSize:'0.85rem', color:'#7a6d8a', textDecoration:'none'}}>Analyser mes avis</Link>
                  <Link href="/a-propos" style={{fontSize:'0.85rem', color:'#7a6d8a', textDecoration:'none'}}>À propos</Link>
                  <a href="mailto:ona.action@gmail.com" style={{fontSize:'0.85rem', color:'#7a6d8a', textDecoration:'none'}}>Contact</a>
                  <a href="https://calendly.com/ona-action/30min" target="_blank" rel="noreferrer" style={{
                    fontSize:'0.82rem', color:'white', textDecoration:'none',
                    background:'linear-gradient(135deg,#7c5cbf,#d4609a)',
                    padding:'7px 14px', borderRadius:'20px', fontWeight:600,
                    display:'inline-block', marginTop:'4px',
                  }}>📅 Prendre RDV</a>
                </div>
              </div>

              {/* Légal */}
              <div>
                <div style={{fontSize:'0.72rem', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'#b0a5c0', marginBottom:'12px'}}>Légal</div>
                <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                  <Link href="/mentions-legales" style={{fontSize:'0.85rem', color:'#7a6d8a', textDecoration:'none'}}>Mentions légales</Link>
                  <Link href="/politique-confidentialite" style={{fontSize:'0.85rem', color:'#7a6d8a', textDecoration:'none'}}>Politique de confidentialité</Link>
                </div>
              </div>

              {/* ONA */}
              <div>
                <div style={{fontSize:'0.72rem', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'#b0a5c0', marginBottom:'12px'}}>ONA</div>
                <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                  <a href="https://ona-asso.fr" target="_blank" rel="noreferrer" style={{fontSize:'0.85rem', color:'#7a6d8a', textDecoration:'none'}}>ona-asso.fr</a>
                  <a href="mailto:ona.action@gmail.com" style={{fontSize:'0.85rem', color:'#7a6d8a', textDecoration:'none'}}>ona.action@gmail.com</a>
                  <a href="https://calendly.com/ona-action/30min" target="_blank" rel="noreferrer" style={{fontSize:'0.85rem', color:'#7a6d8a', textDecoration:'none'}}>Prendre RDV</a>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom bar */}
          <div style={{maxWidth:'900px', margin:'28px auto 0', paddingTop:'20px', borderTop:'1px solid rgba(197,184,248,0.2)', display:'flex', justifyContent:'center', flexWrap:'wrap', gap:'8px'}}>
            <p style={{fontSize:'0.75rem', color:'#b0a5c0', textAlign:'center'}}>© {new Date().getFullYear()} ONA — Organisation Numérique & Automatisation. Tous droits réservés.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
