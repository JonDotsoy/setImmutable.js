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
 * invoked, installed the same isolated way as the other TC01/smoke-*
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
