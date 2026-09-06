# SetImmutable

[lodash.set][] sets a value at a path by mutating the target object in place and returning that same reference. That is a problem anywhere state is expected to be immutable: React/Redux (and any `shouldComponentUpdate`, `useMemo`, `connect` or selector built on `===` reference checks), frozen state trees (`Object.freeze`), time-travel/undo history, and change detection that compares object identity instead of deep-diffing on every update.

**SetImmutable** performs the update as a persistent (structural-sharing) operation instead: it walks `path`, and for each node it visits it clones just that node and reassigns the property, then returns a **new root object**. Every object *not* on `path` keeps its original reference, so the result is a shallow copy at each level of the path and the same object everywhere else — cheaper than a deep clone, and `===` on unrelated branches still holds.

## Features

- **Immutable, structural-sharing updates** — [`set(object, path, value)`](#setobject-path-value-customclone) never mutates `object`. It clones only the nodes on `path` (root included) and returns a new tree; every branch not on `path` keeps its original reference, including through a frozen (`Object.freeze`) root. See [Mutable Vs. Immutable](#mutable-vs-immutable).
- **Two path forms** — a dot-separated string (`'a.b.c'`) or an array of keys (`['a', 'b', 'c']`). Path parsing (splitting, and bracket/index syntax like `'[0][1]'`) is delegated to `lodash.setWith`, so index-like segments create arrays rather than plain objects — see [Example 1](#setobject-path-value-customclone).
- **Missing intermediate segments are created**, as a plain object or an array (index-like next segment), same as `_.set`.
- **Existing-but-non-object segments are left as-is, and the rest of that branch of `path` is silently dropped** — e.g. `set({ a: 1 }, 'a.b', 2)` returns a clone with `a` still `1`; there is nothing for `'b'` to clone into, so unlike mutable `_.set` (which overwrites `a` with `{ b: 2 }`), the assignment is a no-op past that point. Neither `customClone` nor the default `clone` is called for a non-object value — see the `[customClone]` argument below.
- **Custom cloning for complex constructors** — an optional `customClone(objValue, key)` argument, called for every existing *object* node on `path` (except the leaf), to control how that node is cloned instead of the [default `clone`](#clonevalue). See [SetImmutable with complex constructors](#setimmutable-with-complex-constructors).
- **Batched updates** via [`map(object, mapping)`](#mapobject-mapping) — apply several `set` calls to `object` in one pass, in any of three syntaxes (array of `[path, value]` pairs, a `set => {...}` callback, or a `set => (object literal)` callback).
- **Path-aware TypeScript inference** — `set` and `map`'s array-of-pairs syntax are generic over `path`, so the compiler resolves the real shape of the result and catches a wrong value type at the exact key being set. This is only visible building from source (`src/*.ts`); the published package ships as untyped plain JS. See [TypeScript](#typescript) for its known limits (bracket/index string paths, `customClone`, and a 31-level path-depth ceiling).

## Installation
Using npm:

    npm install --save setimmutable

In Node.js:

```javascript
import set from 'setimmutable'
// or, from CommonJS:
// const set = require('setimmutable')
```

`map` and `clone` are separate subpaths, resolvable the same way with either `import` or `require` — `import map from 'setimmutable/map'`, `const clone = require('setimmutable/clone')`, etc. (`package.json`'s `"exports"` map is what makes the extension-less `import` form resolve; without it, Node's ESM resolver — unlike `require()` — won't infer `.js` on a bare subpath specifier).


## Mutable Vs. Immutable
`_.set(object, path, value)` walks `path` on the object you pass in and assigns `value` directly onto it (creating intermediate objects/arrays only where they're missing), then returns that same reference. If the targeted property is non-writable — e.g. `object` itself was passed through `Object.freeze` — the assignment is a silent no-op: no error, no update, and `_.set`'s return value is still `=== object`.

That silent failure gets worse one level down: `Object.freeze` is **shallow**. It locks `object`'s own properties, but any object *referenced* by those properties is still fully mutable. So freezing the root of a state tree does not protect the rest of the tree — `_.set(frozenRoot, 'a.b', value)` reaches through `frozenRoot.a` (unfrozen) and mutates `b` on it successfully, silently invalidating the "immutable" guarantee callers assumed the freeze gave them.

`setImmutable(object, path, value)` never assigns into `object`. Starting at the root, it clones each node it needs to descend through (see [Clone](#setimmutable-with-complex-constructors) below), sets `value` on the clone, and returns that new tree — so the result is always a distinct object, whether or not anything on `path` was frozen, and every branch not on `path` still keeps its original reference.

```javascript
import set from 'lodash.set'
import setImmutable from 'setimmutable'

// Mutable: silently mutates in place, still returns the same reference.
const mutableObj = Object.freeze({ a: { b: 1 } })
const nextObjMutable = set(mutableObj, 'a.b', 3)

nextObjMutable === mutableObj // true
mutableObj.a.b                // 3 -- mutated in place, despite the freeze

// Immutable: always returns a new tree, original is untouched.
const immutableObj = Object.freeze({ a: { b: 1 } })
const nextObjImmutable = setImmutable(immutableObj, 'a.b', 3)

nextObjImmutable === immutableObj // false
immutableObj.a.b                  // 1 -- unchanged
```

## SetImmutable with complex constructors
To update the object tree is used the reference constructor. This makes a new object and assigns all old properties to the new object. But there are times when the constructor is complex and requires special properties to be declared.

```javascript
// Simple Constructor
class SimpleConstructor {
    constructor() { /* ... */ }
}

// Complex Constructor
class ComplexConstructor {
    constructor(requiredArg, especialArg) { /* ... */ }
}
```

**SetImmutable** load the custom Clone to make a new object.

**Example:**

```javascript
import clone from 'setimmutable/clone'

function customClone (objValue, srcValue) {
    switch (objValue.constructor) {
        // My custom class
        case MyClass: return MyClass.parse(objValue) // Return new object instance of MyClass
        // My second custom class
        case MySecondClass: return new MySecondClass(...myArgs) // Return new object instance of MySecondClass
        // Set default clone
        default: return clone(objValue)
    }
}

setImmutable(originalObject, path, newValue, customClone)
```

## API

### `set(object, path, value, [customClone])`
Sets `value` at `path` of `object`. If a portion of `path` doesn't exist, it's created as a plain object (or an array, if the next path segment is an index) — same as `_.set`.

**Note:** This method does not mutate `object`. It clones every node on `path` (root included) and returns that new tree; anything not reachable via `path` keeps its original reference.

**Arguments**

- **object (*Object*)**: The object to read from. Never mutated.
- **path (*Array*|*string*)**: The path of the property to set.
- **value (*)**: The value to set.
- **[customClone] (*Function*)**: `(objValue, key) => Object`, called for every existing object on `path` except the leaf — `objValue` is the current value at that node, `key` the property name about to be assigned in the clone. Return the object to clone into. Only called when `objValue` already exists as an object; missing intermediate segments are always created as a plain object/array regardless of `customClone`. Defaults to [`clone`](#clonevalue) below.

**Returns**

- ***(Object)***: The updated (new) object.

**Example 1 (on [RunKit](https://runkit.com/jondotsoy/setimmutable-example-1))**

```javascript
const object = {}

set(object, '[0][1][2]', 'a')
// => { '0': [ null, [ null, null, 'a' ] ] }
```

**Example 2 (on [RunKit](https://runkit.com/jondotsoy/setimmutable-example-2))**

```javascript
// import clone from 'setimmutable/clone'

const object = []

function customClone (objValue, key) {
    switch (objValue.constructor) {
        case Person: return Person.clone(objValue)
        /* ... */
        /* default: return clone(objValue) */
    }
}

set(object, '[0].people.[1].firstName', 'Lucky', customClone)
// => [ { 'people': [..., Person { 'firstName': 'Lucky' } ] } ]
```

### `clone(value)`
The default per-node clone used by `set` when no `customClone` is given: `import clone from 'setimmutable/clone'`. Returns a new, empty instance of `value.constructor` (`new value.constructor()`, or a plain `{}` if `value` has no constructor) — it does **not** copy `value`'s own properties; `set` does that separately with `Object.assign` after cloning. A custom clone function typically falls back to this for constructors it doesn't special-case (see Example 2 above and [SetImmutable with complex constructors](#setimmutable-with-complex-constructors)).

**Arguments**

- **value (*Object*)**: The object whose constructor to instantiate.

**Returns**

- ***(Object)***: A new, empty instance of `value`'s constructor.

### `map(object, mapping)`
Applies several `set` updates to `object` in a single call: `import map from 'setimmutable/map'`. `object` is still never mutated. `mapping` accepts three shapes:

**1. An array of `[path, value]` pairs** — each pair is applied in order with `set`, so a later path can see the result of an earlier one.

```javascript
import map from 'setimmutable/map'

map(object, [
  [['a', 'b', 'c'], 1],
  ['a.b.d', 2]
])
// => { a: { b: { c: 1, d: 2 } } }
```

**2. A function `set => { ... }` that calls `set(path, value)` directly** — same two-argument form as the top-level `set`, just batched. The function's return value is ignored.

```javascript
import map from 'setimmutable/map'

map(object, set => {
  set(['a', 'b', 'c'], 1)
  set('a.b.d', 2)
})
// => { a: { b: { c: 1, d: 2 } } }
```

**3. A function `set => (object literal)` that returns the shape to set** — call `set(value)` (one argument, no path) inline while building a plain object/array literal; `map` infers each value's path from where in the returned literal `set(value)` appears.

```javascript
import map from 'setimmutable/map'

map(object, set => ({
  a: {
    b: { c: set(1) },
    l: { o: { t: set(2) } }
  }
}))
// => { a: { b: { c: 1 }, l: { o: { t: 2 } } } }
```

**Arguments**

- **object (*Object*)**: The object to update.
- **mapping (*Array*|*Function*)**: An array of `[path, value]` pairs, or a mapper function using syntax 2 or 3 above.

**Returns**

- ***(Object)***: A new object with every update from `mapping` applied.


## TypeScript

The published `set`/`map`/`clone` entry points ship as plain JavaScript with no `.d.ts` — `require`/`import`ing them from the npm package still resolves every parameter and the return type to `any`, since there's no declaration file for the compiler to check `path` or the result against. The source itself (`src/*.ts`), however, is real TypeScript, and both `set` (`src/setImmutable.ts`) and `map`'s array-of-pairs syntax (`src/map.ts`) are generic and `path`-aware: they resolve the actual shape of the result at the type level, so the compiler catches a wrong value type at the exact key you're setting — this is visible if you build from source, but not yet if you consume the published package (there's no build step that emits and publishes a `.d.ts` today).

```typescript
import setImmutable from './src/setImmutable'

type A = { a: number }
const a: A = { a: 1 }

const result = setImmutable(a, 'a', 'foo')
// result: { a: string } -- inferred, not `any`

result.a.toUpperCase() // ok, TypeScript knows result.a is a string
```

Both `set` and `map`'s array-of-pairs syntax support the same two path forms, minus their bracket/index string syntax:

- **Dot-separated string paths** — `'a.b.c'`, including segments that don't exist yet on the input type (they're typed as newly created).
- **Array-of-keys paths** — `['a', 'b', 'c']`.

`map`'s array-of-pairs syntax folds this inference across every pair in order, so later pairs see the type left by earlier ones:

```typescript
import map from './src/map'

type Obj = { a: { b: number }, c: number }
const obj: Obj = { a: { b: 1 }, c: 2 }

const result = map(obj, [
  ['a.b', 'x' as string],
  [['c'], 'y' as string],
] as const)
// result: { a: { b: string }, c: string }
```

The outer array needs `as const` for TypeScript to see each entry as a real 2-tuple rather than a widened array — without it, the pairs don't decompose and the object's type passes through unchanged. `as const` also literal-narrows a plain value like `'x'` to the literal type `"x"`, which is rarely what you want; an explicit `as string` (as above) keeps it widened. `map`'s other two syntaxes (`set => { ... }` and `set => ({...})`) aren't typed at all — there's no way to statically know which paths a callback's `set()` calls will report at runtime.

**Known limits**

- **Bracket/index paths in string form aren't parsed.** `'list[1]'` or `'a[2].b'` are treated as one opaque literal key instead of indexing into an array, so the inferred type is wrong for that path form. Use the array-of-keys form (`['list', 1]`) to get real inference into arrays.
- **`customClone` isn't typed.** Since it can construct an arbitrary object at runtime, there's no way to reflect its effect on the result type; the shape at that node falls back to whatever `customClone`'s own return type is inferred as.
- **Path depth is capped by TypeScript's own recursion limit, not by the library.** The type resolves correctly up to **31 levels deep** (`'a.b.c. ... '`, 31 segments) for both path forms; a 32nd level hits TypeScript's `Type instantiation is excessively deep and possibly infinite` error. That ceiling is inherent to how the type recurses (each level wraps the recursive call in `Omit<T, K> & Record<K, ...>`, which isn't a tail call TypeScript can optimize away) — a genuinely tail-recursive type in TypeScript can go far deeper (~999 levels), but reworking `SetPath` into that shape hasn't been done here. In practice 31 levels is far beyond any object shape this library has ever been used with; the *runtime* has no such limit at any depth.
- **`map`'s two function-based syntaxes stay untyped.** Only the array-of-pairs syntax is inferred; a mapper function's `set()` calls can't be tracked statically.

## SetImmutable with [Redux][redux]

A Redux reducer must never mutate `state` and must return a **new** top-level object on every update — that's what lets `connect`/`useSelector` skip re-rendering components whose slice of the tree didn't change, by comparing references (`===`) instead of deep-diffing on every dispatch. Reaching into a nested array to update one field, by hand, without mutating anything on the way there, means manually spreading every level from the root down to that field — as the "Without SetImmutable" reducer below has to. Get one level wrong (a missed `...`, a `.map()` that mutates in place) and the mutation either doesn't show up (if you copied too much) or silently corrupts a sibling reducer relies on (if you copied too little).

`setImmutable(state, path, value)` does that walk for you, and only clones the branch actually on `path`: every other entry in `state.people`, and every other top-level key in `state`, keeps its exact original reference, so a selector reading any of that still sees `===` on the next render, same as if nothing had dispatched at all.

**With SetImmutable:**

```javascript
import set from 'setimmutable'

function Reducer (state = initialState, action) {
    switch (action.type) {
        case 'UPDATE_PERSON': {
            return set(state, ['people', action.id, 'firstName'], action.firstName)
        }
        /* ... */
    }
}
```

**Without SetImmutable:**
```javascript
function Reducer (state = initialState, action) {
  switch (action.type) {
    case 'UPDATE_PERSON': {
      return {
        ...state,
        people: state.people.map((person, index) => {
          if (person.id === action.id) {
            return {
              ...state.people[index],
              firstName: action.firstName
            }
          } else {
            return person
          }
        })
      }
    }
    /* ... */
  }
}
```



[lodash.set]: https://lodash.com/docs#set "_.set(object, path, value)"
[redux]: http://redux.js.org/ "Redux is a predictable state container for JavaScript apps."
