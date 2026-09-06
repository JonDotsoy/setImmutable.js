'use strict'

/**
 * Smoke test for the CommonJS `require("setimmutable")` import style,
 * run standalone via `node tc-require.cjs` (see .github/workflows/test.yml,
 * job "tc") against the package under test on every TC Node version, so
 * it is its own file rather than a case inside tc-published-package.js.
 */

var assert = require('assert')
var setImmutable = require('setimmutable')

var result = setImmutable({}, 'a.b.c', 1)

assert.strictEqual(result.a.b.c, 1)

console.log('require("setimmutable"): OK on Node ' + process.version)
