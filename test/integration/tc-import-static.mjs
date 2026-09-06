/**
 * Smoke test for the static ESM `import setImmutable from "setimmutable"`
 * import style, run standalone via `node tc-import-static.mjs` (see
 * .github/workflows/test.yml, job "tc") against the package under test
 * on every TC Node version. Lives in its own `.mjs` file (as opposed to
 * tc-import.mjs, which covers the dynamic `await import(...)` style)
 * since a static `import` statement only parses inside a real ES module.
 */

import assert from 'assert'
import setImmutable from 'setimmutable'

const result = setImmutable({}, 'a.b.c', 1)

assert.strictEqual(result.a.b.c, 1)

console.log('import setimmutable from "setimmutable": OK on Node ' + process.version)
