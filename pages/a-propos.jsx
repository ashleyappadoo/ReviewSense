import Head from 'next/head';
import Link from 'next/link';

export default function APropos() {
  return (
    <>
      <Head>
        <title>À propos — ReviewSense by ONA</title>
        <meta name="description" content="ReviewSense est un outil digital créé par ONA, association loi 1901 dédiée à rendre la technologie accessible aux TPE, PME et entrepreneurs indépendants." />
        <meta property="og:title" content="À propos — ReviewSense by ONA" />
        <meta property="og:description" content="ReviewSense est un outil digital créé par ONA pour aider les commerçants à comprendre leurs avis clients." />
      </Head>

      <style jsx>{`
        .page { max-width: 760px; margin: 0 auto; padding: 60px 24px; }
        .back { display: inline-flex; align-items: center; gap: 8px; color: #7c5cbf; font-weight: 600; font-size: 0.9rem; text-decoration: none; margin-bottom: 40px; }
        .back:hover { opacity: 0.8; }
        h1 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 2.4rem; font-weight: 800; color: #1a1525; letter-spacing: -1.5px; margin-bottom: 12px; }
        .subtitle { font-size: 1.1rem; color: #7a6d8a; margin-bottom: 48px; line-height: 1.7; }
        .section { margin-bottom: 48px; }
        h2 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 1.4rem; font-weight: 700; color: #1a1525; margin-bottom: 16px; letter-spacing: -0.5px; }
        p { color: #4a4060; line-height: 1.8; margin-bottom: 14px; font-size: 0.97rem; }
        .ona-card { background: linear-gradient(135deg, rgba(197,184,248,0.2), rgba(255,200,168,0.15)); border: 1px solid rgba(197,184,248,0.4); border-radius: 20px; padding: 32px; margin: 40px 0; }
        .ona-card h2 { background: linear-gradient(135deg, #7c5cbf, #d4609a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .values { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
        .value-item { background: rgba(255,255,255,0.7); border-radius: 14px; padding: 18px; border: 1px solid rgba(197,184,248,0.3); }
        .value-icon { font-size: 1.5rem; margin-bottom: 8px; }
        .value-title { font-weight: 700; color: #1a1525; font-size: 0.9rem; margin-bottom: 4px; }
        .value-desc { font-size: 0.82rem; color: #7a6d8a; line-height: 1.5; }
        .contact-cta { text-align: center; margin-top: 48px; }
        .cta-btn { display: inline-flex; align-items: center; gap: 10px; padding: 14px 32px; background: linear-gradient(135deg, #7c5cbf, #d4609a); color: white; font-family: 'Bricolage Grotesque', sans-serif; font-size: 1rem; font-weight: 700; border-radius: 50px; text-decoration: none; transition: all 0.3s; box-shadow: 0 6px 24px rgba(124,92,191,0.3); }
        .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(124,92,191,0.4); }
        @media(max-width: 600px) { .values { grid-template-columns: 1fr; } h1 { font-size: 1.9rem; } }
      `}</style>

      <div style={{background: '#faf8ff', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif"}}>
        <div style={{padding: '20px 24px', borderBottom: '1px solid rgba(197,184,248,0.3)', background: 'rgba(250,248,255,0.9)', backdropFilter: 'blur(12px)'}}>
          <Link href="/" style={{fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1.3rem', fontWeight: 800, background: 'linear-gradient(135deg, #7c5cbf, #d4609a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none'}}>
            Review<span style={{background: 'linear-gradient(135deg, #d4609a, #f4a261)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Sense</span>
          </Link>
        </div>

        <div className="page">
          <Link href="/" className="back">← Retour</Link>

          <h1>À propos de ReviewSense</h1>
          <p className="subtitle">Un outil digital conçu pour rendre l'analyse de la voix client accessible à tous les commerçants, sans compétences techniques.</p>

          <div className="section">
            <h2>Notre mission</h2>
            <p>ReviewSense est né d'un constat simple : les TPE, PME et entrepreneurs indépendants reçoivent des centaines d'avis clients chaque mois, mais n'ont ni le temps ni les outils pour en extraire des insights actionnables.</p>
            <p>Là où les grandes entreprises s'offrent des équipes dédiées à l'analyse de la voix client et des outils à plusieurs milliers d'euros par mois, ReviewSense propose la même puissance d'analyse en 30 secondes, pour n'importe quel commerçant disposant d'une URL.</p>
            <p>Collez l'URL de votre page Google My Business, Amazon ou TripAdvisor. ReviewSense extrait automatiquement vos avis et génère un rapport structuré : points de friction, points forts, verbatims clients, actions prioritaires et opportunités identifiées.</p>
          </div>

          <div className="ona-card">
            <h2>Conçu et développé par ONA</h2>
            <p>ReviewSense est un outil digital de l'association <strong>ONA — Organisation Numérique & Automatisation</strong>, association loi 1901 dont la mission est de rendre la technologie accessible aux structures qui en ont le plus besoin : TPE, PME, entreprises individuelles, associations et acteurs de l'économie sociale et solidaire.</p>
            <p>ONA propose des services d'automatisation, d'IA et de no-code à des tarifs adaptés aux petites structures, en rupture avec les offres traditionnellement réservées aux grands comptes.</p>
            <div className="values">
              <div className="value-item">
                <div className="value-icon">🎯</div>
                <div className="value-title">Accessibilité</div>
                <div className="value-desc">Des outils puissants à portée de toutes les structures, quelle que soit leur taille.</div>
              </div>
              <div className="value-item">
                <div className="value-icon">🔒</div>
                <div className="value-title">Confidentialité</div>
                <div className="value-desc">Vos données ne sont jamais stockées. Chaque analyse est traitée et effacée instantanément.</div>
              </div>
              <div className="value-item">
                <div className="value-icon">⚡</div>
                <div className="value-title">Efficacité</div>
                <div className="value-desc">30 secondes pour obtenir des insights qui auraient pris des heures à collecter manuellement.</div>
              </div>
              <div className="value-item">
                <div className="value-icon">🤝</div>
                <div className="value-title">Impact local</div>
                <div className="value-desc">Conçu pour renforcer la compétitivité des commerces locaux face aux grandes enseignes.</div>
              </div>
            </div>
          </div>

          <div className="section">
            <h2>La technologie</h2>
            <p>ReviewSense est propulsé par Claude d'Anthropic, l'un des modèles d'intelligence artificielle les plus avancés pour l'analyse de texte. Les avis sont extraits via des APIs spécialisées (RapidAPI) qui gèrent la complexité technique des plateformes, et analysés en temps réel pour produire un rapport structuré.</p>
            <p>L'application est construite avec Next.js et déployée sur Vercel. Elle est conçue pour être rapide, légère et respectueuse de la vie privée : aucune donnée personnelle n'est conservée sur nos serveurs.</p>
          </div>

          <div className="contact-cta">
            <Link href="/contact" className="cta-btn">Nous contacter →</Link>
          </div>
        </div>
      </div>
    </>
  );
}
