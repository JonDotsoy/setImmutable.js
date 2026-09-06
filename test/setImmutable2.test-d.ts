/**
 * Type-level tests for setImmutable2's path-aware return-type inference
 * (see README's "TypeScript" section for the design and its known
 * limits). Run with `tsc --noEmit` (see `npm run test:types`). These do
 * not execute at runtime -- every assertion is checked by the compiler.
 *
 * Assertions check the type at the targeted property, not the whole
 * result object with `toEqualTypeOf`: setImmutable2's return type is
 * built out of `Omit<...> & Record<...>` intersections rather than a
 * flattened object literal, and expect-type's `toEqualTypeOf` treats
 * that intersection as distinct from the equivalent flat shape even
 * though they're mutually assignable. Checking the property directly
 * tests what actually matters (the value type at the path) without
 * being sensitive to that internal representation detail.
 */
import { expectTypeOf } from 'expect-type'
import setImmutable2 from '../src/setImmutable2'

// -- dot-separated string paths ----------------------------------------------

type A = { a: number }
const a: A = { a: 1 }

const r1 = setImmutable2(a, 'a', 'foo')
expectTypeOf(r1.a).toEqualTypeOf<string>()

// multi-level: only the targeted leaf's type changes, everything else on
// the shape is preserved as-is.
type Nested = { app: { title: string }, count: number }
const nested: Nested = { app: { title: 'x' }, count: 1 }

const r2 = setImmutable2(nested, 'app.title', 42)
expectTypeOf(r2.app.title).toEqualTypeOf<number>()
expectTypeOf(r2.count).toEqualTypeOf<number>()

// creating a path that doesn't exist yet on the input type.
const r3 = setImmutable2({} as {}, 'a.b.c', 1)
expectTypeOf(r3.a.b.c).toEqualTypeOf<number>()

// -- array-of-keys paths ------------------------------------------------------

type People = { people: { age: number }[] }
const people: People = { people: [{ age: 1 }] }

const r4 = setImmutable2(people, ['people', 0, 'age'] as const, 99)
expectTypeOf(r4.people).toEqualTypeOf<{ age: number }[]>()

// -- known gaps, locked in on purpose (see README's "Known limits") ---------

// Bracket/index paths in string form aren't parsed: "list[1]" is treated
// as one opaque literal key instead of indexing into the array. So the
// result gains a bogus "list[1]" key typed as the value, while `list`
// itself is left completely unchanged -- this pair of assertions
// documents today's (wrong) result on purpose, so a future fix to
// Split's bracket parsing shows up here as a deliberate, visible change
// to these expectations rather than a silent behavior change.
type ListT = { list: number[] }
const r5 = setImmutable2({ list: [1, 2, 3] } as ListT, 'list[1]', 'x')

expectTypeOf(r5.list).toEqualTypeOf<number[]>()
expectTypeOf(r5['list[1]']).toEqualTypeOf<string>()
