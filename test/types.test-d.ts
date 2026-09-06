/**
 * Type-level tests for setimmutable's public API, run with `tsc --noEmit`
 * (see `npm run test:types`). These do not execute at runtime -- every
 * assertion is checked by the compiler.
 *
 * The source (src/*.ts) is real TypeScript, but every value it works
 * with is still typed `any` -- setImmutable isn't generic over its
 * input yet, so `.returns` and most parameter positions stay `any`
 * below on purpose. The `.parameters` checks lock in today's actual
 * arity and optionality (including which parameters are genuinely
 * optional), so an accidental signature change fails right away.
 */
import {expectTypeOf} from 'expect-type'
import setImmutable from '../src/setImmutable'
import map from '../src/map'
import clone from '../src/clone'

// -- set(object, path, value, [customClone]) --------------------------------

expectTypeOf(setImmutable).toBeFunction()

// Input: object, path, value are required; customClone is the only
// genuinely optional parameter.
expectTypeOf(setImmutable).parameters.toEqualTypeOf<[any, any, any, ((objValue: any, srcValue: any) => any)?]>()

expectTypeOf(setImmutable).toBeCallableWith({}, 'a.b.c', 1)
expectTypeOf(setImmutable).toBeCallableWith({}, ['a', 'b', 'c'], 1)
expectTypeOf(setImmutable).toBeCallableWith([], '[0].people.[1]', {})
expectTypeOf(setImmutable).toBeCallableWith({}, 'a.b.c', 1, (objValue: unknown, key: unknown) => ({}))

// customClone itself: called with (objValue, key), must return the object
// to clone into (see the API docs in README.md).
type CustomClone = NonNullable<Parameters<typeof setImmutable>[3]>
expectTypeOf<CustomClone>().toBeCallableWith({}, 'a')

// Output: still `any` -- should become "the same shape as `object`" once
// setImmutable is generic over its input.
expectTypeOf(setImmutable).returns.toBeAny()

// -- map(object, mapping) ----------------------------------------------------

expectTypeOf(map).toBeFunction()
expectTypeOf(map).parameters.toEqualTypeOf<[any, any]>()

// Syntax 1: an array of [path, value] pairs.
expectTypeOf(map).toBeCallableWith({}, [
  [['a', 'b', 'c'], 1],
  ['a.b.d', 2]
])

// Syntax 2: a mapper function that calls set(path, value) directly.
expectTypeOf(map).toBeCallableWith({}, (set: (...args: unknown[]) => unknown) => {
  set(['a', 'b', 'c'], 1)
})

// Syntax 3: a mapper function that returns the shape to set, using
// set(value) (one argument, no path) inline.
expectTypeOf(map).toBeCallableWith({}, (set: (value: unknown) => unknown) => ({
  a: {b: {c: set(1)}}
}))

// Output: still `any` for the same reason as set()'s return above.
expectTypeOf(map).returns.toBeAny()

// -- clone(value) -------------------------------------------------------------

expectTypeOf(clone).toBeFunction()
expectTypeOf(clone).parameters.toEqualTypeOf<[any, any?]>()
expectTypeOf(clone).toBeCallableWith({})

// Output: should become "a new, empty instance of value's constructor"
// once clone is typed -- currently `any`.
expectTypeOf(clone).returns.toBeAny()
