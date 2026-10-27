import { DraftStorage } from './draft-storage';

/** Draft bookkeeping for one form: what is stored under `key`, and whether the form was already submitted. */
export class DraftController {
  private submitted = false;
  private exists = false;

  constructor(
    private storage: DraftStorage,
    private key: string,
  ) {}

  /** Loads the stored draft, if any. */
  restore<T>(): T | null {
    const draft = this.storage.load<T>(this.key);
    this.exists = draft !== null;
    return draft;
  }

  /** Stores the value. Ignored once submitted, so a late debounced save can't bring a saved form back as a draft. */
  save(value: unknown) {
    if (this.submitted) return;
    this.exists = true;
    this.storage.save(this.key, value);
  }

  hasDraft() {
    return !this.submitted && this.exists;
  }

  /** Call after a successful submit. */
  markSubmitted() {
    this.submitted = true;
    this.discard();
  }

  discard() {
    this.exists = false;
    this.storage.clear(this.key);
  }
}
