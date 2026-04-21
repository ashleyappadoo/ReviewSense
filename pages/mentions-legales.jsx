import Head from 'next/head';
import Link from 'next/link';

export default function MentionsLegales() {
  return (
    <>
      <Head>
        <title>Mentions légales — ReviewSense by ONA</title>
        <meta name="description" content="Mentions légales de ReviewSense, outil digital édité par l'association ONA." />
        <meta name="robots" content="noindex, follow" />
      </Head>

      <style jsx>{`
        .page { max-width: 760px; margin: 0 auto; padding: 60px 24px; font-family: 'DM Sans', sans-serif; }
        .back { display: inline-flex; align-items: center; gap: 8px; color: #7c5cbf; font-weight: 600; font-size: 0.9rem; text-decoration: none; margin-bottom: 40px; }
        h1 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 2rem; font-weight: 800; color: #1a1525; letter-spacing: -1px; margin-bottom: 40px; }
        h2 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 1.2rem; font-weight: 700; color: #1a1525; margin: 32px 0 12px; }
        p, li { color: #4a4060; line-height: 1.8; font-size: 0.95rem; margin-bottom: 10px; }
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
          <h1>Mentions légales</h1>

          <h2>Éditeur du site</h2>
          <p><strong>ONA — Organisation Numérique & Automatisation</strong><br/>
          Association loi 1901<br/>
          Siège social : Bordeaux, France<br/>
          Email : <a href="mailto:contact@ona-asso.fr">contact@ona-asso.fr</a><br/>
          Site : <a href="https://ona-asso.fr" target="_blank" rel="noreferrer">ona-asso.fr</a></p>

          <h2>Directeur de publication</h2>
          <p>Le directeur de publication est le président de l'association ONA.</p>

          <h2>Hébergement</h2>
          <p><strong>Vercel Inc.</strong><br/>
          440 N Barranca Ave #4133<br/>
          Covina, CA 91723, États-Unis<br/>
          <a href="https://vercel.com" target="_blank" rel="noreferrer">vercel.com</a></p>

          <h2>Propriété intellectuelle</h2>
          <p>L'ensemble des contenus présents sur ReviewSense (textes, visuels, code, structure) est la propriété exclusive de l'association ONA, sauf mention contraire. Toute reproduction, même partielle, est soumise à autorisation préalable.</p>

          <h2>Responsabilité</h2>
          <p>ReviewSense est un outil d'aide à la décision basé sur l'intelligence artificielle. Les analyses générées sont fournies à titre indicatif et ne sauraient engager la responsabilité de l'association ONA. L'utilisateur reste seul responsable de l'utilisation qu'il fait des informations fournies.</p>

          <h2>Données personnelles</h2>
          <p>Pour toute information relative au traitement de vos données personnelles, consultez notre <Link href="/politique-confidentialite" style={{color: '#7c5cbf'}}>Politique de confidentialité</Link>.</p>

          <h2>Droit applicable</h2>
          <p>Le présent site est soumis au droit français. En cas de litige, les tribunaux français seront seuls compétents.</p>
        </div>
      </div>
    </>
  );
}
