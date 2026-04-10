import type { PeriodRange } from "../types.js";

const QUARTER_MONTHS: Record<number, { start: string; end: string }> = {
  1: { start: "01-01", end: "03-31" },
  2: { start: "04-01", end: "06-30" },
  3: { start: "07-01", end: "09-30" },
  4: { start: "10-01", end: "12-31" },
};

const ISO_DATE_RE = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;

function parseQuarterLabel(label: string): { start: string; end: string } | null {
  const match = /^Q([1-4])-(\d{4})$/.exec(label);
  if (!match) return null;

  const quarter = Number(match[1]);
  const year = match[2];
  const months = QUARTER_MONTHS[quarter];

  return { start: `${year}-${months.start}`, end: `${year}-${months.end}` };
}

type PeriodOpts = { start?: string; end?: string };

export function parsePeriod(label: string, opts: PeriodOpts = {}): PeriodRange {
  const quarterRange = parseQuarterLabel(label);
  if (quarterRange) {
    return { label, ...quarterRange };
  }

  const { start, end } = opts;

  if (start && end) {
    if (!ISO_DATE_RE.test(start) || !ISO_DATE_RE.test(end)) {
      console.error("--start and --end must be valid dates in YYYY-MM-DD format.");
      process.exit(1);
      return undefined as never;
    }
    return { label, start, end };
  }

  console.error(`Unknown period "${label}". Use Q{1-4}-{year} or pass --start and --end.`);
  process.exit(1);
  return undefined as never;
}
