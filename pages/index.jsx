import { useState, useEffect } from 'react';
import Head from 'next/head';

const PLATFORM_CONFIG = {
  amazon: { label: 'Amazon', icon: '📦', color: '#FF9900', hint: 'Ex: https://www.amazon.fr/dp/B09G3HRMVB' },
  google: { label: 'Google My Business', icon: '⭐', color: '#4285F4', hint: 'Ex: https://www.google.com/maps/place/...' },
  tripadvisor: { label: 'TripAdvisor', icon: '🦉', color: '#34E0A1', hint: 'Ex: https://www.tripadvisor.fr/Restaurant_Review-...' },
};

const SECTORS = [
  { id: 'ecommerce', label: 'E-commerce', icon: '🛍️' },
  { id: 'restaurant', label: 'Restauration', icon: '🍽️' },
];

const URL_PATTERNS = {
  amazon: /amazon\./i,
  tripadvisor: /tripadvisor\./i,
  google: /google\.com\/maps|maps\.google|maps\.app\.goo\.gl|g\.page/i,
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

const ANALYZING_STEPS = [
  { icon: '🔗', label: {lang==='fr'?'Connexion à la plateforme…':'Connecting to platform…'} },
  { icon: '📥', label: {lang==='fr'?'Extraction des avis…':'Extracting reviews…'} },
  { icon: '📄', label: {lang==='fr'?'Récupération des pages…':'Retrieving pages…'} },
  { icon: '🧠', label: {lang==='fr'?'Analyse par ReviewSense…':'Analyzing with ReviewSense…'} },
  { icon: '📊', label: {lang==='fr'?'Génération du rapport…':'Generating report…'} },
];

export default function Home() {
  const [step, setStep] = useState('landing');
  const [url, setUrl] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState(null);
  const [sector, setSector] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [results, setResults] = useState(null);
  const [currentMeta, setCurrentMeta] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const [lang, setLang] = useState('fr');

  useEffect(() => {
    try {
      const h = localStorage.getItem('rs_history_v2');
      if (h) setHistory(JSON.parse(h));
    } catch (e) {}
  }, []);

  // Auto-detect platform as user types
  useEffect(() => {
    const detected = detectPlatformClient(url);
    setDetectedPlatform(detected);
  }, [url]);

  const saveToHistory = (analysisResults, meta, stats) => {
    try {
      const entry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        ...meta,
        ...stats,
        score: analysisResults.score,
        summary: analysisResults.summary,
        results: analysisResults,
      };
      const newHistory = [entry, ...history].slice(0, 20);
      setHistory(newHistory);
      localStorage.setItem('rs_history_v2', JSON.stringify(newHistory));
    } catch (e) {}
  };

  const deleteEntry = (id) => {
    const n = history.filter(h => h.id !== id);
    setHistory(n);
    try { localStorage.setItem('rs_history_v2', JSON.stringify(n)); } catch (e) {}
  };

  const loadEntry = (entry) => {
    setResults(entry.results);
    setCurrentMeta({ businessName: entry.businessName, sector: entry.sector, platform: entry.platform, totalReviews: entry.totalReviews, avgRating: entry.avgRating });
    setStep('results');
  };

  const runAnalysis = async () => {
    if (!url.trim()) { setError('Veuillez entrer une URL.'); return; }
    if (!detectedPlatform) { setError('Plateforme non reconnue. Utilisez une URL Amazon, Google Maps ou TripAdvisor.'); return; }

    setError('');
    setStep('analyzing');
    setAnalyzingStep(0);

    // Animate steps
    const stepInterval = setInterval(() => {
      setAnalyzingStep(prev => Math.min(prev + 1, ANALYZING_STEPS.length - 1));
    }, 2200);

    try {
      // Step 1: Scrape
      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const scrapeData = await scrapeRes.json();
      if (scrapeData.error) throw new Error(scrapeData.error);

      setAnalyzingStep(3);

      const finalBusinessName = businessName || scrapeData.detectedName || '';
      const meta = { businessName: finalBusinessName, sector, platform: scrapeData.platform || detectedPlatform };
      setCurrentMeta({ ...meta, totalReviews: scrapeData.totalReviews, avgRating: scrapeData.avgRating });

      // Step 2: Analyze
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewsText: scrapeData.reviewsText,
          sector,
          platform: scrapeData.platform,
          businessName: finalBusinessName,
          totalReviews: scrapeData.totalReviews,
          avgRating: scrapeData.avgRating,
          lang,
        }),
      });
      const analysisData = await analyzeRes.json();
      if (analysisData.error) throw new Error(analysisData.error);

      setAnalyzingStep(4);
      clearInterval(stepInterval);

      saveToHistory(analysisData, meta, { totalReviews: scrapeData.totalReviews, avgRating: scrapeData.avgRating });
      setResults(analysisData);
      setTimeout(() => setStep('results'), 600);
    } catch (e) {
      clearInterval(stepInterval);
      setError(e.message);
      setStep('setup');
    }
  };

  const reset = () => { setStep('landing'); setResults(null); setCurrentMeta(null); setUrl(''); setBusinessName(''); setSector(''); setError(''); setDetectedPlatform(null); };

  const getPlatformInfo = (id) => PLATFORM_CONFIG[id] || { label: id, icon: '📋', color: '#888' };
  const getSectorLabel = (id) => SECTORS.find(s => s.id === id)?.label || id;
  const getSectorIcon = (id) => SECTORS.find(s => s.id === id)?.icon || '📊';
  const getScoreColor = (score) => score >= 8 ? '#27ae60' : score >= 6 ? '#e67e22' : '#e74c3c';
  const getPriorityColor = (p) => p === 'haute' ? '#e74c3c' : '#e67e22';

  return (
    <>
      <Head>
        <title>ReviewSense — Analyse d'avis clients par IA</title>
        <meta name="description" content="Collez l'URL de votre page d'avis. ReviewSense extrait et analyse automatiquement vos avis clients." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif;background:#faf8ff;min-height:100vh;overflow-x:hidden}
        :root{
          --lavender:#c5b8f8;--peach:#ffc8a8;--mint:#b8f0e0;--rose:#f8c5d8;--yellow:#fde8a0;
          --card:rgba(255,255,255,0.88);--text:#1a1525;--muted:#7a6d8a;--border:rgba(197,184,248,0.3);
        }
        .mesh-bg{position:fixed;inset:0;z-index:0;background:
          radial-gradient(ellipse at 8% 15%,rgba(197,184,248,0.45) 0%,transparent 50%),
          radial-gradient(ellipse at 88% 8%,rgba(255,200,168,0.4) 0%,transparent 45%),
          radial-gradient(ellipse at 45% 85%,rgba(184,240,224,0.38) 0%,transparent 52%),
          radial-gradient(ellipse at 92% 75%,rgba(248,197,216,0.32) 0%,transparent 42%),
          radial-gradient(ellipse at 50% 50%,rgba(253,232,160,0.15) 0%,transparent 60%),
          #faf8ff}
        .app{position:relative;z-index:1;min-height:100vh;display:flex;flex-direction:column}

        /* NAV */
        nav{padding:18px 48px;display:flex;align-items:center;justify-content:space-between;backdrop-filter:blur(16px);border-bottom:1px solid var(--border);background:rgba(250,248,255,0.72);position:sticky;top:0;z-index:100}
        .logo{font-family:'Bricolage Grotesque',sans-serif;font-size:1.45rem;font-weight:800;background:linear-gradient(135deg,#7c5cbf,#d4609a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;cursor:pointer;letter-spacing:-0.5px}
        .logo span{background:linear-gradient(135deg,#d4609a,#f4a261);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .nav-right{display:flex;align-items:center;gap:10px}
        .nav-btn{padding:8px 18px;background:rgba(255,255,255,0.75);border:1.5px solid var(--border);border-radius:40px;font-size:0.82rem;font-weight:600;color:var(--muted);cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:6px}
        .nav-btn:hover,.nav-btn.active{border-color:#b08fe0;color:#7c5cbf;background:rgba(197,184,248,0.18)}
        .nav-badge{font-size:0.72rem;font-weight:700;background:linear-gradient(135deg,var(--lavender),var(--peach));padding:5px 14px;border-radius:20px;color:#5b3ea0;letter-spacing:0.3px}

        /* LANDING */
        .landing{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 24px;text-align:center;gap:36px}
        .hero-tag{display:inline-flex;align-items:center;gap:8px;font-size:0.78rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#7c5cbf;background:rgba(197,184,248,0.22);padding:7px 18px;border-radius:20px;border:1px solid rgba(197,184,248,0.45)}
        h1{font-family:'Bricolage Grotesque',sans-serif;font-size:clamp(2.8rem,6vw,4.4rem);font-weight:800;line-height:1.08;color:var(--text);letter-spacing:-2.5px;max-width:780px}
        h1 .hl{background:linear-gradient(135deg,#7c5cbf 0%,#d4609a 55%,#f4a261 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .hero-sub{font-size:1.12rem;color:var(--muted);max-width:540px;line-height:1.75}
        
        /* URL Quick input on landing */
        .quick-input-wrap{width:100%;max-width:580px;position:relative}
        .quick-input{width:100%;padding:18px 160px 18px 22px;background:rgba(255,255,255,0.95);border:2px solid var(--border);border-radius:16px;font-family:'DM Sans',sans-serif;font-size:1rem;color:var(--text);outline:none;transition:all 0.2s;box-shadow:0 4px 24px rgba(0,0,0,0.06)}
        .quick-input:focus{border-color:#b08fe0;box-shadow:0 4px 24px rgba(176,143,224,0.2)}
        .quick-input::placeholder{color:#b0a5c0}
        .quick-submit{position:absolute;right:8px;top:50%;transform:translateY(-50%);padding:10px 22px;background:linear-gradient(135deg,#7c5cbf,#d4609a);color:white;font-family:'Bricolage Grotesque',sans-serif;font-size:0.9rem;font-weight:700;border-radius:10px;border:none;cursor:pointer;transition:all 0.2s;white-space:nowrap}
        .quick-submit:hover{box-shadow:0 4px 16px rgba(124,92,191,0.4)}
        .quick-submit:disabled{opacity:0.5;cursor:not-allowed}
        .platform-detected{display:flex;align-items:center;gap:8px;font-size:0.82rem;font-weight:600;color:#5b3ea0;background:rgba(197,184,248,0.2);padding:6px 14px;border-radius:20px;border:1px solid rgba(197,184,248,0.4);margin-top:10px}

        .platforms-row{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
        .platform-pill{display:flex;align-items:center;gap:7px;padding:9px 18px;background:rgba(255,255,255,0.75);border:1px solid var(--border);border-radius:40px;font-size:0.84rem;font-weight:600;color:var(--muted);backdrop-filter:blur(8px)}
        .features-row{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:680px}
        .feat-pill{display:flex;align-items:center;gap:8px;padding:9px 18px;background:rgba(255,255,255,0.7);border:1px solid var(--border);border-radius:40px;font-size:0.83rem;color:var(--text);font-weight:500;backdrop-filter:blur(8px)}

        /* SETUP */
        .setup{flex:1;display:flex;flex-direction:column;align-items:center;padding:44px 24px;gap:18px;max-width:680px;margin:0 auto;width:100%}
        .page-header{text-align:center;margin-bottom:4px}
        .page-eyebrow{font-size:0.75rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#b08fe0;margin-bottom:8px}
        .page-header h2{font-family:'Bricolage Grotesque',sans-serif;font-size:2rem;font-weight:800;color:var(--text);letter-spacing:-1px}
        .card{background:var(--card);border:1px solid var(--border);border-radius:22px;padding:22px;width:100%;backdrop-filter:blur(14px);box-shadow:0 4px 28px rgba(0,0,0,0.04)}
        .card-title{font-size:0.8rem;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);margin-bottom:14px;display:flex;align-items:center;gap:8px}
        
        /* URL Input */
        .url-input-wrap{position:relative;width:100%}
        .url-input{width:100%;padding:14px 48px 14px 16px;background:rgba(255,255,255,0.95);border:2px solid var(--border);border-radius:12px;font-family:'DM Sans',sans-serif;font-size:0.95rem;color:var(--text);outline:none;transition:all 0.25s}
        .url-input:focus{border-color:#b08fe0;box-shadow:0 0 0 3px rgba(176,143,224,0.12)}
        .url-clear{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--muted);font-size:1.1rem;padding:2px;transition:color 0.2s}
        .url-clear:hover{color:var(--text)}
        .platform-badge{display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:12px;font-size:0.88rem;font-weight:600;margin-top:10px;border:1.5px solid}
        .platform-badge.detected{background:rgba(197,184,248,0.15);border-color:rgba(197,184,248,0.5);color:#5b3ea0}
        .platform-badge.unknown{background:rgba(255,100,100,0.08);border-color:rgba(255,100,100,0.25);color:#c0392b}
        .url-hint{font-size:0.78rem;color:var(--muted);margin-top:8px;line-height:1.5}
        .url-examples{display:flex;flex-direction:column;gap:4px;margin-top:12px}
        .url-example{font-size:0.76rem;color:var(--muted);padding:7px 12px;background:rgba(255,255,255,0.6);border-radius:8px;border:1px solid var(--border);cursor:pointer;transition:all 0.2s;font-family:monospace}
        .url-example:hover{background:rgba(197,184,248,0.15);border-color:rgba(197,184,248,0.4);color:#5b3ea0}

        .pill-grid{display:flex;gap:10px;flex-wrap:wrap}
        .pill-option{display:flex;align-items:center;gap:8px;padding:10px 20px;background:rgba(255,255,255,0.85);border:2px solid transparent;border-radius:40px;cursor:pointer;font-size:0.9rem;font-weight:600;color:var(--text);transition:all 0.2s}
        .pill-option:hover{border-color:var(--lavender)}
        .pill-option.selected{background:linear-gradient(135deg,rgba(197,184,248,0.3),rgba(255,200,168,0.2));border-color:#b08fe0;color:#5b3ea0}
        .form-field{display:flex;flex-direction:column;gap:8px;width:100%}
        .form-field input{background:rgba(255,255,255,0.95);border:1.5px solid var(--border);border-radius:12px;padding:12px 16px;font-family:'DM Sans',sans-serif;font-size:0.95rem;color:var(--text);transition:border-color 0.2s;outline:none;width:100%}
        .form-field input:focus{border-color:#b08fe0;box-shadow:0 0 0 3px rgba(176,143,224,0.12)}
        .field-hint{font-size:0.76rem;color:var(--muted);margin-top:4px;font-style:italic}
        .analyze-btn{width:100%;padding:17px;background:linear-gradient(135deg,#7c5cbf,#d4609a);color:white;font-family:'Bricolage Grotesque',sans-serif;font-size:1.08rem;font-weight:700;border-radius:14px;border:none;cursor:pointer;transition:all 0.3s;box-shadow:0 6px 28px rgba(124,92,191,0.3);letter-spacing:-0.3px}
        .analyze-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 36px rgba(124,92,191,0.42)}
        .analyze-btn:disabled{opacity:0.6;cursor:not-allowed}
        .error-msg{background:rgba(231,76,60,0.08);border:1.5px solid rgba(231,76,60,0.25);border-radius:12px;padding:13px 16px;font-size:0.85rem;color:#c0392b;width:100%;line-height:1.5}

        /* ANALYZING */
        .analyzing{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:32px;padding:60px 24px;text-align:center}
        .pulse-orb{width:110px;height:110px;border-radius:50%;background:linear-gradient(135deg,var(--lavender),var(--peach),var(--mint));display:flex;align-items:center;justify-content:center;font-size:2.6rem;animation:pulse 2s ease-in-out infinite;box-shadow:0 0 0 0 rgba(197,184,248,0.7)}
        @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(197,184,248,0.7)}70%{box-shadow:0 0 0 28px rgba(197,184,248,0)}100%{box-shadow:0 0 0 0 rgba(197,184,248,0)}}
        .analyzing h2{font-family:'Bricolage Grotesque',sans-serif;font-size:1.9rem;font-weight:800;color:var(--text);letter-spacing:-1px}
        .steps-list{display:flex;flex-direction:column;gap:10px;text-align:left;min-width:280px}
        .step-item{display:flex;align-items:center;gap:12px;padding:10px 16px;border-radius:12px;font-size:0.88rem;font-weight:500;transition:all 0.4s;color:var(--muted);background:transparent}
        .step-item.active{background:rgba(255,255,255,0.8);color:var(--text);font-weight:600;box-shadow:0 2px 12px rgba(0,0,0,0.05)}
        .step-item.done{color:#27ae60;background:rgba(39,174,96,0.06)}
        .step-icon{font-size:1.1rem;width:24px;text-align:center}
        .step-check{color:#27ae60;font-weight:700}

        /* HISTORY */
        .history-page{flex:1;padding:40px 48px;max-width:920px;margin:0 auto;width:100%}
        .page-title-row{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:6px}
        .page-h2{font-family:'Bricolage Grotesque',sans-serif;font-size:2rem;font-weight:800;color:var(--text);letter-spacing:-1px}
        .page-sub{color:var(--muted);font-size:0.9rem;margin-bottom:28px}
        .history-empty{text-align:center;padding:64px 24px;color:var(--muted)}
        .history-empty .empty-icon{font-size:3.2rem;margin-bottom:16px}
        .history-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:16px}
        .history-card{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:22px;backdrop-filter:blur(14px);cursor:pointer;transition:all 0.25s;box-shadow:0 3px 18px rgba(0,0,0,0.04);position:relative;overflow:hidden}
        .history-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--lavender),var(--peach));opacity:0;transition:opacity 0.2s}
        .history-card:hover{transform:translateY(-3px);box-shadow:0 10px 36px rgba(124,92,191,0.12);border-color:rgba(197,184,248,0.5)}
        .history-card:hover::before{opacity:1}
        .hc-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px}
        .hc-icons{display:flex;gap:6px;align-items:center;font-size:1.3rem}
        .hc-score{font-family:'Bricolage Grotesque',sans-serif;font-size:1.5rem;font-weight:800}
        .hc-name{font-family:'Bricolage Grotesque',sans-serif;font-size:1rem;font-weight:700;color:var(--text);margin-bottom:4px}
        .hc-meta{font-size:0.76rem;color:var(--muted);margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap}
        .hc-summary{font-size:0.82rem;color:var(--muted);line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        .hc-footer{display:flex;align-items:center;justify-content:space-between;margin-top:14px}
        .hc-date{font-size:0.74rem;color:var(--muted)}
        .hc-count{font-size:0.74rem;color:var(--muted);background:rgba(197,184,248,0.2);padding:3px 10px;border-radius:20px}
        .hc-delete{width:26px;height:26px;border-radius:50%;background:rgba(255,100,100,0.1);border:none;cursor:pointer;font-size:0.72rem;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;color:#c0392b;position:absolute;top:14px;right:14px}
        .history-card:hover .hc-delete{opacity:1}

        /* RESULTS */
        .results{flex:1;padding:40px 24px 60px;max-width:900px;margin:0 auto;width:100%}
        .results-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:32px;flex-wrap:wrap;gap:16px}
        .rh-left h2{font-family:'Bricolage Grotesque',sans-serif;font-size:2.1rem;font-weight:800;color:var(--text);letter-spacing:-1px;margin-bottom:6px}
        .rh-meta{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
        .rh-badge{display:inline-flex;align-items:center;gap:6px;font-size:0.78rem;font-weight:600;padding:5px 12px;border-radius:20px;background:rgba(255,255,255,0.8);border:1px solid var(--border);color:var(--muted)}
        .rh-actions{display:flex;gap:10px;flex-wrap:wrap}
        .ghost-btn{padding:10px 20px;background:white;border:1.5px solid var(--border);border-radius:40px;font-size:0.84rem;font-weight:600;color:var(--muted);cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:6px}
        .ghost-btn:hover{border-color:#b08fe0;color:#7c5cbf}

        /* BENTO */
        .bento{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .bc{background:var(--card);border:1px solid var(--border);border-radius:22px;padding:24px;backdrop-filter:blur(14px);box-shadow:0 4px 28px rgba(0,0,0,0.04)}
        .bc.full{grid-column:1/-1}
        .bc.purple{background:linear-gradient(135deg,rgba(197,184,248,0.28),rgba(197,184,248,0.08));border-color:rgba(197,184,248,0.45)}
        .bc.peach{background:linear-gradient(135deg,rgba(255,200,168,0.28),rgba(255,200,168,0.08));border-color:rgba(255,200,168,0.45)}
        .bc.mint{background:linear-gradient(135deg,rgba(184,240,224,0.28),rgba(184,240,224,0.08));border-color:rgba(184,240,224,0.45)}
        .bc.rose{background:linear-gradient(135deg,rgba(248,197,216,0.28),rgba(248,197,216,0.08));border-color:rgba(248,197,216,0.45)}
        .bc.yellow{background:linear-gradient(135deg,rgba(253,232,160,0.28),rgba(253,232,160,0.08));border-color:rgba(253,232,160,0.5)}
        .bc-label{font-size:0.72rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:14px;display:flex;align-items:center;gap:8px}
        .bc-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:0.9rem;background:rgba(255,255,255,0.65)}
        .score-num{font-family:'Bricolage Grotesque',sans-serif;font-size:3.8rem;font-weight:800;line-height:1;letter-spacing:-3px;margin-bottom:6px}
        .score-denom{font-size:1.6rem;opacity:0.5}
        .score-comment{font-size:0.88rem;color:var(--muted);line-height:1.5;margin-top:4px}
        .ilist{list-style:none;display:flex;flex-direction:column;gap:10px}
        .iitem{display:flex;gap:10px;align-items:flex-start;font-size:0.88rem;color:var(--text);line-height:1.55}
        .dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:6px}
        .dr{background:#e57373}.dg{background:#66bb6a}.db{background:#42a5f5}.dp{background:#b08fe0}.dy{background:#ffa726}
        .verbatim{background:rgba(255,255,255,0.65);border-left:3px solid var(--lavender);padding:13px 15px;border-radius:0 12px 12px 0;font-size:0.86rem;color:var(--text);line-height:1.65;font-style:italic;margin-bottom:10px}
        .action-row{display:flex;gap:12px;align-items:flex-start;padding:13px 14px;background:rgba(255,255,255,0.65);border-radius:14px;margin-bottom:10px;border:1px solid rgba(255,255,255,0.9)}
        .action-num{width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,#b08fe0,#d4609a);color:white;font-size:0.75rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .action-body strong{display:block;font-size:0.9rem;font-weight:700;color:var(--text);margin-bottom:3px}
        .action-body span{font-size:0.8rem;color:var(--muted);line-height:1.5}
        .priority-tag{display:inline-block;font-size:0.68rem;font-weight:700;padding:2px 8px;border-radius:10px;margin-left:8px;text-transform:uppercase;letter-spacing:0.5px;vertical-align:middle}
        .themes-wrap{display:flex;gap:8px;flex-wrap:wrap}
        .theme-tag{padding:7px 14px;background:rgba(255,255,255,0.65);border:1px solid var(--border);border-radius:20px;font-size:0.82rem;font-weight:500;color:var(--text)}
        .stats-row{display:flex;gap:12px;flex-wrap:wrap;margin-top:14px}
        .stat-box{padding:10px 16px;background:rgba(255,255,255,0.5);border-radius:12px;text-align:center;flex:1;min-width:80px}
        .stat-val{font-family:'Bricolage Grotesque',sans-serif;font-size:1.4rem;font-weight:800;color:var(--text)}
        .stat-lbl{font-size:0.72rem;color:var(--muted);margin-top:2px}

        /* CTA button */
        .cta-btn{display:inline-flex;align-items:center;gap:10px;padding:16px 38px;background:linear-gradient(135deg,#7c5cbf,#d4609a);color:white;font-family:'Bricolage Grotesque',sans-serif;font-size:1.05rem;font-weight:700;border-radius:50px;border:none;cursor:pointer;transition:all 0.3s;box-shadow:0 8px 32px rgba(124,92,191,0.35)}
        .cta-btn:hover{transform:translateY(-2px);box-shadow:0 14px 42px rgba(124,92,191,0.45)}
        .cta-btn-sm{padding:10px 22px;font-size:0.9rem}

        .lang-toggle{display:flex;align-items:center;background:rgba(255,255,255,0.7);border:1.5px solid var(--border);border-radius:40px;padding:3px;gap:2px}
        .lang-btn{padding:5px 12px;border-radius:30px;border:none;font-size:0.8rem;font-weight:700;cursor:pointer;transition:all 0.2s;background:transparent;color:var(--muted)}
        .lang-btn.active{background:linear-gradient(135deg,#7c5cbf,#d4609a);color:white;box-shadow:0 2px 8px rgba(124,92,191,0.3)}
        @media(max-width:700px){
          .bento{grid-template-columns:1fr}.bc.full{grid-column:1}
          nav{padding:16px 20px}
          h1{font-size:2.4rem;letter-spacing:-1.5px}
          .setup,.results,.history-page{padding:24px 16px}
          .history-grid{grid-template-columns:1fr}
          .quick-input{padding-right:120px}
        }
      `}</style>

      <div className="mesh-bg" />
      <div className="app">

        {/* NAV */}
        <nav>
          <div className="logo" onClick={reset}>Review<span>Sense</span></div>
          <div className="nav-right">
            <button className={`nav-btn ${step === 'history' ? 'active' : ''}`} onClick={() => setStep('history')}>
              📋 {history.length > 0 ? `${lang==='fr'?'Historique':'History'} (${history.length})` : (lang==='fr'?'Historique':'History')}
            </button>
            <div className="lang-toggle">
              <button className={`lang-btn ${lang==='fr'?'active':''}`} onClick={()=>setLang('fr')}>🇫🇷 FR</button>
              <button className={`lang-btn ${lang==='en'?'active':''}`} onClick={()=>setLang('en')}>🇬🇧 EN</button>
            </div>
            <div className="nav-badge">{lang==='fr'?'✦ IA':'✦ AI'}</div>
          </div>
        </nav>

        {/* ── LANDING ── */}
        {step === 'landing' && (
          <div className="landing">
            <div className="hero-tag">{{lang==='fr'?'✦ Analyse d\'avis par IA':'✦ AI-powered review analysis'}}</div>
            <h1>{{lang==='fr'?<>Paste a URL.<br /><span className='hl'>Get your insights.</span></>:<>Collez une URL.<br /><span className='hl'>Obtenez vos insights.</span></>}}</h1>
            <p className="hero-sub">{{lang==='fr'?{lang==='fr'?'ReviewSense extrait automatiquement vos avis Amazon, Google ou TripAdvisor et génère un rapport actionnable en 30 secondes.':'ReviewSense automatically extracts your Amazon, Google or TripAdvisor reviews and generates an actionable report in 30 seconds.'}:'ReviewSense automatically extracts your Amazon, Google or TripAdvisor reviews and generates an actionable report in 30 seconds.'}}</p>

            <div className="quick-input-wrap">
              <input
                className="quick-input"
                type="url"
                placeholder="Collez l'URL de votre page d'avis…"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && detectedPlatform && setStep('setup')}
              />
              <button className="quick-submit" disabled={!detectedPlatform} onClick={() => setStep('setup')}>
                Analyser →
              </button>
              {detectedPlatform && (
                <div style={{display:'flex',justifyContent:'center',marginTop:'10px'}}>
                  <div className="platform-detected">
                    {getPlatformInfo(detectedPlatform).icon} {getPlatformInfo(detectedPlatform).label} détecté
                  </div>
                </div>
              )}
            </div>

            <div className="platforms-row">
              <div className="platform-pill">📦 Amazon</div>
              <div className="platform-pill">⭐ Google My Business</div>
              <div className="platform-pill">🦉 TripAdvisor</div>
            </div>
            <div className="features-row">
              <div className="feat-pill">{{lang==='fr'?{lang==='fr'?'⚡ Extraction automatique':'⚡ Auto extraction'}:'⚡ Auto extraction'}}</div>
              <div className="feat-pill">{'📄 Multi-pages'}</div>
              <div className="feat-pill">{{lang==='fr'?{lang==='fr'?'🎯 Actions concrètes':'🎯 Concrete actions'}:'🎯 Concrete actions'}}</div>
              <div className="feat-pill">{{lang==='fr'?{lang==='fr'?'💾 Historique local':'💾 Local history'}:'💾 Local history'}}</div>
            </div>
          </div>
        )}

        {/* ── SETUP ── */}
        {step === 'setup' && (
          <div className="setup">
            <div className="page-header">
              <div className="page-eyebrow">{{lang==='fr'?{lang==='fr'?'Configuration':'Setup'}:'Setup'}}</div>
              <h2>{{lang==='fr'?'Paramètres de l\'analyse':'Analysis settings'}}</h2>
            </div>

            {/* URL card */}
            <div className="card">
              <div className="card-title">🔗 URL de la page d'avis</div>
              <div className="url-input-wrap">
                <input
                  className="url-input"
                  type="url"
                  placeholder='https://...'
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                />
                {url && <button className="url-clear" onClick={() => { setUrl(''); setDetectedPlatform(null); }}>×</button>}
              </div>

              {detectedPlatform ? (
                <div className="platform-badge detected">
                  {getPlatformInfo(detectedPlatform).icon} <strong>{getPlatformInfo(detectedPlatform).label}</strong> détecté — prêt à extraire
                </div>
              ) : url.length > 5 ? (
                <div className="platform-badge unknown">
                  ⚠️ Plateforme non supportée. Utilisez Amazon, Google Maps ou TripAdvisor.
                </div>
              ) : (
                <div className="url-examples">
                  {Object.entries(PLATFORM_CONFIG).map(([id, cfg]) => (
                    <div key={id} className="url-example" onClick={() => setUrl(cfg.hint.replace('Ex: ', ''))}>
                      {cfg.icon} {cfg.hint}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sector */}
            <div className="card">
              <div className="card-title">🏪 Secteur <span style={{fontSize:'0.75rem',fontWeight:'400',textTransform:'none',letterSpacing:0,marginLeft:'6px',opacity:0.7}}>{{lang==='fr'?{lang==='fr'?"(optionnel, améliore l'analyse)":'(optional, improves analysis)'}:'(optional, improves analysis)'}}</span></div>
              <div className="pill-grid">
                {SECTORS.map(s => (
                  <button key={s.id} className={`pill-option ${sector === s.id ? 'selected' : ''}`} onClick={() => setSector(sector === s.id ? '' : s.id)}>
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Business name */}
            <div className="card">
              <div className="card-title">🏷️ Nom de l'établissement <span style={{fontSize:'0.75rem',fontWeight:'400',textTransform:'none',letterSpacing:0,marginLeft:'6px',opacity:0.7}}>{{lang==='fr'?{lang==='fr'?'(optionnel)':'(optional)'}:'(optional)'}}</span></div>
              <div className="form-field">
                <input
                  type="text"
                  placeholder={lang==='fr'?{lang==='fr'?'Laissez vide pour détection automatique':'Leave blank for auto detection'}:'Leave blank for auto detection'}
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                />
              </div>
              <p className="field-hint">{{lang==='fr'?{lang==='fr'?'Si vide, ReviewSense tentera de détecter le nom depuis la page.':'If empty, ReviewSense will try to detect the name from the page.'}:'If empty, ReviewSense will try to detect the name from the page.'}}</p>
            </div>

            {error && <div className="error-msg">⚠️ {error}</div>}

            <button className="analyze-btn" onClick={runAnalysis} disabled={!url.trim() || !detectedPlatform}>
              ✦ Lancer l'extraction et l'analyse
            </button>
          </div>
        )}

        {/* ── ANALYZING ── */}
        {step === 'analyzing' && (
          <div className="analyzing">
            <div className="pulse-orb">🔍</div>
            <h2>{{lang==='fr'?{lang==='fr'?'Analyse en cours…':'Analyzing…'}:'Analyzing…'}}</h2>
            <div className="steps-list">
              {ANALYZING_STEPS.map((s, i) => (
                <div key={i} className={`step-item ${i < analyzingStep ? 'done' : i === analyzingStep ? 'active' : ''}`}>
                  <span className="step-icon">{i < analyzingStep ? '✓' : s.icon}</span>
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {step === 'history' && (
          <div className="history-page">
            <div className="page-title-row">
              <h2 className="page-h2">{lang==='fr'?'Mes analyses':'My analyses'}</h2>
              <button className="cta-btn cta-btn-sm" onClick={() => setStep('setup')}>{lang==='fr'?'+ Nouvelle analyse':'+ New analysis'}</button>
            </div>
            <p className="page-sub">{history.length} {lang==='fr'?`${history.length} analyse${history.length!==1?'s':''} sauvegardée${history.length!==1?'s':''} dans ce navigateur`:`${history.length} analysis${history.length!==1?'es':''} saved in this browser`}</p>

            {history.length === 0 ? (
              <div className="history-empty">
                <div className="empty-icon">📋</div>
                <p style={{fontSize:'0.95rem',lineHeight:1.7}}>Aucune analyse pour l'instant.<br />Lancez votre première analyse pour la voir apparaître ici.</p>
              </div>
            ) : (
              <div className="history-grid">
                {history.map(entry => (
                  <div key={entry.id} className="history-card" onClick={() => loadEntry(entry)}>
                    <button className="hc-delete" onClick={e => { e.stopPropagation(); deleteEntry(entry.id); }}>✕</button>
                    <div className="hc-top">
                      <div className="hc-icons">
                        <span>{getSectorIcon(entry.sector)}</span>
                        <span>{getPlatformInfo(entry.platform).icon}</span>
                      </div>
                      <div className="hc-score" style={{color: getScoreColor(entry.score)}}>{entry.score}/10</div>
                    </div>
                    <div className="hc-name">{entry.businessName || 'Sans nom'}</div>
                    <div className="hc-meta">
                      <span>{getPlatformInfo(entry.platform).label}</span>
                      {entry.sector && <span>· {getSectorLabel(entry.sector)}</span>}
                    </div>
                    <div className="hc-summary">{entry.summary}</div>
                    <div className="hc-footer">
                      <span className="hc-date">🕐 {formatDate(entry.date)}</span>
                      {entry.totalReviews && <span className="hc-count">{entry.totalReviews} avis</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── RESULTS ── */}
        {step === 'results' && results && (
          <div className="results">
            <div className="results-header">
              <div className="rh-left">
                <h2>{{lang==='fr'?{lang==='fr'?"Rapport d'analyse":'Analysis Report'}:'Analysis Report'}}</h2>
                <div className="rh-meta">
                  {currentMeta?.platform && <span className="rh-badge">{getPlatformInfo(currentMeta.platform).icon} {getPlatformInfo(currentMeta.platform).label}</span>}
                  {currentMeta?.sector && <span className="rh-badge">{getSectorIcon(currentMeta.sector)} {getSectorLabel(currentMeta.sector)}</span>}
                  {currentMeta?.totalReviews && <span className="rh-badge">📝 {currentMeta.totalReviews} {lang==='fr'?'avis analysés':'reviews analyzed'}</span>}
                  {currentMeta?.avgRating && <span className="rh-badge">⭐ {currentMeta.avgRating}/5 brut</span>}
                </div>
              </div>
              <div className="rh-actions">
                <button className="ghost-btn" onClick={() => setStep('history')}>{{lang==='fr'?{lang==='fr'?'📋 Historique':'📋 History'}:'📋 History'}}</button>
                <button className="ghost-btn" onClick={() => setStep('setup')}>{{lang==='fr'?{lang==='fr'?'+ Nouvelle':'+ New'}:'+ New'}}</button>
              </div>
            </div>

            <div className="bento">
              {/* Score */}
              <div className="bc purple">
                <div className="bc-label"><span className="bc-icon">📊</span> {lang==='fr'?'Score satisfaction':'Satisfaction score'}</div>
                <div className="score-num" style={{color: getScoreColor(results.score)}}>
                  {results.score}<span className="score-denom">/10</span>
                </div>
                <div className="score-comment">{results.scoreComment}</div>
              </div>

              {/* Résumé */}
              <div className="bc mint">
                <div className="bc-label"><span className="bc-icon">📝</span> {lang==='fr'?'Résumé général':'General summary'}</div>
                <p style={{fontSize:'0.91rem',color:'var(--text)',lineHeight:'1.65'}}>{results.summary}</p>
              </div>

              {/* Key themes */}
              {results.keyThemes?.length > 0 && (
                <div className="bc full yellow">
                  <div className="bc-label"><span className="bc-icon">🏷️</span> {lang==='fr'?'Thèmes clés détectés':'Key themes detected'}</div>
                  <div className="themes-wrap">
                    {results.keyThemes.map((t, i) => <div key={i} className="theme-tag">{t}</div>)}
                  </div>
                </div>
              )}

              {/* Frictions */}
              <div className="bc rose">
                <div className="bc-label"><span className="bc-icon">🚨</span> {lang==='fr'?'Points de friction':'Friction points'}</div>
                <ul className="ilist">
                  {results.painPoints?.map((p, i) => (
                    <li key={i} className="iitem"><span className="dot dr" />{p}</li>
                  ))}
                </ul>
              </div>

              {/* Positifs */}
              <div className="bc mint">
                <div className="bc-label"><span className="bc-icon">✨</span> {lang==='fr'?'Points forts':'Strengths'}</div>
                <ul className="ilist">
                  {results.positives?.map((p, i) => (
                    <li key={i} className="iitem"><span className="dot dg" />{p}</li>
                  ))}
                </ul>
              </div>

              {/* Verbatims */}
              <div className="bc full">
                <div className="bc-label"><span className="bc-icon">💬</span> {lang==='fr'?'Verbatims clients':'Customer quotes'}</div>
                {results.verbatims?.map((v, i) => <div key={i} className="verbatim">"{v}"</div>)}
              </div>

              {/* Actions */}
              <div className="bc full purple">
                <div className="bc-label"><span className="bc-icon">🎯</span> {lang==='fr'?'Actions recommandées':'Recommended actions'}</div>
                {results.actions?.map((a, i) => (
                  <div key={i} className="action-row">
                    <div className="action-num">{i + 1}</div>
                    <div className="action-body">
                      <strong>
                        {a.title}
                        {a.priority && (
                          <span className="priority-tag" style={{
                            background: a.priority === 'haute' ? 'rgba(231,76,60,0.1)' : 'rgba(230,126,22,0.1)',
                            color: getPriorityColor(a.priority),
                            border: `1px solid ${getPriorityColor(a.priority)}40`,
                          }}>{a.priority}</span>
                        )}
                      </strong>
                      <span>{a.description}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Opportunités */}
              <div className="bc full peach">
                <div className="bc-label"><span className="bc-icon">💡</span> {lang==='fr'?'Opportunités identifiées':'Identified opportunities'}</div>
                <ul className="ilist">
                  {results.opportunities?.map((o, i) => (
                    <li key={i} className="iitem"><span className="dot db" />{o}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
