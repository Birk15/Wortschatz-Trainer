import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export function offlineApp() {
  let base = '/';
  return {
    name: 'wortschatz-offline',
    enforce: 'post',
    configResolved(config) { base = config.base; },
    generateBundle(_, bundle) {
      const publicFiles = ['manifest.webmanifest', 'apple-touch-icon.png', 'icon.svg', 'icon-192.png', 'icon-512.png'];
      const template = readFileSync(new URL('./service-worker.js', import.meta.url), 'utf8');
      const prefix = `wortschatz-${createHash('sha256').update(base).digest('hex').slice(0, 8)}-`;
      const hash = createHash('sha256').update(template).update(base)
        .update(readFileSync(new URL('./index.html', import.meta.url)));
      Object.keys(bundle).sort().forEach(name => {
        const item = bundle[name];
        hash.update(name).update(item.type === 'chunk' ? item.code : item.source);
      });
      publicFiles.forEach(name => hash.update(readFileSync(new URL(`./public/${name}`, import.meta.url))));
      const assets = [...new Set(['index.html', ...Object.keys(bundle), ...publicFiles])].map(name => `${base}${name}`);
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: template
        .replace('__CACHE_NAME__', `${prefix}${hash.digest('hex').slice(0, 16)}`)
        .replace('__CACHE_PREFIX__', prefix)
        .replace('__BASE_URL__', base)
        .replace('__PRECACHE_ASSETS__', JSON.stringify(assets)) });
    },
  };
}
