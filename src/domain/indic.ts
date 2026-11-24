// Indic text handling for all eight languages: normalisation, tokens that keep vowel signs
// and viramas inside words, loose romanisation for transliterated and code-mixed queries,
// and protected-term checks (codes, units, numbers must survive translation).
// Romanised matching is a baseline; per-language quality is measured by benchmark B2.

import Sanscript from "@indic-transliteration/sanscript";
import type { Language } from "./types";

const SCRIPTS: Partial<Record<Language, string>> = {
  kn: "kannada",
  ta: "tamil",
  te: "telugu",
  hi: "devanagari",
  mr: "devanagari",
  ml: "malayalam",
  bn: "bengali",
};

const ZERO_WIDTH = /[​-‍﻿]/g;
// Native digits (Devanagari, Bengali, Tamil, Telugu, Kannada, Malayalam) → ASCII.
const DIGIT_BLOCKS = [0x0966, 0x09e6, 0x0be6, 0x0c66, 0x0ce6, 0x0d66];

export function normalise(text: string): string {
  let out = text.normalize("NFC").replace(ZERO_WIDTH, "");
  out = out.replace(/[०-९০-৯௦-௯౦-౯೦-೯൦-൯]/g, (ch) => {
    const code = ch.codePointAt(0) as number;
    const base = DIGIT_BLOCKS.find((b) => code >= b && code <= b + 9) as number;
    return String(code - base);
  });
  return out;
}

const WORD_CHAR = /[\p{L}\p{N}\p{M}]/u;

/** Word tokens; hyphenated identifiers such as EST-1 stay whole. */
export function tokens(text: string): string[] {
  const out: string[] = [];
  let current = "";
  const flush = () => {
    const word = current.replace(/^-+|-+$/g, "");
    if (word) out.push(word.toLowerCase());
    current = "";
  };
  for (const ch of normalise(text)) {
    if (WORD_CHAR.test(ch) || (ch === "-" && current)) current += ch;
    else flush();
  }
  flush();
  return out;
}

const FOLDS: [RegExp, string][] = [
  [/zh/g, "l"],
  [/(k|g)h/g, "k"],
  [/(c|j)h/g, "c"],
  [/(t|d)h/g, "t"],
  [/(p|b)h/g, "p"],
  [/sh/g, "s"],
  [/g/g, "k"],
  [/d/g, "t"],
  [/b/g, "p"],
  [/j/g, "c"],
  [/z/g, "c"],
  [/w/g, "v"],
  [/f/g, "p"],
  [/q/g, "k"],
  [/x/g, "ks"],
  [/y/g, "i"],
  [/ee|ii/g, "i"],
  [/oo|uu/g, "u"],
  [/(.)\1+/g, "$1"],
];

function foldRoman(text: string): string {
  let out = text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  for (const [pattern, replacement] of FOLDS) out = out.replace(pattern, replacement);
  return out;
}

/** Loose Latin key for a word in any of the eight languages. */
export function romanKey(word: string, language: Language | "auto" = "auto"): string {
  const script = language === "auto" ? detectScript(word) : SCRIPTS[language];
  const latin = script && !isLatin(word) ? Sanscript.t(normalise(word), script, "iast") : word;
  return foldRoman(latin);
}

export function isLatin(text: string): boolean {
  const letters = [...text].filter((c) => /\p{L}/u.test(c));
  return letters.length > 0 && letters.every((c) => (c.codePointAt(0) as number) < 0x250);
}

function detectScript(word: string): string | undefined {
  const code = [...word].map((c) => c.codePointAt(0) as number).find((c) => c >= 0x0900 && c <= 0x0d7f);
  if (code === undefined) return undefined;
  if (code < 0x0980) return "devanagari";
  if (code < 0x0a00) return "bengali";
  if (code >= 0x0b80 && code < 0x0c00) return "tamil";
  if (code >= 0x0c00 && code < 0x0c80) return "telugu";
  if (code >= 0x0c80 && code < 0x0d00) return "kannada";
  if (code >= 0x0d00) return "malayalam";
  return undefined;
}

// ----------------------------------------------------------------------------- protected terms

const CODE = /\b[A-Z]{1,8}(?:-[A-Z0-9]{1,12})+\b/g;
const UNIT = "(?:kg|g|mg|km|m|cm|mm|l|ml|min|mins|minutes|h|hr|hrs|hours|s|sec|seconds|°c|%|v|a|w|kw|bar|psi|rpm|nm)";
const MEASURE = new RegExp(`(?<![\\w.])\\d+(?:[.,]\\d+)?\\s?${UNIT}(?![\\p{L}\\p{N}])`, "giu");
const NUMBER = /\d+(?:[.,]\d+)?/g;

export function protectedTerms(text: string): Set<string> {
  const value = normalise(text);
  const terms = new Set<string>(value.match(CODE) ?? []);
  for (const m of value.match(MEASURE) ?? []) terms.add(m.replace(/\s+/g, " ").toLowerCase());
  for (const n of value.match(NUMBER) ?? []) terms.add(n);
  return terms;
}

export function missingProtectedTerms(source: string, translation: string): string[] {
  const target = normalise(translation);
  const targetLower = target.toLowerCase().replace(/\s+/g, " ");
  const missing: string[] = [];
  for (const term of [...protectedTerms(source)].sort()) {
    const isCode = /^[A-Z]{1,8}(?:-[A-Z0-9]{1,12})+$/.test(term);
    if (!(isCode ? target : targetLower).includes(term)) missing.push(term);
  }
  return missing;
}
