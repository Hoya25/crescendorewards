import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noIndex?: boolean;
}

const defaultMeta = {
  title: "Crescendo | Live and Earn | by NCTR Alliance",
  description: "Earn status through participation. Shop, contribute, commit for 360 days, and rise from Bronze to Diamond. Crescendo by NCTR Alliance.",
  ogImage: "https://crescendo.nctr.live/og-image.png",
  siteUrl: "https://crescendo.nctr.live",
};

export function SEO({
  title,
  description = defaultMeta.description,
  canonical,
  ogImage = defaultMeta.ogImage,
  ogType = 'website',
  noIndex = false,
}: SEOProps) {
  const pageTitle = title 
    ? `${title} | Crescendo` 
    : defaultMeta.title;

  const fullOgImage = ogImage.startsWith('http') 
    ? ogImage 
    : `${defaultMeta.siteUrl}${ogImage}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={description} />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:site_name" content="Crescendo by NCTR Alliance" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />
    </Helmet>
  );
}
