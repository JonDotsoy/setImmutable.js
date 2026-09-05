/**
 * Type-level tests for setimmutable's public API, run with `tsc --noEmit`
 * (see `npm run test:types`). These do not execute at runtime -- every
 * assertion is checked by the compiler.
 *
 * The library ships as plain, untyped JavaScript (no .d.ts / JSDoc types),
 * so TypeScript currently infers every parameter and return type as `any`.
 * That means several assertions below only document the *intended* shape
 * of the API and are expected to keep passing trivially until real types
 * are added -- at that point they'll start catching real regressions.
 */
import {expectTypeOf} from 'expect-type'
import setImmutable from '../src/setImmutable'
import map from '../src/map'
import clone from '../src/clone'

// -- set(object, path, value, [customClone]) --------------------------------

expectTypeOf(setImmutable).toBeFunction()

// object, path (string or array) and value are required.
expectTypeOf(setImmutable).toBeCallableWith({}, 'a.b.c', 1)
expectTypeOf(setImmutable).toBeCallableWith({}, ['a', 'b', 'c'], 1)
expectTypeOf(setImmutable).toBeCallableWith([], '[0].people.[1]', {})

// customClone is optional.
expectTypeOf(setImmutable).toBeCallableWith({}, 'a.b.c', 1, (objValue: unknown, key: unknown) => ({}))

// -- map(object, mapping) ----------------------------------------------------

expectTypeOf(map).toBeFunction()

// Syntax 1: an array of [path, value] pairs.
expectTypeOf(map).toBeCallableWith({}, [
  [['a', 'b', 'c'], 1],
  ['a.b.d', 2]
])

// Syntax 2 & 3: a mapper function.
expectTypeOf(map).toBeCallableWith({}, (set: (...args: unknown[]) => unknown) => {
  set(['a', 'b', 'c'], 1)
})
expectTypeOf(map).toBeCallableWith({}, (set: (value: unknown) => unknown) => ({
  a: {b: {c: set(1)}}
}))

// -- clone(value) -------------------------------------------------------------

expectTypeOf(clone).toBeFunction()
expectTypeOf(clone).toBeCallableWith({})
