import Head from 'next/head';
import Link from 'next/link';

export default function PolitiqueConfidentialite() {
  return (
    <>
      <Head>
        <title>Politique de confidentialité — ReviewSense by ONA</title>
        <meta name="description" content="Politique de confidentialité de ReviewSense. Découvrez comment nous traitons vos données." />
        <meta name="robots" content="noindex, follow" />
      </Head>

      <style jsx>{`
        .page { max-width: 760px; margin: 0 auto; padding: 60px 24px; font-family: 'DM Sans', sans-serif; }
        .back { display: inline-flex; align-items: center; gap: 8px; color: #7c5cbf; font-weight: 600; font-size: 0.9rem; text-decoration: none; margin-bottom: 40px; }
        h1 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 2rem; font-weight: 800; color: #1a1525; letter-spacing: -1px; margin-bottom: 8px; }
        .date { color: #7a6d8a; font-size: 0.85rem; margin-bottom: 40px; }
        h2 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 1.2rem; font-weight: 700; color: #1a1525; margin: 32px 0 12px; }
        p, li { color: #4a4060; line-height: 1.8; font-size: 0.95rem; margin-bottom: 10px; }
        ul { padding-left: 20px; margin-bottom: 16px; }
        strong { color: #1a1525; }
        a { color: #7c5cbf; }
      `}</style>

      <div style={{background: '#faf8ff', minHeight: '100vh'}}>
        <div style={{padding: '20px 24px', borderBottom: '1px solid rgba(197,184,248,0.3)', background: 'rgba(250,248,255,0.9)'}}>
          <Link href="/" style={{fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1.3rem', fontWeight: 800, background: 'linear-gradient(135deg, #7c5cbf, #d4609a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none'}}>
            Review<span style={{background: 'linear-gradient(135deg, #d4609a, #f4a261)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Sense</span>
          </Link>
        </div>
        <div className="page">
          <Link href="/" className="back">← Retour</Link>
          <h1>Politique de confidentialité</h1>
          <p className="date">Dernière mise à jour : mars 2026</p>

          <h2>1. Responsable du traitement</h2>
          <p>ReviewSense est un service édité par <strong>ONA — Organisation Numérique & Automatisation</strong>, association loi 1901, dont le siège est situé à Bordeaux, France. Contact : contact@ona-asso.fr</p>

          <h2>2. Données collectées</h2>
          <p>ReviewSense ne collecte aucune donnée personnelle identifiable. Concrètement :</p>
          <ul>
            <li>Les URLs que vous saisissez sont traitées en temps réel et ne sont jamais stockées sur nos serveurs.</li>
            <li>Les avis clients extraits sont transmis à l'API Claude (Anthropic) pour analyse et immédiatement effacés.</li>
            <li>L'historique de vos analyses est stocké <strong>uniquement dans le localStorage de votre navigateur</strong>, sur votre appareil. Nous n'y avons aucun accès.</li>
            <li>Aucun cookie de tracking n'est déposé sur votre navigateur.</li>
          </ul>

          <h2>3. Services tiers utilisés</h2>
          <ul>
            <li><strong>Anthropic Claude API</strong> — analyse IA des avis. Politique de confidentialité : anthropic.com/privacy</li>
            <li><strong>RapidAPI</strong> — extraction des avis depuis les plateformes. Politique : rapidapi.com/privacy</li>
            <li><strong>Vercel</strong> — hébergement de l'application. Politique : vercel.com/legal/privacy-policy</li>
            <li><strong>Google AdSense</strong> (éventuellement) — affichage de publicités contextuelles. Google peut utiliser des cookies à des fins publicitaires conformément à sa politique : policies.google.com/privacy</li>
          </ul>

          <h2>4. Cookies</h2>
          <p>ReviewSense n'utilise pas de cookies propriétaires. Si Google AdSense est activé, des cookies tiers peuvent être déposés par Google à des fins publicitaires. Vous pouvez les refuser via les paramètres de votre navigateur ou via <a href="https://adssettings.google.com" target="_blank" rel="noreferrer">adssettings.google.com</a>.</p>

          <h2>5. Vos droits (RGPD)</h2>
          <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
          <ul>
            <li>Droit d'accès, de rectification et d'effacement de vos données</li>
            <li>Droit à la portabilité</li>
            <li>Droit d'opposition au traitement</li>
          </ul>
          <p>Pour exercer ces droits, contactez-nous à : <a href="mailto:contact@ona-asso.fr">contact@ona-asso.fr</a></p>
          <p>Vous pouvez également adresser une réclamation à la CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">cnil.fr</a></p>

          <h2>6. Sécurité</h2>
          <p>Les communications entre votre navigateur et nos serveurs sont chiffrées via HTTPS. Aucune donnée sensible (identifiants, mots de passe, données bancaires) n'est jamais collectée.</p>

          <h2>7. Modification de la politique</h2>
          <p>ONA se réserve le droit de modifier cette politique à tout moment. La date de dernière mise à jour est indiquée en haut de cette page.</p>
        </div>
      </div>
    </>
  );
}
