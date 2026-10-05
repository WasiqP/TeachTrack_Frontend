import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const p = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/main/ViewGrades.tsx');
let s = fs.readFileSync(p, 'utf8');

const hookMatch = s.match(/\nfunction useViewGradesStyles\(\) \{[\s\S]*?\n\}\n(?=\n*export default)/);
if (!hookMatch) {
  console.error('hook not found at bottom');
  process.exit(1);
}
const hook = hookMatch[0].trim() + '\n';
s = s.replace(/\nfunction useViewGradesStyles\(\) \{[\s\S]*?\n\}\n(?=\n*export default)/, '\n');

const marker = 'const ViewGrades: React.FC<Props> = ({ navigation, embedded, active }) => {';
const idx = s.indexOf(marker);
if (idx < 0) {
  console.error('ViewGrades marker not found');
  process.exit(1);
}
s = s.slice(0, idx) + hook + '\n' + s.slice(idx);

fs.writeFileSync(p, s);
console.log('moved hook before ViewGrades');
