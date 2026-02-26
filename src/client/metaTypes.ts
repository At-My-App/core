export type AtMyAppHeadConfig = {
  // Basic
  title?: string;
  description?: string;
  robots?: string;

  // Canonical & Sitemap
  canonical?: string;
  sitemap?: string;

  // Open Graph / Social
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;

  // Icons
  favicon?: string;
  appleTouchIcon?: string;
  themeColor?: string;

  // Verification
  googleSiteVerification?: string;

  // Structured Data
  jsonLd?: Record<string, unknown>;

  // AtMyApp Analytics
  analyticsId?: string;
  analyticsUrl?: string;
};
