/**
 * Usage: node scripts/extract-styles-hook.mjs <relativePathToTsx> <hookName>
 * Example: node scripts/extract-styles-hook.mjs src/teacher/CreateClass.tsx useCreateClassStyles
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = process.argv[2];
const hookName = process.argv[3];
if (!rel || !hookName) {
  console.error('usage: extract-styles-hook.mjs <file.tsx> <hookName>');
  process.exit(1);
}
const full = path.join(root, rel);
const dir = path.dirname(full);
const base = path.basename(rel, '.tsx');
const outFile = path.join(dir, `${hookName}.ts`);

const src = fs.readFileSync(full, 'utf8');
const m = src.match(/const styles = StyleSheet.create\(\{([\s\S]*)\}\);/);
if (!m) {
  console.error('no const styles = StyleSheet.create found');
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
inner = inner.replace(/R_BTN/g, 'radius.btn');
inner = inner.replace(/\bINK\b/g, 'ink.ink');
inner = inner.replace(/\bBW\b/g, 'ink.borderWidth');

const segments = rel.replace(/\\/g, '/').split('/').filter(Boolean);
const depth = Math.max(0, segments.length - 2);
const themeImport = (depth ? '../'.repeat(depth) : './') + 'theme';

const out = `import { useMemo } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { fonts as F, radius, useThemeMode } from '${themeImport}';

export function ${hookName}() {
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

fs.writeFileSync(outFile, out);
console.log('wrote', path.relative(root, outFile));
