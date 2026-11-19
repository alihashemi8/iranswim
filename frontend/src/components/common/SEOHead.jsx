import React, { useEffect } from 'react';

/**
 * Robust SEO Head Manager Component
 * Sets document title, meta tags (description, robots, keywords), canonical URL,
 * Open Graph, Twitter Cards, and JSON-LD structured data dynamically.
 */
export const SEOHead = ({
  title,
  description,
  canonicalUrl,
  keywords,
  robots = 'index, follow',
  ogType = 'website',
  ogImage = 'https://iran-swim.ir/images/logo.png',
  schemaData = null,
  breadcrumbs = null,
}) => {
  const fullTitle = title.includes('مدرسه شنای ایران') || title.includes('IranSwim')
    ? title
    : `${title} | مدرسه شنای ایران (IranSwim)`;

  const siteUrl = 'https://iran-swim.ir';
  const cleanCanonical = canonicalUrl
    ? (canonicalUrl.startsWith('http') ? canonicalUrl : `${siteUrl}${canonicalUrl}`)
    : siteUrl;

  useEffect(() => {
    // 1. Update Title
    document.title = fullTitle;

    // Helper to get or create a meta tag
    const setMetaTag = (attribute, attrValue, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attribute}="${attrValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attribute, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Helper to get or create a link tag
    const setLinkTag = (rel, href) => {
      if (!href) return;
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // 2. Meta Description
    setMetaTag('name', 'description', description);

    // 3. Robots
    setMetaTag('name', 'robots', robots);

    // 4. Keywords
    if (keywords) {
      setMetaTag('name', 'keywords', keywords);
    }

    // 5. Canonical
    setLinkTag('canonical', cleanCanonical);

    // 6. Open Graph
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', cleanCanonical);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:site_name', 'مدرسه شنای ایران - IranSwim');
    setMetaTag('property', 'og:locale', 'fa_IR');

    // 7. Twitter Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', ogImage);

    // 8. Structured Data JSON-LD (Page-level schemas)
    let scriptTag = document.querySelector('#page-structured-data');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'page-structured-data';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const schemasToInject = [];

    // Optional breadcrumb schema
    if (breadcrumbs && Array.isArray(breadcrumbs) && breadcrumbs.length > 0) {
      schemasToInject.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        '@id': `${cleanCanonical}#breadcrumb`,
        'itemListElement': breadcrumbs.map((b, idx) => ({
          '@type': 'ListItem',
          'position': idx + 1,
          'name': b.name,
          'item': b.url.startsWith('http') ? b.url : `${siteUrl}${b.url}`,
        })),
      });
    }

    // Page-specific schema(s)
    if (schemaData) {
      if (Array.isArray(schemaData)) {
        schemasToInject.push(...schemaData);
      } else {
        schemasToInject.push(schemaData);
      }
    }

    if (schemasToInject.length > 0) {
      scriptTag.textContent = JSON.stringify(
        schemasToInject.length === 1 ? schemasToInject[0] : {
          '@context': 'https://schema.org',
          '@graph': schemasToInject,
        }
      );
    } else {
      scriptTag.textContent = '';
    }

    // Cleanup on unmount or route change
    return () => {
      // Keep basic meta tags or reset if needed
    };
  }, [fullTitle, description, cleanCanonical, keywords, robots, ogType, ogImage, schemaData, breadcrumbs]);

  return null;
};
