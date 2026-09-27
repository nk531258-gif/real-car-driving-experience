export const SUGGESTED_ZONES = [
  'UTC',
  'America/New_York',
  'Europe/London',
  'Asia/Tokyo',
  'Australia/Sydney'
];

export function getUserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export function getDefaultZones() {
  return [...new Set([getUserTimeZone(), ...SUGGESTED_ZONES])];
}

export function isValidTimeZone(timeZone) {
  try {
    Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function getParts(date, timeZone, hour12, showSeconds) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: showSeconds ? '2-digit' : undefined,
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour12
  }).formatToParts(date);
}

function getOffsetParts(date, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset'
  }).formatToParts(date);
}

function extract(parts, type) {
  return parts.find((part) => part.type === type)?.value || '';
}

export function formatUtcOffset(date, timeZone) {
  const value = extract(getOffsetParts(date, timeZone), 'timeZoneName');
  if (!value) {
    return 'UTC';
  }

  const normalized = value.replace('GMT', 'UTC');
  if (normalized === 'UTC') {
    return 'UTC+00:00';
  }

  const match = normalized.match(/^UTC([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) {
    return normalized;
  }

  const [, sign, hour, minute = '00'] = match;
  return `UTC${sign}${hour.padStart(2, '0')}:${minute}`;
}

export function getClockSnapshot(date, timeZone, { hour12, showSeconds } = {}) {
  const parts = getParts(date, timeZone, hour12, showSeconds);
  const hour = extract(parts, 'hour');
  const minute = extract(parts, 'minute');
  const second = showSeconds ? extract(parts, 'second') : '';
  const dayPeriod = extract(parts, 'dayPeriod');
  const weekday = extract(parts, 'weekday');
  const month = extract(parts, 'month');
  const day = extract(parts, 'day');
  const year = extract(parts, 'year');

  const time = showSeconds ? `${hour}:${minute}:${second}` : `${hour}:${minute}`;
  const suffix = dayPeriod ? ` ${dayPeriod}` : '';
  const dateText = `${weekday}, ${month} ${day}, ${year}`;

  const hourNum = Number.parseInt(hour, 10);
  const isDay = Number.isFinite(hourNum) && hourNum >= 6 && hourNum < 18;

  return {
    time: `${time}${suffix}`.trim(),
    dateText,
    utcOffset: formatUtcOffset(date, timeZone),
    phase: isDay ? 'Day' : 'Night'
  };
}

export function zoneLabel(timeZone) {
  return timeZone.split('/').pop()?.replace(/_/g, ' ') || timeZone;
}
