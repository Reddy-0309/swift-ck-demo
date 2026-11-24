// Source intake: parse Markdown, plain text, DOCX and text-layer PDF into normalised text
// with section offsets, so every extracted block can be traced to an exact source span.

import { ValidationFailed } from "./core";
import type { Section } from "./types";

export const SUPPORTED_TYPES: Record<string, string> = {
  ".md": "text/markdown",
  ".txt": "text/plain",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pdf": "application/pdf",
};
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export interface ParsedSource {
  text: string;
  sections: Section[];
  metadata: Record<string, string | string[]>;
}

const METADATA_KEYS: Record<string, string> = {
  "document id": "document_key",
  "document key": "document_key",
  title: "title",
  "task id": "task_id",
  task: "task_id",
  roles: "roles",
  role: "roles",
  asset: "asset_ids",
  assets: "asset_ids",
  "equipment model": "equipment_models",
  situation: "situation_codes",
  situations: "situation_codes",
  "workflow state": "workflow_states",
  language: "language",
  owner: "owner",
  "escalation route": "escalation_route",
};
export const LIST_KEYS = new Set(["roles", "asset_ids", "equipment_models", "situation_codes", "workflow_states"]);
export const META_LINE = /^\s*([A-Za-z][A-Za-z ]{1,30}):\s*(.+?)\s*$/;
const MD_HEADING = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/;

export function metadataKey(label: string): string | undefined {
  return METADATA_KEYS[label.trim().toLowerCase()];
}

export function metadataValue(key: string, raw: string): string | string[] {
  return LIST_KEYS.has(key)
    ? raw
        .split(/[;,]/)
        .map((v) => v.trim())
        .filter(Boolean)
    : raw.trim();
}

export function extensionOf(filename: string): string {
  const match = /\.[^./\\]+$/.exec(filename);
  return match ? match[0].toLowerCase() : "";
}

export function mediaTypeFor(filename: string): string {
  const type = SUPPORTED_TYPES[extensionOf(filename)];
  if (!type) {
    throw new ValidationFailed(
      `Unsupported document type '${extensionOf(filename) || filename}'. Supported: ${Object.keys(SUPPORTED_TYPES).join(", ")}`,
      "unsupported_document",
    );
  }
  return type;
}

function normaliseLine(text: string): string {
  return text
    .normalize("NFC")
    .replace(/\r/g, "")
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

type RawLine = [text: string, heading: boolean];

async function linesFromDocx(bytes: Uint8Array): Promise<RawLine[]> {
  const mammoth = await import("mammoth");
  let html: string;
  try {
    // The browser build reads `arrayBuffer`, the Node build (tests) reads `buffer`.
    const input = { arrayBuffer: bytes.slice().buffer, buffer: bytes } as unknown as { arrayBuffer: ArrayBuffer };
    const result = await mammoth.convertToHtml(input);
    html = result.value;
  } catch (error) {
    throw new ValidationFailed(`DOCX could not be read: ${(error as Error).message}`, "corrupt_document");
  }
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const lines: RawLine[] = [];
  for (const el of Array.from(doc.body.children)) {
    const tag = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) lines.push([el.textContent ?? "", true]);
    else if (tag === "ol" || tag === "ul") {
      Array.from(el.querySelectorAll(":scope > li")).forEach((li, i) =>
        lines.push([`${tag === "ol" ? `${i + 1}.` : "-"} ${li.textContent ?? ""}`, false]),
      );
    } else lines.push([el.textContent ?? "", false]);
  }
  return lines;
}

async function linesFromPdf(bytes: Uint8Array): Promise<RawLine[]> {
  const pdfjs = await import("pdfjs-dist");
  if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  }
  const lines: RawLine[] = [];
  try {
    const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise;
    for (let p = 1; p <= pdf.numPages; p++) {
      const content = await (await pdf.getPage(p)).getTextContent();
      let line = "";
      for (const item of content.items) {
        if (!("str" in item)) continue;
        line += item.str;
        if (item.hasEOL) {
          lines.push([line, false]);
          line = "";
        }
      }
      if (line) lines.push([line, false]);
    }
  } catch (error) {
    throw new ValidationFailed(`PDF could not be read: ${(error as Error).message}`, "corrupt_document");
  }
  if (!lines.some(([t]) => t.trim())) {
    throw new ValidationFailed(
      "This PDF has no text layer (scanned). OCR is part of the production backend, not this demo.",
      "no_text_layer",
    );
  }
  return lines;
}

function linesFromText(bytes: Uint8Array): RawLine[] {
  let decoded: string;
  try {
    decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ValidationFailed("Text file is not valid UTF-8", "corrupt_document");
  }
  return decoded.replace(/^﻿/, "").split("\n").map((l) => [l, false] as RawLine);
}

export function structure(raw: RawLine[]): ParsedSource {
  const out: string[] = [];
  const sections: Section[] = [];
  const metadata: Record<string, string | string[]> = {};
  let offset = 0;
  let preamble = true;
  for (const [rawLine, isHeading] of raw) {
    let line = normaliseLine(rawLine);
    const md = MD_HEADING.exec(line);
    const heading = md ? (md[2] as string).trim() : isHeading && line ? line : null;
    if (preamble && !heading) {
      const meta = META_LINE.exec(line);
      const key = meta ? metadataKey(meta[1] as string) : undefined;
      if (meta && key) metadata[key] = metadataValue(key, meta[2] as string);
    }
    if (heading) {
      if (preamble && !sections.length && !metadata.title) metadata.title = heading;
      preamble = false;
      const last = sections[sections.length - 1];
      if (last) last.end = offset;
      sections.push({ id: `s${sections.length + 1}`, heading, start: offset, end: offset });
      line = heading;
    }
    out.push(line);
    offset += line.length + 1;
  }
  const text = out.join("\n").replace(/\n+$/, "");
  if (!text.trim()) throw new ValidationFailed("Document contains no text", "empty_document");
  const last = sections[sections.length - 1];
  if (last) last.end = text.length;
  if (!sections.length) {
    sections.push({ id: "s1", heading: String(metadata.title ?? "Document"), start: 0, end: text.length });
  }
  for (const s of sections) s.end = Math.min(s.end, text.length);
  return { text, sections, metadata };
}

export async function parseDocument(filename: string, bytes: Uint8Array): Promise<ParsedSource> {
  if (!bytes.length) throw new ValidationFailed("Uploaded file is empty", "empty_document");
  if (bytes.length > MAX_UPLOAD_BYTES) throw new ValidationFailed("File exceeds the 20 MB limit");
  const ext = extensionOf(filename);
  mediaTypeFor(filename);
  const raw = ext === ".docx" ? await linesFromDocx(bytes) : ext === ".pdf" ? await linesFromPdf(bytes) : linesFromText(bytes);
  return structure(raw);
}

export function sectionFor(sections: Section[], start: number): Section | undefined {
  return sections.find((s) => s.start <= start && start < Math.max(s.end, s.start + 1)) ?? sections[sections.length - 1];
}
