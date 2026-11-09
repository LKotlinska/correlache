/** Requires an explicit timezone (Z or ±hh:mm) so Date.parse never falls back to server-local time. */
export const HAS_TIMEZONE = /(Z|[+-]\d{2}:?\d{2})$/;
