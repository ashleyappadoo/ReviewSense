const SITE_URL = 'https://reviewsense.vercel.app';

function generateSitemap() {
  const pages = [
    { url: '/', changefreq: 'weekly', priority: '1.0' },
    { url: '/a-propos', changefreq: 'monthly', priority: '0.8' },
    { url: '/contact', changefreq: 'monthly', priority: '0.7' },
    { url: '/mentions-legales', changefreq: 'yearly', priority: '0.3' },
    { url: '/politique-confidentialite', changefreq: 'yearly', priority: '0.3' },
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`).join('\n')}
</urlset>`;
}

export default function Sitemap() {}

export async function getServerSideProps({ res }) {
  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
  res.write(generateSitemap());
  res.end();
  return { props: {} };
}
