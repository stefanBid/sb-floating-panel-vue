// Writes coverage badges (flat SVG, shields.io look) from coverage/coverage-summary.json.
// Usage: node scripts/coverage-badge.mjs <output dir>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outDir = process.argv[2];
if (!outDir) {
  console.error('Usage: node scripts/coverage-badge.mjs <output dir>');
  process.exit(1);
}

const { total } = JSON.parse(readFileSync('coverage/coverage-summary.json', 'utf8'));

const color = (pct) => {
  if (pct >= 90) return '#4c1';
  if (pct >= 80) return '#97ca00';
  if (pct >= 70) return '#a4a61d';
  if (pct >= 60) return '#dfb317';
  if (pct >= 50) return '#fe7d37';
  return '#e05d44';
};

// Approximate width of 11px Verdana, enough for short labels and percentages
const textWidth = (text) => Math.round(text.length * 6.5 + 10);

const badge = (label, pct) => {
  const message = `${Math.floor(pct * 10) / 10}%`;
  const labelWidth = textWidth(label);
  const messageWidth = textWidth(message);
  const width = labelWidth + messageWidth;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${label}: ${message}">
  <title>${label}: ${message}</title>
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <clipPath id="r"><rect width="${width}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${messageWidth}" height="20" fill="${color(pct)}"/>
    <rect width="${width}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + messageWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${message}</text>
    <text x="${labelWidth + messageWidth / 2}" y="14">${message}</text>
  </g>
</svg>
`;
};

mkdirSync(outDir, { recursive: true });
const files = {
  'coverage.svg': badge('coverage', total.lines.pct),
  'coverage-branches.svg': badge('branches', total.branches.pct),
};
for (const [name, svg] of Object.entries(files)) writeFileSync(join(outDir, name), svg);
console.log(`Coverage badges written to ${outDir}: ${Object.keys(files).join(', ')}`);
