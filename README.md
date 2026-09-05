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
Sets the value at path of object. If a portion of path doesn't exist, it's created.

**Note:** This not method mutates object. It re-create the object defined on the path.

**Arguments**

- **object (*Object*)**: The object to modify.
- **path (*Array*|*string*)**: The path of the property to set.
- **value (*)**: The value to set.
- **[customClone] (*Function*)**: The function to customize clone object.

**Returns**

- ***(Object)***: Return object.

**Example 1 (on [RunKit](https://runkit.com/jondotsoy/setimmutable-example-1))**

```javascript
const object = {}

set(object, '[0][1][2]', 'a')
// => { '0': { '1': {'2': 'a' } } }
```

**Example 2 (on [RunKit](https://runkit.com/jondotsoy/setimmutable-example-2))**

```javascript
const object = []

function customClone (objValue, srcValue) {
    switch (objValue.constructor) {
        case Person: return Person.clone(objValue)
        /* ... */
        /* default: return require('setimmutable/clone')(objValue) */
    }
}

set(object, '[0].people.[1].firstName', 'Lucky', customClone)
// => [ { 'people': [..., Person { 'firstName': 'Lucky' } ] } ]
```


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
