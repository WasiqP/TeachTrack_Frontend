import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = path.join(__dirname, '../src/main/ViewGrades.tsx');
let s = fs.readFileSync(p, 'utf8');

s = s.replace(
  /import \{ theme, fonts as F, ink, radius \} from '\.\.\/theme'/,
  "import { fonts as F, radius, useThemeMode } from '../theme'",
);

s = s.replace(
  /const CANVAS = ink\.canvas;\r?\nconst INK = ink\.ink;\r?\nconst INK_SOFT = ink\.inkSoft;\r?\nconst BORDER_INK = ink\.borderInk;\r?\nconst BORDER_WIDTH = ink\.borderWidth;\r?\nconst ROW_DIVIDER = ink\.rowDivider;\r?\nconst R_CARD = radius\.card;\r?\nconst R_INPUT = radius\.input;\r?\n/,
  '',
);

s = s.replace(/color = INK_SOFT/g, "color = '#1A1A22'");
s = s.replace(/color = INK\b/g, "color = '#050508'");
s = s.replace(/color = theme\.primary/g, "color = '#A060FF'");

s = s.replace(
  /function gradeColor\(status: TaskGradeRecord\['status'\]\): string \{\s*switch \(status\) \{\s*case 'missing':\s*return '#DC2626';\s*case 'pending':\s*return '#D97706';\s*default:\s*return theme\.primary;\s*\}\s*\}/,
  `function gradeColor(status: TaskGradeRecord['status'], primary: string): string {
  switch (status) {
    case 'missing':
      return '#DC2626';
    case 'pending':
      return '#D97706';
    default:
      return primary;
  }
}`,
);

const styleMatch = s.match(/\nconst styles = StyleSheet\.create\(\{([\s\S]*)\n\}\);\r?\n/);
if (!styleMatch) {
  console.error('could not match styles block');
  process.exit(1);
}
let inner = styleMatch[1];
inner = inner.replace(/CANVAS/g, 'ink.canvas');
inner = inner.replace(/INK_SOFT/g, 'ink.inkSoft');
inner = inner.replace(/BORDER_INK/g, 'ink.borderInk');
inner = inner.replace(/BORDER_WIDTH/g, 'ink.borderWidth');
inner = inner.replace(/ROW_DIVIDER/g, 'ink.rowDivider');
inner = inner.replace(/R_CARD/g, 'radius.card');
inner = inner.replace(/R_INPUT/g, 'radius.input');
inner = inner.replace(/\bINK\b/g, 'ink.ink');

const hookFn = `
function useViewGradesStyles() {
  const { ink, theme } = useThemeMode();
  const styles = useMemo(
    () =>
      StyleSheet.create({${inner}
      }),
    [ink, theme],
  );
  return { styles, ink, theme };
}
`;

s = s.replace(/\nconst styles = StyleSheet\.create\(\{[\s\S]*\n\}\);\r?\n/, `\n${hookFn}\n`);

fs.writeFileSync(p, s);
console.log('ok');
