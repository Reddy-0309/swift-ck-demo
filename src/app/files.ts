import { useEffect, useState } from "react";
import { store } from "./engine";

export function safeFilename(name: string): string {
  return name.replace(/[^\p{L}\p{N}._-]+/gu, "_").replace(/_+/g, "_").slice(0, 120) || "download";
}

/** Save bytes as a file in the user's browser. */
export function downloadBytes(bytes: Uint8Array, filename: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([bytes.slice()], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = safeFilename(filename);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadStored(fileKey: string, filename: string, mime: string): void {
  downloadBytes(store.getFile(fileKey), filename, mime);
}

/** An object URL for a stored file (images, audio), revoked when no longer used. */
export function useStoredFileUrl(fileKey: string | null, mime: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!fileKey || !store.hasFile(fileKey)) {
      setUrl(null);
      return;
    }
    const created = URL.createObjectURL(new Blob([store.getFile(fileKey).slice()], { type: mime }));
    setUrl(created);
    return () => URL.revokeObjectURL(created);
  }, [fileKey, mime]);
  return url;
}

export async function readFile(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}
