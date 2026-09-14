import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('production worker serves HTML, scripts and icons after restart without a server', async () => {
  const source = readFileSync(new URL('./dist/sw.js', import.meta.url), 'utf8');
  const base = source.match(/const BASE = '([^']+)'/)[1];
  const stores = new Map();
  let online = true;
  const fetch = async request => {
    if (!online) throw new Error('Server stopped');
    const path = typeof request === 'string' ? request : request.url;
    const name = new URL(path, 'https://example.com').pathname.slice(base.length);
    return new Response(readFileSync(new URL(`./dist/${name}`, import.meta.url)));
  };
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const entries = stores.get(name);
      return {
        async addAll(urls) { for (const url of urls) entries.set(url, await fetch(url)); },
        async match(request) {
          const path = typeof request === 'string' ? request : new URL(request.url).pathname;
          return entries.get(path)?.clone();
        },
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };
  function boot() {
    const listeners = {};
    vm.runInNewContext(source, { URL, caches, fetch, self: {
      location: { origin: 'https://example.com' }, clients: { claim: async () => {} },
      addEventListener: (name, listener) => { listeners[name] = listener; },
    } });
    return listeners;
  }
  let worker = boot();
  let pending;
  worker.install({ waitUntil: value => { pending = value; } });
  await pending;
  worker.activate({ waitUntil: value => { pending = value; } });
  await pending;
  online = false;
  worker = boot();
  async function load(path, mode = 'cors') {
    let response;
    worker.fetch({ request: { url: `https://example.com${base}${path}`, method: 'GET', mode }, respondWith: value => { response = value; } });
    return await response;
  }
  const html = await (await load('', 'navigate')).text();
  assert.match(html, /id="root"/);
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (match[1].startsWith(base)) {
      const response = await load(match[1].slice(base.length));
      assert.ok((await response.arrayBuffer()).byteLength > 0, match[1]);
    }
  }
});
