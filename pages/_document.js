import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ReviewSense",
    "applicationCategory": "BusinessApplication",
    "description": "Outil d'analyse automatique des avis clients pour TPE, PME et entrepreneurs indépendants. Analysez vos avis Google My Business, Amazon et TripAdvisor en 30 secondes.",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR"
    },
    "creator": {
      "@type": "Organization",
      "name": "ONA — Organisation Numérique & Automatisation",
      "url": "https://ona-action.fr",
      "description": "Association loi 1901 dédiée à rendre la technologie accessible aux TPE, PME, EI et associations via des outils no-code, d'automatisation et d'intelligence artificielle."
    }
  };

  return (
    <Html lang="fr">
      <Head>
        {/* SEO Essentials */}
        <meta charSet="utf-8" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="ONA — Organisation Numérique & Automatisation" />
        <meta name="copyright" content="ONA association loi 1901" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ReviewSense by ONA" />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="fr_FR" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="/og-image.png" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
