// Lexical retrieval over *already-filtered* approved candidates. Retrieval only ranks; it
// never decides applicability. It matches native script, loose romanisation (transliterated
// and code-mixed queries) and exact identifiers, in all eight languages.

import { romanKey, tokens } from "./indic";
import type { Language } from "./types";

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "am", "to", "of", "in", "on", "at", "for", "and", "or", "what", "how",
  "do", "does", "i", "my", "me", "we", "should", "can", "with", "this", "that", "it", "if", "when", "be",
  "by", "from", "as", "about", "please", "need", "help",
]);
const CODE = /^[a-z]{1,8}(?:-[a-z0-9]{1,12})+$/;

export interface Candidate {
  key: string;
  texts: Partial<Record<Language, string>>;
}

export interface Ranked {
  key: string;
  score: number;
}

function prefixHit(term: string, vocabulary: Set<string>): boolean {
  if (vocabulary.has(term)) return true;
  if (term.length < 4) return false;
  for (const v of vocabulary) if (v.length >= 4 && (v.startsWith(term) || term.startsWith(v))) return true;
  return false;
}

export function lexicalScore(query: string, texts: Partial<Record<Language, string>>): number {
  const terms = [...new Set(tokens(query).filter((t) => !STOPWORDS.has(t) && t.length > 1))];
  if (!terms.length) return 0;
  const codes = new Set(terms.filter((t) => CODE.test(t)));
  const native = new Set<string>();
  const roman = new Set<string>();
  for (const [language, text] of Object.entries(texts) as [Language, string][]) {
    for (const t of tokens(text)) {
      native.add(t);
      const key = romanKey(t, language);
      if (key) roman.add(key);
    }
  }
  for (const code of codes) if (!native.has(code)) return 0; // an exact identifier must be present
  let total = 0;
  let hit = 0;
  for (const term of terms) {
    const weight = codes.has(term) ? 2 : 1;
    total += weight;
    if (codes.has(term) || prefixHit(term, native) || prefixHit(romanKey(term), roman)) hit += weight;
  }
  return hit / total;
}

export function rank(query: string, candidates: Candidate[]): Ranked[] {
  return candidates
    .map((c) => ({ key: c.key, score: Math.round(lexicalScore(query, c.texts) * 10000) / 10000 }))
    .sort((a, b) => b.score - a.score);
}
