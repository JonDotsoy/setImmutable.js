/**
 * TC01 (types) -- type-level checks for the *published* `setimmutable`
 * package (`tsc --noEmit`, no runtime execution -- see
 * test/types.test-d.ts for the doc-comment on why every assertion here
 * is currently loose: the package ships as plain, untyped JS with no
 * .d.ts/JSDoc, so TypeScript infers every parameter as `any`).
 *
 * Unlike test/types.test-d.ts (which type-checks the repo's own
 * src/*.js by relative import), this file imports the package by name
 * ("setimmutable", not "../src/setImmutable") so it only resolves
 * against a real `npm install setimmutable` -- see
 * .github/workflows/test.yml (job "tc01-types") for how this is
 * invoked, installed the same isolated way as the TC02-TC06 smoke
 * jobs. `.returns` assertions are intentionally left out here: resolving
 * a plain JS package through node_modules (as opposed to a relative
 * src/ import) makes TypeScript infer a different, non-`any` return
 * type for these functions, so `.returns.toBeAny()` would fail for
 * reasons unrelated to what this file is meant to check.
 */
import {expectTypeOf} from 'expect-type'
import setImmutable from 'setimmutable'
import map from 'setimmutable/map'
import clone from 'setimmutable/clone'

// -- other import styles tsc must also resolve/type-check -------------------
// (see the runtime equivalents in test/integration/tc-bare-import.mjs,
// tc-import.mjs and tc-require.cjs -- this covers the type-level side of
// two of those three styles against the published package. The third,
// a bare/side-effect `import 'setimmutable'` with no binding, is
// deliberately NOT included here: TypeScript does not report an
// unresolvable module for a binding-less import -- confirmed by testing
// `import 'a-module-that-does-not-exist'` alongside `import x from
// 'a-module-that-does-not-exist'` in isolation: the bound form correctly
// fails with TS2307, the bare form compiles cleanly either way. A bare
// import here would silently pass even if "setimmutable" didn't exist,
// so it can only be meaningfully verified at runtime, which
// tc-bare-import.mjs already does.)

// require() -- plain `require(...)` isn't typed without @types/node
// (not a dependency here), so this uses TypeScript's own require-import
// syntax instead, which needs no ambient Node types.
import requiredSetImmutable = require('setimmutable')
expectTypeOf(requiredSetImmutable).toBeFunction()

// dynamic import() -- wrapped in an async function rather than used at
// the top level: this file's tsconfig targets "module": "commonjs",
// where top-level await isn't valid TypeScript regardless of what the
// target Node version supports at runtime (see tc-import.mjs for that
// runtime check); wrapping is enough to type-check the same import().
async function checkDynamicImport () {
  const dynamicSetImmutable = (await import('setimmutable')).default
  expectTypeOf(dynamicSetImmutable).toBeFunction()
}
void checkDynamicImport

// -- set(object, path, value, [customClone]) --------------------------------

expectTypeOf(setImmutable).toBeFunction()
expectTypeOf(setImmutable).parameters.toEqualTypeOf<[any?, any?, any?, any?]>()

expectTypeOf(setImmutable).toBeCallableWith({}, 'a.b.c', 1)
expectTypeOf(setImmutable).toBeCallableWith({}, ['a', 'b', 'c'], 1)
expectTypeOf(setImmutable).toBeCallableWith([], '[0].people.[1]', {})
expectTypeOf(setImmutable).toBeCallableWith({}, 'a.b.c', 1, (objValue: unknown, key: unknown) => ({}))

// -- map(object, mapping) ----------------------------------------------------

expectTypeOf(map).toBeFunction()
expectTypeOf(map).parameters.toEqualTypeOf<[any?, any?]>()

expectTypeOf(map).toBeCallableWith({}, [
  [['a', 'b', 'c'], 1],
  ['a.b.d', 2]
])
expectTypeOf(map).toBeCallableWith({}, (set: (...args: unknown[]) => unknown) => {
  set(['a', 'b', 'c'], 1)
})

// -- clone(value) -------------------------------------------------------------

expectTypeOf(clone).toBeFunction()
expectTypeOf(clone).parameters.toEqualTypeOf<[any?, any?]>()
expectTypeOf(clone).toBeCallableWith({})
