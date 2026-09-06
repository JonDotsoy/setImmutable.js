/**
 * Smoke test for the ESM dynamic `import("setimmutable")` import style,
 * run standalone via `node tc-import.mjs` (see .github/workflows/test.yml,
 * job "tc") against the package under test on every TC Node version.
 * Top-level `await` only parses inside a real ES module, hence the
 * `.mjs` extension and why this lives in its own file instead of a case
 * inside tc-published-package.js (which is CommonJS).
 */

import assert from 'assert'

const setImmutable = (await import('setimmutable')).default

const result = setImmutable({}, 'a.b.c', 1)

assert.strictEqual(result.a.b.c, 1)

console.log('import("setimmutable"): OK on Node ' + process.version)
