import type { SwipeCard } from "../types/feed";

/**
 * Decorative cover art from Unsplash (hotlink OK per their license).
 * Large pool + FNV-1a over id, url, title, source so each story maps to a stable, varied image.
 */

const U = "https://images.unsplash.com";

/** 50+ distinct editorial / tech / workspace frames; index mixes id, url, title, source. */
const CURATED: string[] = [
  `${U}/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1535378917042-10a22c55931c?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1517694712202-3dd4d9263e34?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1591799264318-63e84a60431a?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1581092160562-40aa08f68853?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1504711434969-e33886174f5d?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1586339949916-3e9457bef6d3?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1446776811953-b23dafda499c?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1516116216624-53e697bdbea3?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1581091225885-c89d7fda9c7a?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1551434678-e076c223a8ba?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1504639723920-7492bfc2e1f7?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1485827405143-99fb01dd72a8?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1531483787282-456847c0e71c?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1523969768758-c9099c21e91d?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1515879636293-7ca999e2654f?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1563986768609-1f20bcc01164?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1544198365-29168a132693?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1550751827-4bd192c6a086?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1639322208474-cd4c8fce22d4?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1614854268739-b228a968b40a?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1486312917500-23a94e6213b4?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1497366212048-4f1e6526285c?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1523240796892-b6d7867056f1?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1557804507-896a20d15579?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1517245385007-99e45017759c?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1504384767962-0e911ea97c3f?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1581094794892-daed0c32d2eb?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1522071973507-7a937fb3c7a2?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1550751827-3e4b6a705d85?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1462337355939-022ccdac9da2?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1472214104321-24e5a4612af8?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1504384307929-17617a2bdb3a?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1618005182384-a83a8bd57f99?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80`,
  `${U}/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80`,
];

function fnv1a32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** Nudges index so similar keywords do not always collide on the same frame. */
function keywordSalt(card: SwipeCard): number {
  const t = `${card.title} ${card.summary ?? ""} ${card.description ?? ""}`.toLowerCase();
  let s = 0;
  if (/\b(ai|ml|llm|gpt|neural|model|inference)\b/.test(t)) s += 3;
  if (/\b(openai|anthropic|claude|gemini)\b/.test(t)) s += 5;
  if (/\b(python|javascript|typescript|github|code|api|docker|kubernetes)\b/.test(t)) s += 7;
  if (/\b(gpu|nvidia|chip|hardware|robot|server)\b/.test(t)) s += 11;
  if (/\b(policy|law|sec|privacy|funding|startup)\b/.test(t)) s += 13;
  if (/\b(arxiv|paper|research|lab)\b/.test(t)) s += 17;
  s += card.source_id.length % 9;
  s += (card.credibility === "official" ? 2 : 0) + (card.credibility === "community" ? 5 : 0);
  return s;
}

export function storyImageUrl(card: SwipeCard): string {
  const key = `${card.id}\n${card.url}\n${card.title}\n${card.source_id}\n${card.source_name}`;
  const h = fnv1a32(key);
  const salt = keywordSalt(card);
  const idx = (h + salt * 1103515245) % CURATED.length;
  return CURATED[idx]!;
}

/** Stable Picsum image when Unsplash fails (no API key). */
export function picsumFallbackUrl(card: SwipeCard, width: number, height: number): string {
  const seed = `${card.id}-${(fnv1a32(card.url) >>> 0).toString(36)}`;
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}

/** Hues + label for offline gradient poster (subtle chroma, stays dark). */
export function posterTokens(card: SwipeCard): { hueA: number; hueB: number; label: string } {
  const h = fnv1a32(`${card.id}|${card.url}|${card.title}`);
  return {
    hueA: h % 360,
    hueB: (Math.imul(h, 31) >>> 0) % 360,
    label: card.source_name.toUpperCase().slice(0, 20),
  };
}
