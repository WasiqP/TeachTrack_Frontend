import { Country, City } from 'country-state-city';

export type DialOption = {
  /** Display e.g. "Pakistan (+92)" */
  label: string;
  /** Digits only e.g. "92" */
  dial: string;
  iso: string;
  countryName: string;
};

const INSTITUTIONS = [
  'City High School',
  'Central Public School',
  'Green Valley Academy',
  'St. Mary’s College',
  'National University',
  'Community Learning Center',
  'International School',
  'Other',
];

export const INSTITUTION_OTHER = 'Other';
/** Saved in `institutionName` when teacher chooses Tuition mode. */
export const INSTITUTION_TUITION = 'Tuition';

const PROFESSIONAL_TITLES = [
  'Teacher',
  'Science teacher',
  'Mathematics teacher',
  'English teacher',
  'Homeroom teacher',
  'Department head',
  'Subject coordinator',
  'Teaching assistant',
  'Lecturer',
  'Professor',
];

const SUBJECT_OPTIONS = [
  'Mathematics',
  'Science',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'History',
  'Geography',
  'Computer Science',
  'Art',
  'Music',
  'Physical Education',
  'Economics',
  'Urdu',
  'Arabic',
];

let dialCache: DialOption[] | null = null;
let countryCache: string[] | null = null;
let tzCache: string[] | null = null;

export function getDialOptions(): DialOption[] {
  if (dialCache) return dialCache;
  const seen = new Set<string>();
  const list: DialOption[] = [];
  for (const c of Country.getAllCountries()) {
    const dial = (c.phonecode || '').replace(/[^\d]/g, '');
    if (!dial) continue;
    const key = `${c.isoCode}-${dial}`;
    if (seen.has(key)) continue;
    seen.add(key);
    list.push({
      iso: c.isoCode,
      dial,
      countryName: c.name,
      label: `${c.name} (+${dial})`,
    });
  }
  list.sort((a, b) => a.countryName.localeCompare(b.countryName));
  dialCache = list;
  return list;
}

export function getCountryNames(): string[] {
  if (countryCache) return countryCache;
  countryCache = Country.getAllCountries()
    .map((c) => c.name)
    .sort((a, b) => a.localeCompare(b));
  return countryCache;
}

export function getCitiesForCountryName(countryName: string): string[] {
  if (!countryName.trim()) return [];
  const match = Country.getAllCountries().find(
    (c) => c.name.toLowerCase() === countryName.trim().toLowerCase(),
  );
  if (!match) return [];
  const cities = City.getCitiesOfCountry(match.isoCode) ?? [];
  const names = [...new Set(cities.map((c) => c.name))];
  names.sort((a, b) => a.localeCompare(b));
  return names;
}

export function getInstitutionOptions(): string[] {
  return INSTITUTIONS;
}

export function getTitleOptions(): string[] {
  return PROFESSIONAL_TITLES;
}

export function getSubjectOptions(): string[] {
  return SUBJECT_OPTIONS;
}

export function getTimezoneOptions(): string[] {
  if (tzCache) return tzCache;
  try {
    const intl = Intl as typeof Intl & {
      supportedValuesOf?: (key: string) => string[];
    };
    if (typeof intl.supportedValuesOf === 'function') {
      tzCache = intl.supportedValuesOf('timeZone');
      return tzCache;
    }
  } catch {
    /* fall through */
  }
  tzCache = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Karachi',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Pacific/Auckland',
  ];
  return tzCache;
}

/** Split stored "+92 300…" into dial digits + national number. */
export function splitPhone(stored: string): { dial: string; national: string } {
  const raw = stored.trim();
  if (!raw) return { dial: '1', national: '' };
  const digits = raw.replace(/[^\d+]/g, '');
  const noPlus = digits.replace(/^\+/, '');
  const options = getDialOptions().slice().sort((a, b) => b.dial.length - a.dial.length);
  for (const o of options) {
    if (noPlus.startsWith(o.dial) && noPlus.length > o.dial.length) {
      return { dial: o.dial, national: noPlus.slice(o.dial.length) };
    }
  }
  return { dial: '1', national: noPlus };
}

export function joinPhone(dial: string, national: string): string {
  const n = national.replace(/[^\d]/g, '');
  const d = dial.replace(/[^\d]/g, '');
  if (!n) return d ? `+${d}` : '';
  return `+${d} ${n}`.trim();
}

export function dialLabel(dial: string): string {
  const d = dial.replace(/[^\d]/g, '');
  const hit = getDialOptions().find((o) => o.dial === d);
  return hit ? `+${hit.dial}` : d ? `+${d}` : '+1';
}
