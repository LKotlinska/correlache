/** Returns `ids` with `id` added when checked (once only) or removed otherwise. */
export function toggleId(ids: number[], id: number, checked: boolean): number[] {
  if (!checked) return ids.filter((x) => x !== id);
  // Pre-selected controls can emit on first render, so never add an id twice
  return ids.includes(id) ? ids : [...ids, id];
}
