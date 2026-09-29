import { wcagContrast } from 'culori';
import { tokens } from '../lib/tokens.generated';

interface ContrastPair {
  name: string;
  fg: string;
  bg: string;
  minRatio: number; // 4.5 for body, 3.0 for large/components
  type: 'body' | 'ui' | 'heading';
}

export const PAIRS_TO_CHECK: ContrastPair[] = [
  // Surfaces & text (60%)
  { name: 'Default text on page bg', fg: tokens.colors.text.default, bg: tokens.colors.surface.bg, minRatio: 4.5, type: 'body' },
  { name: 'Default text on card surface', fg: tokens.colors.text.default, bg: tokens.colors.surface.surface, minRatio: 4.5, type: 'body' },
  { name: 'Muted text on card surface', fg: tokens.colors.text.muted, bg: tokens.colors.surface.surface, minRatio: 4.5, type: 'body' },
  { name: 'Link text on page bg', fg: tokens.colors.text.link, bg: tokens.colors.surface.bg, minRatio: 4.5, type: 'body' },
  { name: 'Link text on card surface', fg: tokens.colors.text.link, bg: tokens.colors.surface.surface, minRatio: 4.5, type: 'body' },

  // Primary Structure (30%)
  { name: 'Primary button text on primary navy', fg: tokens.colors.primary.fg, bg: tokens.colors.primary.default, minRatio: 4.5, type: 'body' },
  { name: 'Nav text on nav navy bg', fg: tokens.colors.primary.navFg, bg: tokens.colors.primary.navBg, minRatio: 4.5, type: 'body' },
  { name: 'Table header text on table header navy', fg: tokens.colors.primary.tableHeaderFg, bg: tokens.colors.primary.tableHeaderBg, minRatio: 4.5, type: 'body' },
  { name: 'Primary navy text on soft navy bg', fg: tokens.colors.primary.default, bg: tokens.colors.primary.soft, minRatio: 4.5, type: 'body' },

  // Accent (10%)
  { name: 'Accent button white text on marigold-strong', fg: tokens.colors.accent.fg, bg: tokens.colors.accent.default, minRatio: 3.0, type: 'ui' },

  // Status Chips (Text on Soft Background)
  { name: 'Success text on success-soft', fg: tokens.colors.status.success.fg, bg: tokens.colors.status.success.soft, minRatio: 4.5, type: 'body' },
  { name: 'Warning text on warning-soft', fg: tokens.colors.status.warning.fg, bg: tokens.colors.status.warning.soft, minRatio: 4.5, type: 'body' },
  { name: 'Danger text on danger-soft', fg: tokens.colors.status.danger.fg, bg: tokens.colors.status.danger.soft, minRatio: 4.5, type: 'body' },
  { name: 'Info text on info-soft', fg: tokens.colors.status.info.fg, bg: tokens.colors.status.info.soft, minRatio: 4.5, type: 'body' },

  // CBC Performance Levels
  { name: 'CBC EE text on EE-soft', fg: tokens.colors.levels.ee.fg, bg: tokens.colors.levels.ee.soft, minRatio: 4.5, type: 'body' },
  { name: 'CBC ME text on ME-soft', fg: tokens.colors.levels.me.fg, bg: tokens.colors.levels.me.soft, minRatio: 4.5, type: 'body' },
  { name: 'CBC AE text on AE-soft', fg: tokens.colors.levels.ae.fg, bg: tokens.colors.levels.ae.soft, minRatio: 4.5, type: 'body' },
  { name: 'CBC BE text on BE-soft', fg: tokens.colors.levels.be.fg, bg: tokens.colors.levels.be.soft, minRatio: 4.5, type: 'body' },
];

export function runContrastChecks() {
  console.log('Running WCAG Contrast Verification...\n');
  let failures = 0;
  const results = [];

  for (const pair of PAIRS_TO_CHECK) {
    const ratio = wcagContrast(pair.fg, pair.bg);
    const passed = ratio >= pair.minRatio;
    results.push({ ...pair, ratio: Number(ratio.toFixed(2)), passed });

    const status = passed ? 'PASS' : 'FAIL';
    const indicator = passed ? '✓' : '✗';
    console.log(`${indicator} [${status}] ${pair.name}: ${ratio.toFixed(2)}:1 (Required: ${pair.minRatio}:1) [fg: ${pair.fg}, bg: ${pair.bg}]`);

    if (!passed) failures++;
  }

  if (failures > 0) {
    console.error(`\nFAILED: ${failures} contrast checks did not meet WCAG threshold!`);
    process.exit(1);
  } else {
    console.log(`\nALL ${PAIRS_TO_CHECK.length} WCAG AA CONTRAST CHECKS PASSED.`);
  }

  return results;
}

runContrastChecks();
