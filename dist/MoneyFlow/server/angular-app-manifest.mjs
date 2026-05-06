
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
    'index.csr.html': {size: 11526, hash: 'b70a4480ba24398dd10bb53858fb535778db0c41a3d2a33aec609d7e9ae67f35', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 10854, hash: '1aa040395803144122233121c0a7f34586ae9c43aac8471736a9a8d8ea2e0c14', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'todos/index.html': {size: 26912, hash: '0314f6c2cbf323cee3f9580cc78750912973056deaf3ae86f2ca0b20083c365b', text: () => import('./assets-chunks/todos_index_html.mjs').then(m => m.default)},
    'transactions/index.html': {size: 37154, hash: 'e3eadc6c869b76f51847147ace02fb0493d37f60477bf57c9efbce52ea475f09', text: () => import('./assets-chunks/transactions_index_html.mjs').then(m => m.default)},
    'index.html': {size: 74314, hash: '8f286ff8d0cba8fbe5731248237d6fa1479aea4beb9cce5130d878a0fbebd7fe', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-CJSF3IG7.css': {size: 2909, hash: 'eodPDw3b038', text: () => import('./assets-chunks/styles-CJSF3IG7_css.mjs').then(m => m.default)}
  },
};
