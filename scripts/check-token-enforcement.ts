import * as fs from 'node:fs';
import * as path from 'node:path';

// Files and directories to scan
const SCAN_DIRS = ['app', 'components', 'lib'];
const IGNORED_FILES = [
  path.normalize('app/tokens.css'),
  path.normalize('lib/tokens.generated.ts'),
];

// Tailwind default palettes that must not be used (use semantic tokens instead)
const FORBIDDEN_PALETTES = [
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'
];

// Pattern to detect default palette classes like bg-blue-500, text-gray-400
const DEFAULT_PALETTE_REGEX = new RegExp(`\\b(bg|text|border|ring|fill|stroke)-(${FORBIDDEN_PALETTES.join('|')})-(?:50|100|200|300|400|500|600|700|800|900|950)\\b`, 'g');

// Pattern to detect arbitrary color values like bg-[#123456], text-[#fff]
const ARBITRARY_COLOR_REGEX = /\b(bg|text|border|ring)-\[#[0-9a-fA-F]{3,8}\]/g;

// Pattern to detect direct primitive CSS custom property usage: var(--navy-500), var(--marigold-400)
const PRIMITIVE_VAR_REGEX = /var\(--(navy|marigold|teal|red|green|gold|blue|cream|ink)-\d{2,3}\)/g;

function scanDir(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        scanDir(fullPath, fileList);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (['.ts', '.tsx', '.js', '.jsx', '.css'].includes(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

export function checkTokenEnforcement() {
  console.log('Running Design Token & 60-30-10 Enforcement Scan...');
  const filesToScan: string[] = [];
  for (const dir of SCAN_DIRS) {
    scanDir(path.resolve(process.cwd(), dir), filesToScan);
  }

  let errors = 0;

  for (const file of filesToScan) {
    const relative = path.relative(process.cwd(), file);
    if (IGNORED_FILES.some((ignored) => relative.includes(ignored))) {
      continue;
    }

    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      // 1. Check for forbidden default palette classes
      const defaultPaletteMatch = line.match(DEFAULT_PALETTE_REGEX);
      if (defaultPaletteMatch) {
        console.error(`[ERROR] ${relative}:${idx + 1}: Forbidden default Tailwind color class "${defaultPaletteMatch.join(', ')}". Use semantic tokens (e.g. bg-primary, text-text, bg-success-soft) instead.`);
        errors++;
      }

      // 2. Check for arbitrary hex color classes
      const arbitraryMatch = line.match(ARBITRARY_COLOR_REGEX);
      if (arbitraryMatch) {
        console.error(`[ERROR] ${relative}:${idx + 1}: Arbitrary hex color "${arbitraryMatch.join(', ')}". Use semantic tokens instead.`);
        errors++;
      }

      // 3. Check for primitive token usage in components
      const primitiveVarMatch = line.match(PRIMITIVE_VAR_REGEX);
      if (primitiveVarMatch) {
        console.error(`[ERROR] ${relative}:${idx + 1}: Direct primitive token "${primitiveVarMatch.join(', ')}". Components must only reference semantic tokens.`);
        errors++;
      }
    });
  }

  if (errors > 0) {
    console.error(`\nFAILED: Found ${errors} design token violations.`);
    process.exit(1);
  } else {
    console.log(`\nPASSED: All scanned files strictly adhere to semantic design tokens.`);
  }
}

checkTokenEnforcement();
