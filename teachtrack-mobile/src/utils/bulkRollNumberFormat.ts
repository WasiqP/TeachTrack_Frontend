/** Build sequential roll numbers for bulk assign (prefix + padded number + suffix). */

export type BulkRollPattern = {
  prefix: string;
  suffix: string;
  start: number;
  step: number;
  /** 0 = no zero-padding; otherwise minimum digit width for the numeric part (non-negative integers). */
  padLength: number;
};

const MAX_ROLL_LEN = 16;

export function formatBulkRollIndex(pattern: BulkRollPattern, index: number): string {
  const n = pattern.start + index * pattern.step;
  let core: string;
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    core = String(n);
  } else if (pattern.padLength > 0 && n >= 0) {
    core = String(n).padStart(pattern.padLength, '0');
  } else {
    core = String(n);
  }
  return `${pattern.prefix}${core}${pattern.suffix}`;
}

export function validateBulkRollAssignments(
  studentCount: number,
  pattern: BulkRollPattern,
): { ok: true; rolls: string[] } | { ok: false; message: string } {
  if (studentCount === 0) {
    return { ok: false, message: 'No students on the roster.' };
  }
  if (!Number.isFinite(pattern.start) || !Number.isInteger(pattern.start)) {
    return { ok: false, message: 'Start at must be a whole number.' };
  }
  if (!Number.isFinite(pattern.step) || !Number.isInteger(pattern.step) || pattern.step === 0) {
    return { ok: false, message: 'Step must be a non-zero whole number.' };
  }
  if (pattern.padLength < 0 || pattern.padLength > 8) {
    return { ok: false, message: 'Pad length must be between 0 and 8.' };
  }

  const rolls: string[] = [];
  for (let i = 0; i < studentCount; i++) {
    const r = formatBulkRollIndex(pattern, i);
    if (!r.trim()) {
      return {
        ok: false,
        message: 'Some roll numbers would be empty. Adjust prefix, start, or step.',
      };
    }
    if (r.length > MAX_ROLL_LEN) {
      return {
        ok: false,
        message: `A roll would be longer than ${MAX_ROLL_LEN} characters (e.g. "${r}"). Shorten prefix or suffix.`,
      };
    }
    rolls.push(r);
  }

  const uniq = new Set(rolls);
  if (uniq.size !== rolls.length) {
    return {
      ok: false,
      message: 'That pattern would create duplicate roll numbers for this class. Change start or step.',
    };
  }

  return { ok: true, rolls };
}
