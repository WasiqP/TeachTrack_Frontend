import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'src/main/ViewGrades.tsx'), 'utf8');
const m = src.match(/const styles = StyleSheet.create\(\{([\s\S]*)\}\);/);
if (!m) {
  console.error('no styles match');
  process.exit(1);
}
let inner = m[1];
inner = inner.replace(/CANVAS/g, 'ink.canvas');
inner = inner.replace(/INK_SOFT/g, 'ink.inkSoft');
inner = inner.replace(/BORDER_INK/g, 'ink.borderInk');
inner = inner.replace(/BORDER_WIDTH/g, 'ink.borderWidth');
inner = inner.replace(/ROW_DIVIDER/g, 'ink.rowDivider');
inner = inner.replace(/R_CARD/g, 'radius.card');
inner = inner.replace(/R_INPUT/g, 'radius.input');
inner = inner.replace(/\bINK\b/g, 'ink.ink');

const out = `import { useMemo } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { fonts as F, radius, useThemeMode } from '../theme';

export function useViewGradesStyles() {
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

fs.writeFileSync(path.join(root, 'src/main/useViewGradesStyles.ts'), out);
console.log('written useViewGradesStyles.ts');
