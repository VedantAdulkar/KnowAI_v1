/** Strip HTML for safe display (RSS summaries often contain tags). */

const TAG_RE = /<[^>]*>/gi;

export function stripHtmlToPlain(input: string | null | undefined): string {
  if (!input) return "";
  let s = input;
  if (typeof document !== "undefined") {
    const el = document.createElement("div");
    el.innerHTML = s;
    s = el.textContent || el.innerText || "";
  } else {
    s = s.replace(TAG_RE, " ");
  }
  return s.replace(/\s+/g, " ").trim();
}

export function cardAbstract(card: { summary: string | null; description: string | null; title: string }): string {
  const raw = card.summary?.trim() || card.description?.trim() || "";
  const plain = stripHtmlToPlain(raw);
  return plain || stripHtmlToPlain(card.title);
}

const LONG_CAP = 700;

/** Richer body for cinematic modal: combine summary + description when they add distinct info. */
export function cardLongAbstract(card: {
  summary: string | null;
  description: string | null;
  title: string;
}): string {
  const sum = stripHtmlToPlain(card.summary).trim();
  const desc = stripHtmlToPlain(card.description).trim();
  if (sum && desc) {
    const prefix = desc.slice(0, Math.min(100, desc.length));
    const redundant = desc === sum || (prefix.length > 12 && sum.includes(prefix));
    if (!redundant) {
      return `${sum} ${desc}`.replace(/\s+/g, " ").trim().slice(0, LONG_CAP);
    }
  }
  const single = (sum || desc || stripHtmlToPlain(card.title)).trim();
  return single.slice(0, LONG_CAP);
}
