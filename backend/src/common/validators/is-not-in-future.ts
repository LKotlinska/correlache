import { ValidateBy } from 'class-validator';

/** Allowed clock drift between client and server. */
const TOLERANCE_MS = 5 * 60 * 1000;

/** Passes when this ISO date string is not later than the current time (plus a small tolerance). */
export const IsNotInFuture = () =>
  ValidateBy({
    name: 'isNotInFuture',
    validator: {
      validate: (value) => {
        // Non-string values are reported by the other decorators.
        if (typeof value !== 'string') return true;
        return Date.parse(value) <= Date.now() + TOLERANCE_MS;
      },
      defaultMessage: (args) => `${args?.property} must not be in the future`,
    },
  });
