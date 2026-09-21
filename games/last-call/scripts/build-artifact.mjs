/**
 * Turn the Vite build into a page that can be published as a claude.ai
 * Artifact.
 *
 * The artifact platform wraps the published file in its own
 * doctype/html/head/body, so this emits the page contents only — the title, the
 * font link, the built stylesheet, the mount point and the built bundle — with
 * every asset referenced relatively, as the published files sit beside it.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', 'dist');

const built = readFileSync(join(dist, 'index.html'), 'utf8');
const css = [...built.matchAll(/href="\.?\/?(assets\/[^"]+\.css)"/g)].map((match) => match[1]);
const js = [...built.matchAll(/src="\.?\/?(assets\/[^"]+\.js)"/g)].map((match) => match[1]);

if (js.length === 0) {
  throw new Error('No bundle found in dist/index.html — run `npm run build` first.');
}

const page = `<title>Last Call</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Space+Grotesk:wght@500;600;700&display=swap"
  rel="stylesheet"
/>
${css.map((file) => `<link rel="stylesheet" href="${file}" />`).join('\n')}
<style>
  /* The artifact shell pads :root for phone safe areas; the game fills it. */
  html,
  body,
  #root {
    height: 100%;
    margin: 0;
  }
</style>
<div id="root"></div>
${js.map((file) => `<script type="module" src="${file}"></script>`).join('\n')}
`;

writeFileSync(join(dist, 'artifact.html'), page, 'utf8');
console.log('dist/artifact.html written');
console.log('  stylesheets:', css.join(', ') || '(none)');
console.log('  bundle:', js.join(', '));
