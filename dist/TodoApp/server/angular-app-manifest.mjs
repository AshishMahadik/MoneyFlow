
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/"
  },
  {
    "renderMode": 2,
    "route": "/todos"
  },
  {
    "renderMode": 2,
    "route": "/transactions"
  },
  {
    "renderMode": 2,
    "redirectTo": "/",
    "route": "/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 11526, hash: 'ce969e7a2d2bb4faa2578749c39c0b7b89b8b618c08be9c2eac437c21a4e3833', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 10854, hash: '8a0fee42a5c7de07269e8073455242da25ef7249c8495cff8494ddf2523ccd93', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'todos/index.html': {size: 26912, hash: '4a425ab039eada5df5238af4bf19220476a9058b22323b77ebe329aa3f112f78', text: () => import('./assets-chunks/todos_index_html.mjs').then(m => m.default)},
    'index.html': {size: 70051, hash: 'da6762cec40786f730ab34e9060aabf400531bf374c5290df5f25cd6af554c35', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'transactions/index.html': {size: 37154, hash: 'f0235244dd2e07d8949192e6cfb6453250c6496c963b6e65332b42deb3a76643', text: () => import('./assets-chunks/transactions_index_html.mjs').then(m => m.default)},
    'styles-CJSF3IG7.css': {size: 2909, hash: 'eodPDw3b038', text: () => import('./assets-chunks/styles-CJSF3IG7_css.mjs').then(m => m.default)}
  },
};
