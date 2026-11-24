// In-browser data store. State lives in memory and is persisted to IndexedDB, so the demo
// needs no server or database. Every change runs as a transaction on a copy of the state;
// if a rule is broken (e.g. editing published content) nothing is committed.

import { clear, get, set } from "idb-keyval";
import { ImmutableRecordError, NotFound, newId, nowIso, sha256, type Principal } from "./core";
import { IMMUTABLE_STATES, type AuditEntry, type DemoState } from "./types";

export const SCHEMA_VERSION = 1;
const STATE_KEY = "sck-demo-state";
const FILE_PREFIX = "sck-demo-file:";

type Listener = () => void;

const VERSION_CONTENT_FIELDS = [
  "applicability",
  "riskClass",
  "distributionClass",
  "contentHash",
  "sourceDocumentId",
  "sourceHash",
  "version",
  "objectId",
  "effectiveFrom",
] as const;

function guard(before: DemoState, after: DemoState): void {
  const oldVersions = new Map(before.versions.map((v) => [v.id, v]));
  for (const v of after.versions) {
    const old = oldVersions.get(v.id);
    if (!old || !IMMUTABLE_STATES.includes(old.state)) continue;
    for (const field of VERSION_CONTENT_FIELDS) {
      if (JSON.stringify(old[field]) !== JSON.stringify(v[field])) {
        throw new ImmutableRecordError(`Published version is immutable: ${field}`);
      }
    }
  }
  for (const old of before.versions) {
    if (old.state !== "draft" && !after.versions.some((v) => v.id === old.id)) {
      throw new ImmutableRecordError("Only draft versions can be deleted");
    }
  }
  const oldVariants = new Map(before.variants.map((v) => [v.id, v]));
  for (const v of after.variants) {
    const old = oldVariants.get(v.id);
    if (!old || old.state === "draft") continue;
    if (old.title !== v.title || JSON.stringify(old.blocks) !== JSON.stringify(v.blocks) || old.contentHash !== v.contentHash) {
      throw new ImmutableRecordError("Approved language variant is immutable");
    }
  }
  if (after.audit.length < before.audit.length) throw new ImmutableRecordError("Audit entries are append-only");
  for (let i = 0; i < before.audit.length; i++) {
    if (JSON.stringify(before.audit[i]) !== JSON.stringify(after.audit[i])) {
      throw new ImmutableRecordError("Audit entries are append-only");
    }
  }
}

export class Store {
  private state: DemoState | null = null;
  private files = new Map<string, Uint8Array>();
  private listeners = new Set<Listener>();
  private writing = false;
  private dirty = false;
  private persistence = true;

  constructor(options: { persistence?: boolean } = {}) {
    this.persistence = options.persistence ?? true;
  }

  get loaded(): boolean {
    return this.state !== null;
  }

  getState(): DemoState {
    if (!this.state) throw new Error("Store is not loaded");
    return this.state;
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Run a change atomically: all of it is committed, or none of it. */
  transact<T>(fn: (draft: DemoState) => T): T {
    const before = this.getState();
    const draft = structuredClone(before);
    const result = fn(draft);
    guard(before, draft);
    this.state = draft;
    this.emit();
    return result;
  }

  replaceState(next: DemoState): void {
    this.state = next;
    this.emit();
  }

  putFile(bytes: Uint8Array, extension: string): { key: string; sha256: string } {
    const digest = sha256(bytes);
    const key = `${digest}${extension.toLowerCase()}`;
    if (!this.files.has(key)) {
      this.files.set(key, bytes);
      if (this.persistence) void set(FILE_PREFIX + key, bytes).catch(() => undefined);
    }
    return { key, sha256: digest };
  }

  /**
   * Take over another store's complete state and files in one step (used after seeding in a
   * scratch store, so the UI never sees a half-built state), and persist them before returning.
   */
  async adopt(other: Store): Promise<void> {
    this.files = new Map(other.files);
    this.state = other.getState();
    if (this.persistence) {
      try {
        for (const [key, bytes] of this.files) await set(FILE_PREFIX + key, bytes);
        await set(STATE_KEY, this.state);
      } catch {
        /* storage blocked (private mode): keep an in-memory session */
      }
    }
    for (const listener of this.listeners) listener();
  }

  hasFile(key: string): boolean {
    return this.files.has(key);
  }

  getFile(key: string): Uint8Array {
    const file = this.files.get(key);
    if (!file) throw new NotFound("Stored file not found");
    return file;
  }

  /** Load persisted state; returns false when nothing (or an old schema) was stored. */
  async load(): Promise<boolean> {
    if (!this.persistence) return false;
    try {
      const stored = (await get(STATE_KEY)) as DemoState | undefined;
      if (!stored || stored.schema !== SCHEMA_VERSION) return false;
      const keys = new Set<string>();
      for (const s of stored.sources) keys.add(s.fileKey);
      for (const m of stored.media) keys.add(m.fileKey);
      for (const p of stored.packages) keys.add(p.fileKey);
      for (const key of keys) {
        const bytes = (await get(FILE_PREFIX + key)) as Uint8Array | undefined;
        if (!bytes) return false; // incomplete storage: start fresh rather than show broken files
        this.files.set(key, bytes);
      }
      this.state = stored;
      for (const listener of this.listeners) listener();
      return true;
    } catch {
      return false; // storage blocked (private mode): fall back to an in-memory session
    }
  }

  /** Remove everything persisted; in-memory state stays until a new state is adopted. */
  async clearPersisted(): Promise<void> {
    if (!this.persistence) return;
    try {
      await clear(); // the demo owns this origin's key-value store: state and files together
    } catch {
      /* nothing persisted */
    }
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
    this.scheduleSave();
  }

  /** Persist every committed change straight away; writes are serialized and coalesced. */
  private scheduleSave(): void {
    if (!this.persistence || !this.state) return;
    this.dirty = true;
    if (!this.writing) void this.drain();
  }

  private async drain(): Promise<void> {
    this.writing = true;
    while (this.dirty) {
      this.dirty = false;
      try {
        await set(STATE_KEY, this.state);
      } catch {
        /* storage blocked (private mode): the session continues in memory */
      }
    }
    this.writing = false;
  }
}

export function audit(
  s: DemoState,
  actor: Principal | null,
  action: string,
  entityType: string,
  entityId: string,
  details: Record<string, unknown> = {},
): AuditEntry {
  const entry: AuditEntry = {
    id: newId(),
    at: nowIso(),
    actorId: actor?.userId ?? null,
    actorName: actor?.displayName ?? "system",
    action,
    entityType,
    entityId,
    details,
  };
  s.audit.push(entry);
  return entry;
}
