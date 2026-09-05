# SetImmutable [![Build Status](https://travis-ci.org/JonDotsoy/setImmutable.js.svg?branch=master)](https://travis-ci.org/JonDotsoy/setImmutable.js)

[lodash.set][] sets a value at a path by mutating the target object in place and returning that same reference. That is a problem anywhere state is expected to be immutable: React/Redux (and any `shouldComponentUpdate`, `useMemo`, `connect` or selector built on `===` reference checks), frozen state trees (`Object.freeze`), time-travel/undo history, and change detection that compares object identity instead of deep-diffing on every update.

**SetImmutable** performs the update as a persistent (structural-sharing) operation instead: it walks `path`, and for each node it visits it clones just that node and reassigns the property, then returns a **new root object**. Every object *not* on `path` keeps its original reference, so the result is a shallow copy at each level of the path and the same object everywhere else — cheaper than a deep clone, and `===` on unrelated branches still holds.

## Installation
Using npm:

    npm install --save setimmutable

In Node.js:

```javascript
const set = require('setimmutable');
```


## Mutable Vs. Immutable
`_.set(object, path, value)` walks `path` on the object you pass in and assigns `value` directly onto it (creating intermediate objects/arrays only where they're missing), then returns that same reference. If the targeted property is non-writable — e.g. `object` itself was passed through `Object.freeze` — the assignment is a silent no-op: no error, no update, and `_.set`'s return value is still `=== object`.

That silent failure gets worse one level down: `Object.freeze` is **shallow**. It locks `object`'s own properties, but any object *referenced* by those properties is still fully mutable. So freezing the root of a state tree does not protect the rest of the tree — `_.set(frozenRoot, 'a.b', value)` reaches through `frozenRoot.a` (unfrozen) and mutates `b` on it successfully, silently invalidating the "immutable" guarantee callers assumed the freeze gave them.

`setImmutable(object, path, value)` never assigns into `object`. Starting at the root, it clones each node it needs to descend through (see [Clone](#setimmutable-with-complex-constructors) below), sets `value` on the clone, and returns that new tree — so the result is always a distinct object, whether or not anything on `path` was frozen, and every branch not on `path` still keeps its original reference.

```javascript
const set = require('lodash.set')
const setImmutable = require('setimmutable')

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
// const clone = require('setimmutable/clone')
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
// => { '0': { '1': {'2': 'a' } } }
```

**Example 2 (on [RunKit](https://runkit.com/jondotsoy/setimmutable-example-2))**

```javascript
const object = []

function customClone (objValue, key) {
    switch (objValue.constructor) {
        case Person: return Person.clone(objValue)
        /* ... */
        /* default: return require('setimmutable/clone')(objValue) */
    }
}

set(object, '[0].people.[1].firstName', 'Lucky', customClone)
// => [ { 'people': [..., Person { 'firstName': 'Lucky' } ] } ]
```

### `clone(value)`
The default per-node clone used by `set` when no `customClone` is given: `require('setimmutable/clone')`. Returns a new, empty instance of `value.constructor` (`new value.constructor()`, or a plain `{}` if `value` has no constructor) — it does **not** copy `value`'s own properties; `set` does that separately with `Object.assign` after cloning. A custom clone function typically falls back to this for constructors it doesn't special-case (see Example 2 above and [SetImmutable with complex constructors](#setimmutable-with-complex-constructors)).

**Arguments**

- **value (*Object*)**: The object whose constructor to instantiate.

**Returns**

- ***(Object)***: A new, empty instance of `value`'s constructor.

### `map(object, mapping)`
Applies several `set` updates to `object` in a single call: `require('setimmutable/map')`. `object` is still never mutated. `mapping` accepts three shapes:

**1. An array of `[path, value]` pairs** — each pair is applied in order with `set`, so a later path can see the result of an earlier one.

```javascript
map(object, [
  [['a', 'b', 'c'], 1],
  ['a.b.d', 2]
])
// => { a: { b: { c: 1, d: 2 } } }
```

**2. A function `set => { ... }` that calls `set(path, value)` directly** — same two-argument form as the top-level `set`, just batched. The function's return value is ignored.

```javascript
map(object, set => {
  set(['a', 'b', 'c'], 1)
  set('a.b.d', 2)
})
// => { a: { b: { c: 1, d: 2 } } }
```

**3. A function `set => (object literal)` that returns the shape to set** — call `set(value)` (one argument, no path) inline while building a plain object/array literal; `map` infers each value's path from where in the returned literal `set(value)` appears.

```javascript
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


## SetImmutable with [Redux][redux]

**With SetImmutable:**

```javascript
const set = require('setimmutable')

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
