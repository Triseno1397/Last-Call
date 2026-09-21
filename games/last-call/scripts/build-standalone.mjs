/**
 * Fold the standalone build into one openable HTML file.
 *
 * Reads `dist-standalone/index.html`, strips the tags pointing at the built
 * stylesheet and bundle, and inlines both instead — the stylesheet in the head,
 * the script at the end of the body so `#root` exists when it runs. The result
 * has no relative dependencies at all and opens straight from disk at
 * `file://`. The script goes in as a classic `<script>`, not a module: browsers
 * refuse to load ES modules from a `file://` origin, which is why the
 * standalone vite config builds `iife`.
 *
 * Saves and imported portraits live in localStorage, per file. The platform AI
 * transport is absent off-platform, so conversations run the scripted trees.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', 'dist-standalone');

const built = readFileSync(join(dist, 'index.html'), 'utf8');
const cssFile = built.match(/<link\b[^>]*\bhref="\.?\/?([^"]+\.css)"[^>]*>/)?.[1];
const jsFile = built.match(/<script\b[^>]*\bsrc="\.?\/?([^"]+\.js)"[^>]*>\s*<\/script>/)?.[1];

if (!jsFile) throw new Error('No bundle in dist-standalone/index.html — run the standalone vite build first.');

const css = cssFile ? readFileSync(join(dist, cssFile), 'utf8') : '';
const js = readFileSync(join(dist, jsFile), 'utf8');

const page = built
  .replace(/\s*<script\b[^>]*\bsrc="\.?\/?[^"]+\.js"[^>]*>\s*<\/script>/, '')
  .replace(/\s*<link\b[^>]*\bhref="\.?\/?[^"]+\.css"[^>]*>/, '')
  // Replacer FUNCTIONS, not strings: a replacement string treats `$&`, `$\``
  // and friends as substitutions, and minified React is full of them.
  .replace('</head>', () => `  <style>\n${css}\n  </style>\n  </head>`)
  // The bundle can hold `</script>` inside a string literal; split the closing
  // tag so the HTML parser cannot end the block early.
  .replace('</body>', () => `  <script>\n${js.replace(/<\/script>/g, () => '<\\/script>')}\n  </script>\n  </body>`);

const out = join(dist, 'last-call.html');
writeFileSync(out, page, 'utf8');
console.log('dist-standalone/last-call.html written');
console.log('  inlined css:', cssFile ?? '(none)', `${(css.length / 1024).toFixed(0)} kB`);
console.log('  inlined js: ', jsFile, `${(js.length / 1024).toFixed(0)} kB`);
