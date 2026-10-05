import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = path.join(__dirname, '../src/main/TaskGradeReport.tsx');
let s = fs.readFileSync(p, 'utf8');

const start = s.indexOf('\nconst styles = StyleSheet.create({');
const exportIdx = s.lastIndexOf('export default TaskGradeReport');
const end = exportIdx > 0 ? s.lastIndexOf('});', exportIdx) : -1;
if (start < 0 || end < 0) {
  console.error('markers', start, end);
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
stylesBlock = stylesBlock.replace(/ROW_DIVIDER/g, 'ink.rowDivider');
stylesBlock = stylesBlock.replace(/R_CARD/g, 'radius.card');
stylesBlock = stylesBlock.replace(/\bINK\b/g, 'ink.ink');

const before = s.slice(0, start);
const after = s.slice(end + 3).replace(/^\r?\n/, '');
const anchor = '  if (!classData || !task) {';
const insertPoint = before.lastIndexOf(anchor);
if (insertPoint < 0) {
  console.error('anchor not found');
  process.exit(1);
}
const head = before.slice(0, insertPoint);
const tail = before.slice(insertPoint);
s = head + '\n' + stylesBlock + '\n' + tail + after;

fs.writeFileSync(p, s);
console.log('ok');
