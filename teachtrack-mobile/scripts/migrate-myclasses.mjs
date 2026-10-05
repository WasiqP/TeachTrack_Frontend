import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = path.join(__dirname, '../src/main/MyClasses.tsx');
let s = fs.readFileSync(p, 'utf8');

s = s.replace(
  /import \{ theme, fonts as F, ink, radius \} from '\.\.\/theme'/,
  "import { fonts as F, radius, useThemeMode } from '../theme'",
);

s = s.replace(
  /const CANVAS = ink\.canvas;\r?\nconst INK = ink\.ink;\r?\nconst INK_SOFT = ink\.inkSoft;\r?\nconst BORDER_INK = ink\.borderInk;\r?\nconst BORDER_WIDTH = ink\.borderWidth;\r?\nconst R_CARD = radius\.card;\r?\nconst R_INPUT = radius\.input;\r?\nconst R_BTN = radius\.btn;\r?\nconst ROW = ink\.rowDivider;\r?\n/,
  '',
);

s = s.replace(/color = INK_SOFT/g, "color = '#1A1A22'");
s = s.replace(/color = theme\.white/g, "color = '#FFFFFF'");
s = s.replace(/color = theme\.primary/g, "color = '#A060FF'");

s = s.replace(
  /const MyClasses: React\.FC<Props> = \(\{ navigation, embedded \}\) => \{\r?\n  const \{ classes/,
  `const MyClasses: React.FC<Props> = ({ navigation, embedded }) => {
  const { ink, theme } = useThemeMode();
  const { classes`,
);

s = s.replace(/<SearchIcon size=\{20\} color=\{INK_SOFT\} \/>/, '<SearchIcon size={20} color={ink.inkSoft} />');

const start = s.indexOf('\nconst styles = StyleSheet.create({');
const exportIdx = s.lastIndexOf('export default MyClasses');
const end = exportIdx > 0 ? s.lastIndexOf('});', exportIdx) : -1;
if (start < 0 || end < 0) {
  console.error('markers', start, end, exportIdx);
  process.exit(1);
}
let stylesBlock = s.slice(start + 1, end + 3);
stylesBlock = stylesBlock.replace(
  /^const styles = StyleSheet\.create\(\{/m,
  `  const styles = useMemo(
    () =>
      StyleSheet.create({`,
);
stylesBlock = stylesBlock.replace(/\}\);$/m, `      }),
    [ink, theme],
  );`);
stylesBlock = stylesBlock.replace(/CANVAS/g, 'ink.canvas');
stylesBlock = stylesBlock.replace(/INK_SOFT/g, 'ink.inkSoft');
stylesBlock = stylesBlock.replace(/BORDER_INK/g, 'ink.borderInk');
stylesBlock = stylesBlock.replace(/BORDER_WIDTH/g, 'ink.borderWidth');
stylesBlock = stylesBlock.replace(/\bROW\b/g, 'ink.rowDivider');
stylesBlock = stylesBlock.replace(/R_CARD/g, 'radius.card');
stylesBlock = stylesBlock.replace(/R_INPUT/g, 'radius.input');
stylesBlock = stylesBlock.replace(/R_BTN/g, 'radius.btn');
stylesBlock = stylesBlock.replace(/\bINK\b/g, 'ink.ink');

const before = s.slice(0, start);
const after = s.slice(end + 3).replace(/^\r?\n/, '');
const insertPoint = before.lastIndexOf('  return (');
const head = before.slice(0, insertPoint);
const tail = before.slice(insertPoint);
s = head + '\n' + stylesBlock + '\n' + tail + after;

fs.writeFileSync(p, s);
console.log('ok');
