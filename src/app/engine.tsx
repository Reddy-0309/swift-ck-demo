// Connects React to the in-browser engine: boots (load or seed), exposes the current state,
// the signed-in demo identity and a reset. Components read state through useEngine() and
// change it only through domain functions run inside store.transact().

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { purgeExpired, retentionCutoff, setWasmLocator } from "../domain/analytics";
import { can as canDo, principalOf, type Capability, type Principal } from "../domain/core";
import { Store } from "../domain/store";
import type { DemoState, User } from "../domain/types";
import { seedDemo } from "../seed/seed";

setWasmLocator(() => wasmUrl);

const USER_KEY = "sck-demo-user";
export const store = new Store();

/** Build the demo data in a scratch store, then swap it in whole. */
async function freshDemo(): Promise<void> {
  const scratch = new Store({ persistence: false });
  await seedDemo(scratch);
  await store.adopt(scratch);
}

let boot: Promise<void> | null = null;
function bootOnce(): Promise<void> {
  boot ??= store.load().then(async (loaded) => {
    if (!loaded) await freshDemo();
    // Retention: events older than the retention period are deleted when the app starts.
    else if (store.getState().events.some((e) => e.occurredAt < retentionCutoff())) store.transact(purgeExpired);
  });
  return boot;
}

function readUserId(): string | null {
  try {
    return localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

function writeUserId(id: string | null): void {
  try {
    if (id) localStorage.setItem(USER_KEY, id);
    else localStorage.removeItem(USER_KEY);
  } catch {
    /* storage unavailable: the identity lasts for this tab only */
  }
}

interface Engine {
  state: DemoState;
  user: User | null;
  principal: Principal | null;
  can: (capability: Capability) => boolean;
  signIn: (userId: string) => void;
  signOut: () => void;
  reset: () => Promise<void>;
}

const EngineContext = createContext<Engine | null>(null);

const subscribe = store.subscribe;
const snapshot = () => (store.loaded ? store.getState() : null);

export function EngineProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, snapshot);
  const [bootError, setBootError] = useState<unknown>(null);
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(readUserId);

  useEffect(() => {
    bootOnce().then(() => setReady(true), setBootError);
  }, []);

  const signIn = useCallback((id: string) => {
    writeUserId(id);
    setUserId(id);
  }, []);
  const signOut = useCallback(() => {
    writeUserId(null);
    setUserId(null);
  }, []);
  const reset = useCallback(async () => {
    await store.clearPersisted();
    await freshDemo();
  }, []);

  const value = useMemo<Engine | null>(() => {
    if (!state || !ready) return null;
    const user = state.users.find((u) => u.id === userId) ?? null;
    const principal = user ? principalOf(user) : null;
    return {
      state,
      user,
      principal,
      can: (capability) => !!principal && canDo(principal, capability),
      signIn,
      signOut,
      reset,
    };
  }, [state, ready, userId, signIn, signOut, reset]);

  if (bootError) {
    return (
      <div className="boot" role="alert">
        <h1>The demo could not start</h1>
        <p>{bootError instanceof Error ? bootError.message : String(bootError)}</p>
      </div>
    );
  }
  if (!value) {
    return (
      <div className="boot" role="status">
        <h1>Swift Contextual Knowledge</h1>
        <p>Preparing synthetic demonstration data in your browser…</p>
      </div>
    );
  }
  return <EngineContext.Provider value={value}>{children}</EngineContext.Provider>;
}

export function useEngine(): Engine {
  const engine = useContext(EngineContext);
  if (!engine) throw new Error("useEngine must be used inside EngineProvider");
  return engine;
}

/** The signed-in principal; only used on screens rendered behind the sign-in guard. */
export function usePrincipal(): Principal {
  const { principal } = useEngine();
  if (!principal) throw new Error("No signed-in identity");
  return principal;
}
