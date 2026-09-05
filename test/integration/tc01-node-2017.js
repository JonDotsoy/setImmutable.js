'use strict'

/**
 * TC01 -- the published `setimmutable` package is importable on the
 * Node.js version this project originally targeted: Node 6, the LTS
 * release active through 2017 and the version pinned in the project's
 * original .travis.yml. Run with plain `node` (no mocha/babel/TS --
 * none of that tooling supports Node 6), against the package as
 * installed from the npm registry, not the repo's src/.
 *
 * See .github/workflows/test.yml (job "smoke-node-2017") for how this
 * is invoked in CI.
 */

var assert = require('assert')
var setImmutable = require('setimmutable')

console.log('TC01: setimmutable is importable on Node ' + process.version)

function tc (description, fn) {
  fn()
  console.log('  ok - ' + description)
}

// setImmutable(T, "a.b.c", V): R -- creates a nested path, returns a new object
tc('setImmutable({}, "a.b.c", 1) creates the nested path and returns a new object', function () {
  var T = {}
  var R = setImmutable(T, 'a.b.c', 1)

  assert.strictEqual(R.a.b.c, 1)
  assert.notStrictEqual(R, T)
  assert.deepEqual(T, {})
})

// setImmutable(T, "[0][1]", V): R -- array-index path
tc('setImmutable([], "[0][1]", "x") creates an array-shaped path', function () {
  var T = []
  var R = setImmutable(T, '[0][1]', 'x')

  assert.strictEqual(R[0][1], 'x')
  assert.notStrictEqual(R, T)
  assert.deepEqual(T, [])
})

// setImmutable(T, ["a", "b"], V): R -- path given as an array of keys
tc('setImmutable(T, ["a", "b"], V) accepts an array path and does not mutate T', function () {
  var T = {a: {b: 1}}
  var R = setImmutable(T, ['a', 'b'], 2)

  assert.strictEqual(R.a.b, 2)
  assert.strictEqual(T.a.b, 1)
  assert.notStrictEqual(R.a, T.a)
})

// setImmutable(T, path, V): R -- T frozen, R still gets the new value
tc('setImmutable(T, "a.b", V) never mutates a frozen T', function () {
  var T = Object.freeze({a: {b: 1}})
  var R = setImmutable(T, 'a.b', 2)

  assert.strictEqual(R.a.b, 2)
  assert.strictEqual(T.a.b, 1)
  assert.notStrictEqual(R, T)
})

// setImmutable(T, path, V): R -- branches not on path keep their reference
tc('setImmutable(T, "a.b", V) preserves the reference of siblings not on path', function () {
  var sibling = {untouched: true}
  var T = {a: {b: 1, sibling: sibling}}
  var R = setImmutable(T, 'a.b', 2)

  assert.strictEqual(R.a.sibling, sibling)
})

console.log('TC01: all cases passed on Node ' + process.version)
