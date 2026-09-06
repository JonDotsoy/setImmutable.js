/**
 * Smoke test for a bare, binding-less `import "setimmutable/map"`, run
 * standalone via `node tc-bare-import-map.mjs` (see
 * .github/workflows/test.yml, job "tc") against the package under test on
 * every TC Node version. Exercises package.json's "exports" map: without
 * it, Node's ESM resolver refuses this subpath (unlike require(), it
 * won't infer the ".js" extension on a bare specifier) with
 * ERR_MODULE_NOT_FOUND.
 */

import 'setimmutable/map'

console.log('import "setimmutable/map": OK on Node ' + process.version)
