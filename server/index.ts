import express, { type Request } from "express";
import { createServer } from "http";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { absoluteSiteUrl, getSeoMetadata, normalizeSiteUrl } from "../shared/seo";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sitemapRoutes = ["/"];

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceSeoAttribute(
  html: string,
  dataSeo: string,
  attribute: string,
  value: string,
): string {
  const pattern = new RegExp(
    `(<[^>]+data-seo="${escapeRegExp(dataSeo)}"[^>]*${attribute}=")[^"]*(")`,
  );
  return html.replace(pattern, `$1${escapeHtml(value)}$2`);
}

function renderSeoHtml(html: string, request: Request): string {
  const metadata = getSeoMetadata(request.path);
  const configuredSiteUrl = process.env.SITE_URL?.trim();
  const requestOrigin = `${request.protocol}://${request.get("host")}`;
  const siteUrl = normalizeSiteUrl(configuredSiteUrl || requestOrigin);
  const canonicalUrl = absoluteSiteUrl(siteUrl, request.path);
  const imageUrl = absoluteSiteUrl(siteUrl, "/social-card.png");
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Focus Flow",
    url: canonicalUrl,
    description: metadata.description,
  }).replace(/</g, "\\u003c");

  let rendered = html.replace(
    /<title data-seo="title">[\s\S]*?<\/title>/,
    `<title data-seo="title">${escapeHtml(metadata.title)}</title>`,
  );
  rendered = replaceSeoAttribute(rendered, "description", "content", metadata.description);
  rendered = replaceSeoAttribute(rendered, "robots", "content", metadata.robots);
  rendered = replaceSeoAttribute(rendered, "canonical", "href", canonicalUrl);
  const headEnd = rendered.indexOf("</head>");
  const canonicalTag = `<link rel="canonical" data-seo="canonical" href="${escapeHtml(canonicalUrl)}" />\n`;
  rendered = headEnd >= 0
    ? `${rendered.slice(0, headEnd)}${canonicalTag}${rendered.slice(headEnd)}`
    : rendered;
  rendered = replaceSeoAttribute(rendered, "og:title", "content", metadata.title);
  rendered = replaceSeoAttribute(rendered, "og:description", "content", metadata.description);
  rendered = replaceSeoAttribute(rendered, "og:url", "content", canonicalUrl);
  rendered = replaceSeoAttribute(rendered, "og:type", "content", metadata.type);
  rendered = replaceSeoAttribute(rendered, "og:image", "content", imageUrl);
  rendered = replaceSeoAttribute(rendered, "og:image:type", "content", "image/png");
  rendered = replaceSeoAttribute(rendered, "og:image:width", "content", "1200");
  rendered = replaceSeoAttribute(rendered, "og:image:height", "content", "630");
  rendered = replaceSeoAttribute(rendered, "og:image:alt", "content", metadata.title);
  rendered = replaceSeoAttribute(rendered, "twitter:title", "content", metadata.title);
  rendered = replaceSeoAttribute(rendered, "twitter:description", "content", metadata.description);
  rendered = replaceSeoAttribute(rendered, "twitter:image", "content", imageUrl);
  rendered = replaceSeoAttribute(rendered, "twitter:image:alt", "content", metadata.title);
  rendered = rendered.replace(
    /<script type="application\/ld\+json" data-seo="jsonld">[\s\S]*?<\/script>/,
    metadata.robots === "index, follow"
      ? `<script type="application/ld+json" data-seo="jsonld">${jsonLd}</script>`
      : "",
  );
  return rendered;
}

function sitemapXml(siteUrl: string): string {
  const urls = sitemapRoutes
    .map(route => `  <url><loc>${escapeHtml(absoluteSiteUrl(siteUrl, route))}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.disable("x-powered-by");

  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()"
    );
    next();
  });

  app.use(["/__manus__", "/manus-storage"], (_req, res) => {
    res.sendStatus(404);
  });

  app.get("/robots.txt", (_req, res) => {
    const siteUrl = process.env.SITE_URL?.trim();
    const lines = ["User-agent: *", "Allow: /"];
    if (siteUrl) lines.push(`Sitemap: ${absoluteSiteUrl(normalizeSiteUrl(siteUrl), "/sitemap.xml")}`);
    res.type("text/plain").send(`${lines.join("\n")}\n`);
  });

  app.get("/sitemap.xml", (_req, res) => {
    const siteUrl = process.env.SITE_URL?.trim();
    if (!siteUrl) {
      res.status(503).type("text/plain").send("SITE_URL is required to serve sitemap.xml.\n");
      return;
    }
    res.type("application/xml").send(sitemapXml(normalizeSiteUrl(siteUrl)));
  });

  app.get("/llms.txt", (_req, res) => {
    const siteUrl = process.env.SITE_URL?.trim();
    const homeUrl = siteUrl ? absoluteSiteUrl(normalizeSiteUrl(siteUrl), "/") : "/";
    res.type("text/plain").send(
      `# Focus Flow\n\n> Focus Flow helps people plan focused work, run a session timer, capture distractions, and review their progress.\n\n## Canonical page\n\n- [Home](${homeUrl})\n`,
    );
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath, { index: false }));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (req, res) => {
    const html = readFileSync(path.join(staticPath, "index.html"), "utf8");
    res.type("html").send(renderSeoHtml(html, req));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
