import type { Currency } from "@prisma/client";

const FRACTION_DIGITS: Record<Currency, number> = {
  EUR: 2,
  XAF: 0,
};

/** Convert a human-readable catalogue price to the provider-safe minor unit. */
export function toMinorUnits(value: string, currency: Currency): number {
  const fractionDigits = FRACTION_DIGITS[currency];
  const pattern = fractionDigits === 0
    ? /^\d+$/
    : new RegExp(`^\\d+(?:\\.\\d{1,${fractionDigits}})?$`);

  if (!pattern.test(value)) {
    throw new Error(`invalid_${currency.toLowerCase()}_amount`);
  }

  const [whole, fraction = ""] = value.split(".");
  const minor = Number(whole) * 10 ** fractionDigits
    + Number(fraction.padEnd(fractionDigits, "0"));

  if (!Number.isSafeInteger(minor) || minor <= 0) {
    throw new Error(`invalid_${currency.toLowerCase()}_amount`);
  }

  return minor;
}
