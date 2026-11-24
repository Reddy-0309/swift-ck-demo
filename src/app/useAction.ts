import { useCallback, useRef, useState } from "react";
import { ZodError } from "zod";
import { DomainError } from "../domain/core";

export function errorMessage(error: unknown): string {
  if (error instanceof ZodError) return error.issues.map((i) => `${i.path.join(".") || "request"}: ${i.message}`).join("; ");
  if (error instanceof Error) return error.message;
  return String(error);
}

export function errorDetails(error: unknown): Record<string, unknown> {
  return error instanceof DomainError ? error.details : {};
}

export function errorCode(error: unknown): string | null {
  return error instanceof DomainError ? error.code : null;
}

/** Runs one user action (sync or async) and tracks its busy, error and result state. */
export function useAction<T>() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [result, setResult] = useState<T | null>(null);
  const running = useRef(false);

  const run = useCallback(async (fn: () => T | Promise<T>, onDone?: (value: T) => void): Promise<T | null> => {
    if (running.current) return null;
    running.current = true;
    setBusy(true);
    setError(null);
    try {
      const value = await fn();
      setResult(value);
      onDone?.(value);
      return value;
    } catch (e) {
      setError(e);
      return null;
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
  }, []);

  return { run, busy, error, result, reset };
}
