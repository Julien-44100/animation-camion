// Inline the variable fonts into the animation and write two outputs:
//   nowirly-motion.html                 standalone page (open it in a browser, used by the renderer)
//   dist/nowirly-motion.artifact.html   same content without the document skeleton (for publishing)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fv = (pkg, file) => path.join(root, 'node_modules/@fontsource-variable', pkg, 'files', file);

const fonts = [
  { family: 'Bricolage Grotesque Variable', file: fv('bricolage-grotesque', 'bricolage-grotesque-latin-standard-normal.woff2'), weight: '200 800', stretch: '75% 100%' },
  { family: 'Inter Variable', file: fv('inter', 'inter-latin-wght-normal.woff2'), weight: '100 900' },
  { family: 'JetBrains Mono Variable', file: fv('jetbrains-mono', 'jetbrains-mono-latin-wght-normal.woff2'), weight: '100 800' },
];

const css = fonts.map(f => {
  const b64 = fs.readFileSync(f.file).toString('base64');
  return `@font-face{font-family:"${f.family}";font-style:normal;font-display:block;font-weight:${f.weight};${f.stretch ? `font-stretch:${f.stretch};` : ''}src:url(data:font/woff2;base64,${b64}) format("woff2")}`;
}).join('\n');

const src = fs.readFileSync(path.join(root, 'src/nowirly-motion.html'), 'utf8');
if (!src.includes('/*@FONTS@*/')) throw new Error('Font placeholder missing in src/nowirly-motion.html');
const page = src.replace('/*@FONTS@*/', () => css);

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/nowirly-motion.artifact.html'), page);
fs.writeFileSync(
  path.join(root, 'nowirly-motion.html'),
  `<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n</head>\n<body>\n${page}\n</body>\n</html>\n`
);
const kb = n => (n / 1024).toFixed(0) + ' KB';
console.log('built nowirly-motion.html', kb(fs.statSync(path.join(root, 'nowirly-motion.html')).size));
