const CITATION_TOKEN = /\[(\d+)\](?!\()/g;

export type CitationID = number;

export type CitationToken = {
  type: "citation";
  raw: string; // e.g. "[1]"
  id: CitationID;
};

/** Tokenize a plain string, splitting out citation tokens */
export function tokenizeCitations(text: string): Array<string | CitationToken> {
  const parts: Array<string | CitationToken> = [];
  let lastIndex = 0;
  text.replace(CITATION_TOKEN, (match, inner: string, offset: number) => {
    if (lastIndex < offset) parts.push(text.slice(lastIndex, offset));
    parts.push({ type: "citation", raw: match, id: Number(inner) });
    lastIndex = offset + match.length;
    return match; // return value is ignored
  });
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export function renderWithCitations(text: string, urlFormatter: (id: number) => string): string {
  const tokens = tokenizeCitations(text);
  return tokens.map((t, idx) => (typeof t === "string" ? t : `[${t.id}](${urlFormatter(t.id)})`)).join("");
}

/**
 * Notes & gotchas
 * - This operates on a plain string. If you're rendering Markdown, run this either before converting to HTML
 *   (e.g., in a remark plugin) or after rendering text nodes in your MD renderer.
 * - CITATION_TOKEN has (?!\() to avoid matching markdown links. If your content has other bracketed constructs,
 *   tweak the regex accordingly.
 * - Adjacent tokens like "[1][2]" are both matched correctly.
 */
