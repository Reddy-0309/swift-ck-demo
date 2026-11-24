// Upload flow: parse the file (async), store its bytes content-addressed, then register the
// source in one transaction. Parsing failures never leave a half-registered source.

import { requireCap, type Principal } from "./core";
import { registerSource } from "./governance";
import { extensionOf, mediaTypeFor, parseDocument } from "./ingestion";
import type { Store } from "./store";
import type { Language, SourceDocument } from "./types";

export interface UploadOptions {
  rightsCleared: boolean;
  rightsNote: string;
  synthetic: boolean;
  documentKey?: string;
  title?: string;
  language?: Language;
}

export async function uploadSource(store: Store, p: Principal, filename: string, bytes: Uint8Array, options: UploadOptions): Promise<SourceDocument> {
  requireCap(p, "source.upload");
  const mediaType = mediaTypeFor(filename);
  const parsed = await parseDocument(filename, bytes);
  const { key, sha256 } = store.putFile(bytes, extensionOf(filename));
  return store.transact((s) =>
    registerSource(s, p, {
      parsed,
      filename,
      mediaType,
      sha256,
      fileKey: key,
      sizeBytes: bytes.length,
      ...options,
    }),
  );
}
