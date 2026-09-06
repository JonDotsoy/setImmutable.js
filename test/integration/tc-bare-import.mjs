/**
 * Smoke test for a bare, binding-less `import "setimmutable"`, run
 * standalone via `node tc-bare-import.mjs` (see .github/workflows/test.yml,
 * job "tc") against the package under test on every TC Node version. Only
 * needs ESM support at all (no dynamic import, no top-level await), same
 * constraint as tc-import-static.mjs.
 */

import 'setimmutable'

console.log('import "setimmutable": OK on Node ' + process.version)
