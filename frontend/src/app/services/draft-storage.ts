import { Service } from '@angular/core';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/** Keeps form drafts in sessionStorage: they survive a refresh but not a closed tab. */
@Service()
export class DraftStorage {
  load<T>(key: string): T | null {
    try {
      const raw = sessionStorage.getItem(key);
      // JSON turns Dates into strings, so revive them
      return raw ? JSON.parse(raw, (_, v) => (typeof v === 'string' && ISO_DATE.test(v) ? new Date(v) : v)) : null;
    } catch {
      return null;
    }
  }

  save(key: string, value: unknown) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage unavailable or full: the draft just won't persist
    }
  }

  clear(key: string) {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // nothing to clear
    }
  }
}
