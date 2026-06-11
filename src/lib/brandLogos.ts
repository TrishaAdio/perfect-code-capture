// Map well-known service names to high-quality brand artwork.
// Uses simpleicons.org CDN (SVG) — recognizable, official-style logos.

type Brand = {
  slug: string;       // simpleicons slug
  color: string;      // hex without #
  bg: string;         // brand background tint
};

const BRANDS: Record<string, Brand> = {
  netflix:        { slug: "netflix",        color: "E50914", bg: "#0a0a0a" },
  prime:          { slug: "primevideo",     color: "00A8E1", bg: "#0a1b2a" },
  "amazon prime": { slug: "primevideo",     color: "00A8E1", bg: "#0a1b2a" },
  "prime video":  { slug: "primevideo",     color: "00A8E1", bg: "#0a1b2a" },
  hotstar:        { slug: "hotstar",        color: "1F80E0", bg: "#0a1322" },
  "disney+":      { slug: "disneyplus",     color: "0E6BFF", bg: "#0a1226" },
  disney:         { slug: "disneyplus",     color: "0E6BFF", bg: "#0a1226" },
  spotify:        { slug: "spotify",        color: "1DB954", bg: "#0b1410" },
  youtube:        { slug: "youtubemusic",   color: "FF0000", bg: "#150a0a" },
  "yt music":     { slug: "youtubemusic",   color: "FF0000", bg: "#150a0a" },
  "youtube premium": { slug: "youtube",     color: "FF0000", bg: "#150a0a" },
  sonyliv:        { slug: "sonyliv",        color: "1A1A1A", bg: "#1a1a1a" },
  "sony liv":     { slug: "sonyliv",        color: "1A1A1A", bg: "#1a1a1a" },
  zee5:           { slug: "zee5",           color: "8230C8", bg: "#180a22" },
  "apple tv":     { slug: "appletv",        color: "FFFFFF", bg: "#0a0a0a" },
  appletv:        { slug: "appletv",        color: "FFFFFF", bg: "#0a0a0a" },
  jiocinema:      { slug: "jiocinema",      color: "B423FF", bg: "#150a22" },
  "jio cinema":   { slug: "jiocinema",      color: "B423FF", bg: "#150a22" },
  jiosaavn:       { slug: "jiosaavn",       color: "2BC5B4", bg: "#08151a" },
  saavn:          { slug: "jiosaavn",       color: "2BC5B4", bg: "#08151a" },
  apple:          { slug: "applemusic",     color: "FA243C", bg: "#150a0d" },
  "apple music":  { slug: "applemusic",     color: "FA243C", bg: "#150a0d" },
  hulu:           { slug: "hulu",           color: "1CE783", bg: "#08140d" },
  hbo:            { slug: "hbo",            color: "FFFFFF", bg: "#0a0a0a" },
  max:            { slug: "max",            color: "002BE7", bg: "#080a1c" },
  crunchyroll:    { slug: "crunchyroll",    color: "F47521", bg: "#1c0e08" },
  chatgpt:        { slug: "openai",         color: "10A37F", bg: "#08140f" },
  openai:         { slug: "openai",         color: "10A37F", bg: "#08140f" },
  midjourney:     { slug: "midjourney",     color: "FFFFFF", bg: "#0a0a0a" },
  canva:          { slug: "canva",          color: "00C4CC", bg: "#08161a" },
  adobe:          { slug: "adobecreativecloud", color: "DA1F26", bg: "#1a0808" },
  notion:         { slug: "notion",         color: "FFFFFF", bg: "#0a0a0a" },
  figma:          { slug: "figma",          color: "F24E1E", bg: "#1a0a08" },
  github:         { slug: "github",         color: "FFFFFF", bg: "#0a0a0a" },
  linkedin:       { slug: "linkedin",       color: "0A66C2", bg: "#08121a" },
  grammarly:      { slug: "grammarly",      color: "00B894", bg: "#08161a" },
  duolingo:       { slug: "duolingo",       color: "58CC02", bg: "#0d1a08" },
  perplexity:     { slug: "perplexity",     color: "1FB8CD", bg: "#08161a" },
  claude:         { slug: "anthropic",      color: "D97757", bg: "#1a0e08" },
  gemini:         { slug: "googlegemini",   color: "8E75F8", bg: "#0e0a1c" },
};

export type BrandArt = { url: string; bg: string; name: string } | null;

export function getBrandArt(name?: string | null): BrandArt {
  if (!name) return null;
  const n = name.toLowerCase();
  // Find longest matching key.
  let best: { key: string; brand: Brand } | null = null;
  for (const key of Object.keys(BRANDS)) {
    if (n.includes(key) && (!best || key.length > best.key.length)) {
      best = { key, brand: BRANDS[key] };
    }
  }
  if (!best) return null;
  return {
    url: `https://cdn.simpleicons.org/${best.brand.slug}/${best.brand.color}`,
    bg: best.brand.bg,
    name: best.key,
  };
}
