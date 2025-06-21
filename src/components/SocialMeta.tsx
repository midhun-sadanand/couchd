import Head from 'next/head';

interface SocialMetaProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

export default function SocialMeta({
  title = "Couchd",
  description = "Next.js 14 Couchd app",
  image = "/og-image.png",
  url,
  type = "website"
}: SocialMetaProps) {
  const fullUrl = url ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'}${url}` : undefined;
  
  return (
    <Head>
      {/* Additional meta tags for better social sharing */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      {fullUrl && <meta property="og:url" content={fullUrl} />}
      <meta property="og:type" content={type} />
      
      {/* Twitter Card meta tags */}
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Additional favicon formats for better compatibility */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      
      {/* Preconnect to improve loading performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </Head>
  );
} 