import { useEffect } from "react";
import { useLocation } from "wouter";
import { absoluteSiteUrl, getSeoMetadata } from "@shared/seo";

const imagePath = "/brand/focus-flow-mark.png";

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[data-seo="${attribute}:${key}"]`,
  );

  if (!element) {
    element = document.createElement("meta");
    element.dataset.seo = `${attribute}:${key}`;
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.content = content;
}

function upsertCanonical(url: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[data-seo="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.dataset.seo = "canonical";
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = url;
}

export default function SeoMetadata() {
  const [location] = useLocation();

  useEffect(() => {
    const pathname = location.split(/[?#]/, 1)[0] || "/";
    const metadata = getSeoMetadata(pathname);
    const siteUrl = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/+$/, "");
    const canonicalUrl = absoluteSiteUrl(siteUrl, pathname);
    const imageUrl = absoluteSiteUrl(siteUrl, imagePath);

    document.title = metadata.title;
    upsertMeta("name", "description", metadata.description);
    upsertMeta("name", "robots", metadata.robots);
    upsertCanonical(canonicalUrl);
    upsertMeta("property", "og:title", metadata.title);
    upsertMeta("property", "og:description", metadata.description);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:type", metadata.type);
    upsertMeta("property", "og:image", imageUrl);
    upsertMeta("property", "og:image:alt", "Focus Flow mark");
    upsertMeta("name", "twitter:card", "summary");
    upsertMeta("name", "twitter:title", metadata.title);
    upsertMeta("name", "twitter:description", metadata.description);
    upsertMeta("name", "twitter:image", imageUrl);

    const existingJsonLd = document.head.querySelector<HTMLScriptElement>('script[data-seo="jsonld"]');
    if (pathname === "/") {
      const jsonLd = existingJsonLd ?? document.createElement("script");
      jsonLd.type = "application/ld+json";
      jsonLd.dataset.seo = "jsonld";
      jsonLd.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Focus Flow",
        url: canonicalUrl,
        description: metadata.description,
      });
      if (!existingJsonLd) document.head.appendChild(jsonLd);
    } else {
      existingJsonLd?.remove();
    }
  }, [location]);

  return null;
}
