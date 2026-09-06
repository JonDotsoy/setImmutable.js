/**
 * Type-level tests for setimmutable's public API, run with `tsc --noEmit`
 * (see `npm run test:types`). These do not execute at runtime -- every
 * assertion is checked by the compiler.
 *
 * The source (src/*.ts) is real TypeScript. `setImmutable` itself is
 * generic and path-aware (see README's "TypeScript" section for the
 * design and its known limits) -- `map` and `clone` aren't generic over
 * their input yet, so their `.returns` and most parameter positions stay
 * `any` below on purpose.
 *
 * setImmutable's assertions check the type at the targeted property
 * rather than `toEqualTypeOf` on the whole result: its return type is
 * built out of `Omit<...> & Record<...>` intersections rather than a
 * flattened object literal, and expect-type's `toEqualTypeOf` treats
 * that intersection as distinct from the equivalent flat shape even
 * though they're mutually assignable. Checking the property directly
 * tests what actually matters (the value type at the path) without
 * being sensitive to that internal representation detail.
 */
import {expectTypeOf} from 'expect-type'
import setImmutable from '../src/setImmutable'
import map from '../src/map'
import clone from '../src/clone'

// -- set(object, path, value, [customClone]) --------------------------------

expectTypeOf(setImmutable).toBeFunction()

// -- dot-separated string paths ----------------------------------------------

type A = { a: number }
const a: A = { a: 1 }

const r1 = setImmutable(a, 'a', 'foo')
expectTypeOf(r1.a).toEqualTypeOf<string>()

// multi-level: only the targeted leaf's type changes, everything else on
// the shape is preserved as-is.
type Nested = { app: { title: string }, count: number }
const nested: Nested = { app: { title: 'x' }, count: 1 }

const r2 = setImmutable(nested, 'app.title', 42)
expectTypeOf(r2.app.title).toEqualTypeOf<number>()
expectTypeOf(r2.count).toEqualTypeOf<number>()

// creating a path that doesn't exist yet on the input type.
const r3 = setImmutable({} as {}, 'a.b.c', 1)
expectTypeOf(r3.a.b.c).toEqualTypeOf<number>()

// -- array-of-keys paths ------------------------------------------------------

type People = { people: { age: number }[] }
const people: People = { people: [{ age: 1 }] }

const r4 = setImmutable(people, ['people', 0, 'age'] as const, 99)
expectTypeOf(r4.people).toEqualTypeOf<{ age: number }[]>()

// array-of-keys, creating a path that doesn't exist yet -- same
// "create missing intermediates" behavior as the dot-string form above.
const r4b = setImmutable({} as {}, ['a', 'b', 'c'] as const, 1)
expectTypeOf(r4b.a.b.c).toEqualTypeOf<number>()

// array-of-keys where one key is itself a dotted string, e.g. ['a', 'x.y']
// -- this is a SINGLE literal key "x.y", not a nested "x" -> "y" path
// (only the string-path form splits on ".", array entries never do).
type WithDottedKey = { a: Record<string, number> }
const withDottedKey: WithDottedKey = { a: { 'x.y': 1 } }

const r4c = setImmutable(withDottedKey, ['a', 'x.y'] as const, 2)
expectTypeOf(r4c.a['x.y']).toEqualTypeOf<number>()

// -- customizerCloneObject stays optional -------------------------------------

// callable without it...
expectTypeOf(setImmutable).toBeCallableWith(a, 'a', 1)
// ...and callable with it, receiving (objValue, srcValue) and returning
// the object to clone into (see README's "SetImmutable with complex
// constructors").
expectTypeOf(setImmutable).toBeCallableWith(a, 'a', 1, (objValue: unknown, srcValue: unknown) => ({}))

// -- path-depth limit (see README's "Known limits") --------------------------
//
// The generated blocks below are deliberately hand-expanded (not a
// recursive helper type) so the depth under test is exactly what's
// written, independent of whatever recursion limit building a *generator*
// type would itself run into.

