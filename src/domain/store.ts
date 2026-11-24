// In-browser data store. State lives in memory and is persisted to IndexedDB, so the demo
// needs no server or database. Every change runs as a transaction on a copy of the state;
// if a rule is broken (e.g. editing published content) nothing is committed.

import { clear, get, set } from "idb-keyval";
import { ImmutableRecordError, NotFound, newId, nowIso, sha256, type Principal } from "./core";
import { IMMUTABLE_STATES, type AuditEntry, type DemoState } from "./types";

export const SCHEMA_VERSION = 3;
const STATE_KEY = "sck-demo-state";
const FILE_PREFIX = "sck-demo-file:";
const EVENT_PREFIX = "sck-demo-events:";
const EVENT_CHUNK = 2000;

/** What is stored under STATE_KEY: everything except the event log, which is chunked. */
type StoredState = Omit<DemoState, "events"> & { eventCount: number };

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
  // Entries are shared by reference between versions of the state and frozen once committed,
  // so an identity check proves the existing history is untouched without re-serializing it.
  for (let i = 0; i < before.audit.length; i++) {
    if (before.audit[i] !== after.audit[i]) throw new ImmutableRecordError("Audit entries are append-only");
  }
}

/**
 * Copy the state for a transaction. Mutable collections are deep-copied; the two append-only
 * logs (analytics events and audit) can grow to many thousands of entries, so only their arrays
 * are copied and the frozen entries are shared. This keeps every change fast at real volume.
 */
function draftOf(state: DemoState): DemoState {
  const { events, audit, ...rest } = state;
  return { ...structuredClone(rest), events: events.slice(), audit: audit.slice() };
}

function freezeNew<T extends object>(list: T[], from: number): void {
  for (let i = from; i < list.length; i++) Object.freeze(list[i]);
}

export class Store {
  private state: DemoState | null = null;
  private files = new Map<string, Uint8Array>();
  private listeners = new Set<Listener>();
  private writing = false;
  private dirty = false;
  /** Event-log entries already written, so a save only rewrites the chunks that changed. */
  private persistedEvents = 0;
  private lastPersistedEvent: object | undefined;
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
    const draft = draftOf(before);
    const result = fn(draft);
    guard(before, draft);
    freezeNew(draft.events, 0);
    freezeNew(draft.audit, before.audit.length);
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
        this.persistedEvents = 0;
        await this.writeState(this.state);
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
      const stored = (await get(STATE_KEY)) as StoredState | undefined;
      if (!stored || stored.schema !== SCHEMA_VERSION || typeof stored.eventCount !== "number") return false;
      const events: DemoState["events"] = [];
      for (let i = 0; i * EVENT_CHUNK < stored.eventCount; i++) {
        const chunk = (await get(EVENT_PREFIX + i)) as DemoState["events"] | undefined;
        if (!chunk) return false;
        events.push(...chunk);
      }
      if (events.length < stored.eventCount) return false;
      events.length = stored.eventCount;
      const keys = new Set<string>();
      for (const s of stored.sources) keys.add(s.fileKey);
      for (const m of stored.media) keys.add(m.fileKey);
      for (const p of stored.packages) keys.add(p.fileKey);
      for (const key of keys) {
        const bytes = (await get(FILE_PREFIX + key)) as Uint8Array | undefined;
        if (!bytes) return false; // incomplete storage: start fresh rather than show broken files
        this.files.set(key, bytes);
      }
      const { eventCount: _count, ...rest } = stored;
      for (const e of events) Object.freeze(e);
      for (const a of rest.audit) Object.freeze(a);
      this.state = { ...rest, events };
      this.persistedEvents = events.length;
      this.lastPersistedEvent = events[events.length - 1];
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
        if (this.state) await this.writeState(this.state);
      } catch {
        /* storage blocked (private mode): the session continues in memory */
      }
    }
    this.writing = false;
  }

  /** Write the state; the event log is append-only, so only its newest chunks are rewritten. */
  private async writeState(state: DemoState): Promise<void> {
    const { events, ...rest } = state;
    const appendedOnly =
      this.persistedEvents <= events.length && (this.persistedEvents === 0 || events[this.persistedEvents - 1] === this.lastPersistedEvent);
    const firstChunk = appendedOnly ? Math.floor(this.persistedEvents / EVENT_CHUNK) : 0;
    for (let i = firstChunk; i * EVENT_CHUNK < events.length; i++) {
      await set(EVENT_PREFIX + i, events.slice(i * EVENT_CHUNK, (i + 1) * EVENT_CHUNK));
    }
    const stored: StoredState = { ...rest, eventCount: events.length };
    await set(STATE_KEY, stored);
    this.persistedEvents = events.length;
    this.lastPersistedEvent = events[events.length - 1];
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
