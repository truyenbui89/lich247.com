import React, { useEffect } from 'react';

interface SeoHeadProps {
  title: string;
  description: string;
  canonicalPath: string; // Should start with /
  image?: string;
}

export const SeoHead: React.FC<SeoHeadProps> = ({ 
  title, 
  description, 
  canonicalPath,
  image = "https://lich247.com/og-image-default.jpg"
}) => {
  const domain = "https://lich247.com";
  const fullUrl = `${domain}${canonicalPath}`;

  useEffect(() => {
    // === 1. TITLE UPDATE ===
    document.title = `${title} | Lịch Vạn Sự Việt Nam`;

    // === 2. HELPER TO UPDATE OR CREATE META ===
    // This function removes existing duplicates to ensure cleaner HEAD
    const updateMeta = (name: string, content: string, attributeName: string = 'name') => {
      // Find all existing tags matching this name
      const existingTags = document.querySelectorAll(`meta[${attributeName}="${name}"]`);
      
      // Remove all of them except the first one (or remove all to recreate fresh)
      // Strategy: Remove ALL matching tags first to avoid duplicates/stale data
      existingTags.forEach(tag => tag.remove());

      // Create new tag
      const newTag = document.createElement('meta');
      newTag.setAttribute(attributeName, name);
      newTag.setAttribute('content', content);
      document.head.appendChild(newTag);
    };

    // === 3. UPDATE STANDARD SEO TAGS ===
    updateMeta('description', description);
    updateMeta('author', 'Lịch Vạn Sự Việt Nam');
    updateMeta('robots', 'index, follow');

    // === 4. UPDATE OPEN GRAPH (Facebook/Zalo) ===
    updateMeta('og:type', 'website', 'property');
    updateMeta('og:url', fullUrl, 'property');
    updateMeta('og:title', title, 'property');
    updateMeta('og:description', description, 'property');
    updateMeta('og:image', image, 'property');
    updateMeta('og:site_name', 'Lịch Vạn Sự Việt Nam', 'property');
    updateMeta('og:locale', 'vi_VN', 'property');

    // === 5. UPDATE TWITTER CARDS ===
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:url', fullUrl);
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', image);

    // === 6. UPDATE CANONICAL LINK ===
    // Remove existing canonicals
    const existingCanonicals = document.querySelectorAll('link[rel="canonical"]');
    existingCanonicals.forEach(link => link.remove());

    // Add new canonical
    const linkCanonical = document.createElement('link');
    linkCanonical.setAttribute('rel', 'canonical');
    linkCanonical.setAttribute('href', fullUrl);
    document.head.appendChild(linkCanonical);

  }, [title, description, canonicalPath, image, fullUrl]);

  return null;
};