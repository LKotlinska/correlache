import { ValidateBy } from 'class-validator';

/** Passes when this ISO date string is the same as or later than the date in `otherProperty`. */
export const IsNotBefore = (otherProperty: string) =>
  ValidateBy({
    name: 'isNotBefore',
    constraints: [otherProperty],
    validator: {
      validate: (value, args) => {
        const other = (args?.object as Record<string, unknown>)[otherProperty];
        // Missing or non-string values are reported by the other decorators.
        if (typeof value !== 'string' || typeof other !== 'string') return true;
        return Date.parse(value) >= Date.parse(other);
      },
      defaultMessage: (args) => `${args?.property} must not be before ${otherProperty}`,
    },
  });