// 31 levels deep resolves correctly -- the last depth that still compiles.
type Depth31Input = { k0: { k1: { k2: { k3: { k4: { k5: { k6: { k7: { k8: { k9: { k10: { k11: { k12: { k13: { k14: { k15: { k16: { k17: { k18: { k19: { k20: { k21: { k22: { k23: { k24: { k25: { k26: { k27: { k28: { k29: { k30: number } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } }
const depth31Input: Depth31Input = { k0: { k1: { k2: { k3: { k4: { k5: { k6: { k7: { k8: { k9: { k10: { k11: { k12: { k13: { k14: { k15: { k16: { k17: { k18: { k19: { k20: { k21: { k22: { k23: { k24: { k25: { k26: { k27: { k28: { k29: { k30: 1 } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } }

const rDepth31 = setImmutable(
  depth31Input,
  'k0.k1.k2.k3.k4.k5.k6.k7.k8.k9.k10.k11.k12.k13.k14.k15.k16.k17.k18.k19.k20.k21.k22.k23.k24.k25.k26.k27.k28.k29.k30',
  'x'
)
expectTypeOf(rDepth31.k0.k1.k2.k3.k4.k5.k6.k7.k8.k9.k10.k11.k12.k13.k14.k15.k16.k17.k18.k19.k20.k21.k22.k23.k24.k25.k26.k27.k28.k29.k30).toEqualTypeOf<string>()

// 32 levels deep is one past the ceiling: TypeScript itself refuses to
// resolve the type ("Type instantiation is excessively deep and possibly
// infinite"). This is expected to fail today -- @ts-expect-error locks
// that in, so if a future change to SetPath (or a TypeScript compiler
// upgrade) raises or lowers this ceiling, this line starts failing
// ("Unused '@ts-expect-error' directive") and calls it out instead of
// silently drifting.
type Depth32Input = { k0: { k1: { k2: { k3: { k4: { k5: { k6: { k7: { k8: { k9: { k10: { k11: { k12: { k13: { k14: { k15: { k16: { k17: { k18: { k19: { k20: { k21: { k22: { k23: { k24: { k25: { k26: { k27: { k28: { k29: { k30: { k31: number } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } }
const depth32Input: Depth32Input = { k0: { k1: { k2: { k3: { k4: { k5: { k6: { k7: { k8: { k9: { k10: { k11: { k12: { k13: { k14: { k15: { k16: { k17: { k18: { k19: { k20: { k21: { k22: { k23: { k24: { k25: { k26: { k27: { k28: { k29: { k30: { k31: 1 } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } }

// @ts-expect-error -- one level past the depth ceiling, see comment above
const rDepth32 = setImmutable(
  depth32Input,
  'k0.k1.k2.k3.k4.k5.k6.k7.k8.k9.k10.k11.k12.k13.k14.k15.k16.k17.k18.k19.k20.k21.k22.k23.k24.k25.k26.k27.k28.k29.k30.k31',
  'x'
)

// -- known gaps, locked in on purpose (see README's "Known limits") ---------

// Bracket/index paths in string form aren't parsed: "list[1]" is treated
// as one opaque literal key instead of indexing into the array. So the
// result gains a bogus "list[1]" key typed as the value, while `list`
// itself is left completely unchanged -- this pair of assertions
// documents today's (wrong) result on purpose, so a future fix to
// Split's bracket parsing shows up here as a deliberate, visible change
// to these expectations rather than a silent behavior change.
type ListT = { list: number[] }
const r5 = setImmutable({ list: [1, 2, 3] } as ListT, 'list[1]', 'x')

expectTypeOf(r5.list).toEqualTypeOf<number[]>()
expectTypeOf(r5['list[1]']).toEqualTypeOf<string>()

// -- map(object, mapping) ----------------------------------------------------

expectTypeOf(map).toBeFunction()

// -- Syntax 1 (array of [path, value] pairs): typed, same as set() above --
// folds SetImmutableResult over each pair in order. The outer array
// needs `as const` for MapPairs to see each entry as a 2-tuple rather
// than a widened array (without it, the pairs don't decompose and the
// object's type passes through unchanged) -- but `as const` also
// literal-narrows a plain value like 'foo' to the literal type "foo",
// so an explicit `as <Type>` on the value (as below) is how to keep it
// widened to the type that actually matters for these assertions.

// simple: a single pair.
type MapA = { a: number }
const mapA: MapA = { a: 1 }

const m1 = map(mapA, [['a', 'foo' as string]] as const)
expectTypeOf(m1.a).toEqualTypeOf<string>()

// complex: several pairs in one call, touching different (including
// nested and newly-created) paths, mixing the dot-string and
// array-of-keys forms -- later pairs see the type left by earlier ones.
// ('d.e' creating a new key alongside 'a' and 'c' -- both already on the
// object -- catches the same "creating a key drops the object's other
// properties" bug that a purely-empty-object create test wouldn't.)
type MapNested = { a: { b: number }, c: number }
const mapNested: MapNested = { a: { b: 1 }, c: 2 }

const m2 = map(mapNested, [
  ['a.b', 'x' as string],
  [['c'], 'y' as string],
  ['d.e', 1 as number]
] as const)
expectTypeOf(m2.a.b).toEqualTypeOf<string>()
expectTypeOf(m2.c).toEqualTypeOf<string>()
expectTypeOf(m2.d.e).toEqualTypeOf<number>()

// -- Syntax 2 & 3 (mapper functions): can't be typed the same way -- there's
// no way to statically know which paths a callback's set() calls will
// report at runtime, so these stay loose/any (see MapPairs's doc comment
// in src/map.ts).

// Syntax 2: a mapper function that calls set(path, value) directly.
expectTypeOf(map).toBeCallableWith({}, (set: (...args: unknown[]) => unknown) => {
  set(['a', 'b', 'c'], 1)
})

// Syntax 3: a mapper function that returns the shape to set, using
// set(value) (one argument, no path) inline.
expectTypeOf(map).toBeCallableWith({}, (set: (value: unknown) => unknown) => ({
  a: {b: {c: set(1)}}
}))

// -- clone(value) -------------------------------------------------------------

expectTypeOf(clone).toBeFunction()
expectTypeOf(clone).parameters.toEqualTypeOf<[any, any?]>()
expectTypeOf(clone).toBeCallableWith({})

// Output: should become "a new, empty instance of value's constructor"
// once clone is typed -- currently `any`.
expectTypeOf(clone).returns.toBeAny()
