/**
 * Parse pasted CSV: one student per line.
 * Supported shapes:
 * - `Name` or `Name, email` (original)
 * - `Name, email, roll` when a third column is present (no header)
 * - Header row with name + email; optional roll column (`name, email, roll` or `roll, name, email`)
 */
export type ParsedCsvStudent = {
  name: string;
  email?: string;
  rollNumber?: string;
};

function normalizeHeaderParts(line: string): string[] {
  return line.split(',').map((s) => s.trim().toLowerCase().replace(/^"|"$/g, ''));
}

function parseDataParts(line: string): string[] {
  return line.split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
}

type CsvLayout = 'name_email' | 'name_email_roll' | 'roll_name_email';

function layoutFromHeader(parts: string[]): CsvLayout | null {
  const joined = parts.join(' ');
  if (!joined.includes('name')) return null;
  const rollFirst = parts[0]?.includes('roll');
  const rollLast = parts[parts.length - 1]?.includes('roll');
  if (rollFirst) return 'roll_name_email';
  if (rollLast || parts.some((p) => p.includes('roll'))) return 'name_email_roll';
  return 'name_email';
}

export function parseStudentCsvRows(text: string): ParsedCsvStudent[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  let start = 0;
  let layout: CsvLayout = 'name_email';

  const headerLayout = layoutFromHeader(normalizeHeaderParts(lines[0]));
  if (headerLayout) {
    layout = headerLayout;
    start = 1;
  } else {
    const firstDataParts = parseDataParts(lines[0]);
    if (firstDataParts.length >= 3) {
      layout = 'name_email_roll';
    }
  }

  const out: ParsedCsvStudent[] = [];
  for (let i = start; i < lines.length; i++) {
    const parts = parseDataParts(lines[i]);
    if (parts.length === 0 || !parts[0]) continue;

    let name: string;
    let email: string | undefined;
    let rollNumber: string | undefined;

    if (layout === 'roll_name_email') {
      rollNumber = parts[0]?.trim() || undefined;
      name = (parts[1] ?? '').trim();
      email = parts[2]?.trim() || undefined;
    } else {
      name = parts[0].trim();
      email = parts[1]?.trim() || undefined;
      if (parts.length >= 3) {
        rollNumber = parts[2]?.trim() || undefined;
      }
    }

    if (!name) continue;
    out.push({
      name,
      email,
      rollNumber: rollNumber || undefined,
    });
  }
  return out;
}
