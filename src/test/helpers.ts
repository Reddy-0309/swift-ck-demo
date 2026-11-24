import { resolve as resolvePath } from "node:path";
import { setWasmLocator } from "../domain/analytics";
import { principalOf, type Principal } from "../domain/core";
import { Store } from "../domain/store";
import { seedDemo } from "../seed/seed";

setWasmLocator((file) => resolvePath(process.cwd(), "node_modules/sql.js/dist", file));

let cached: Store | null = null;

/** A freshly seeded in-memory store (seeding is deterministic, so a clone is reused). */
export async function seededStore(): Promise<Store> {
  if (!cached) {
    cached = new Store({ persistence: false });
    await seedDemo(cached);
  }
  const store = new Store({ persistence: false });
  await store.adopt(cached);
  store.replaceState(structuredClone(cached.getState()));
  return store;
}

export function as(store: Store, username: string): Principal {
  const user = store.getState().users.find((u) => u.username === username);
  if (!user) throw new Error(`no user ${username}`);
  return principalOf(user);
}
