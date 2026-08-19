/** One SkyBlock day lasts 20 real minutes. */
export const SKYBLOCK_DAY_MS = 20 * 60 * 1000;
export const SKYBLOCK_HOUR_MS = SKYBLOCK_DAY_MS / 24;
export const SKYBLOCK_MONTH_DAYS = 31;
export const SKYBLOCK_YEAR_MONTHS = 12;

export const SKYBLOCK_MONTHS = [
  'Early Spring',
  'Spring',
  'Late Spring',
  'Early Summer',
  'Summer',
  'Late Summer',
  'Early Autumn',
  'Autumn',
  'Late Autumn',
  'Early Winter',
  'Winter',
  'Late Winter',
] as const;

export interface SkyblockDate {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  monthName: string;
  timeLabel: string;
  dateLabel: string;
}

const EPOCH = Date.UTC(2019, 5, 11);

export function skyblockDate(now = Date.now()): SkyblockDate {
  const elapsed = Math.max(0, now - EPOCH);
  const totalDays = Math.floor(elapsed / SKYBLOCK_DAY_MS);
  const year = Math.floor(totalDays / (SKYBLOCK_MONTH_DAYS * SKYBLOCK_YEAR_MONTHS)) + 1;
  const dayOfYear = totalDays % (SKYBLOCK_MONTH_DAYS * SKYBLOCK_YEAR_MONTHS);
  const month = Math.floor(dayOfYear / SKYBLOCK_MONTH_DAYS);
  const day = (dayOfYear % SKYBLOCK_MONTH_DAYS) + 1;
  const intoDay = elapsed % SKYBLOCK_DAY_MS;
  const hour = Math.floor(intoDay / SKYBLOCK_HOUR_MS);
  const minute = Math.floor((intoDay % SKYBLOCK_HOUR_MS) / (SKYBLOCK_HOUR_MS / 60));
  const monthName = SKYBLOCK_MONTHS[month] ?? 'Spring';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = hour < 12 ? 'am' : 'pm';
  const timeLabel = `${hour12}:${String(minute).padStart(2, '0')}${suffix}`;
  return {
    year,
    month,
    day,
    hour,
    minute,
    monthName,
    timeLabel,
    dateLabel: `${monthName} ${day}, Year ${year}`,
  };
}

export function formatSkyblockSidebar(now = Date.now()): { date: string; time: string } {
  const date = skyblockDate(now);
  return { date: date.dateLabel, time: date.timeLabel };
}
