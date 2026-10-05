import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = path.join(__dirname, '../src/main/Home.tsx');
let s = fs.readFileSync(p, 'utf8');

s = s.replace(
  "import { theme, fonts as F, ink, radius } from '../theme';",
  "import { fonts as F, radius, useThemeMode } from '../theme';",
);

const lines = s.split('\n');
const idx = lines.findIndex((l) => l.includes('const CANVAS = ink.canvas'));
if (idx !== -1) {
  lines.splice(idx, 8);
}
s = lines.join('\n');

const startPat = 'const styles = StyleSheet.create(';
const start = s.indexOf(startPat);
if (start === -1) {
  console.error('start not found');
  process.exit(1);
}
let i = start + startPat.length;
if (s[i] !== '{') {
  console.error('expected { after create(');
  process.exit(1);
}
let depth = 1;
const startBrace = i;
for (i = i + 1; i < s.length; i++) {
  const c = s[i];
  if (c === '{') depth++;
  else if (c === '}') {
    depth--;
    if (depth === 0) {
      const endObj = i;
      const inner = s.slice(startBrace, endObj + 1);
      let j = i + 1;
      while (j < s.length && /\s/.test(s[j])) j++;
      if (s[j] !== ')' || s[j + 1] !== ';') {
        console.error('expected );');
        process.exit(1);
      }
      const semiEnd = j + 2;
      const exportIdx = s.indexOf('\n\nexport default Home', semiEnd);
      if (exportIdx === -1) {
        console.error('export not found');
        process.exit(1);
      }
      const before = s.slice(0, start);
      const afterExport = s.slice(exportIdx);
      const hook = `  const { ink, theme } = useThemeMode();
  const CANVAS = ink.canvas;
  const INK = ink.ink;
  const INK_SOFT = ink.inkSoft;
  const BORDER_INK = ink.borderInk;
  const BORDER_WIDTH = ink.borderWidth;
  const ROW_DIVIDER = ink.rowDivider;
  const ICON_WELL = ink.iconWell;
  const PRESS_TINT = ink.pressTint;

  const styles = useMemo(
    () =>
      StyleSheet.create(${inner}),
    [ink, theme],
  );
`;
      const ret = before.indexOf('\n  return (\n    <SafeAreaView style={styles.safe}');
      if (ret === -1) {
        console.error('return not found');
        process.exit(1);
      }
      s = before.slice(0, ret) + '\n' + hook + before.slice(ret) + afterExport;
      fs.writeFileSync(p, s);
      console.log('OK');
      process.exit(0);
    }
  }
}
console.error('brace parse failed');
process.exit(1);
