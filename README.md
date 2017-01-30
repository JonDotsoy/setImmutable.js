# SetImmutable
An alternative to [lodash.set][] when your object necessary working with immutable objects.

## Installation
Using npm:

    npm install --save setimmutable

In Node.js:

```javascript
const set = require('setimmutable');
```

## Mutable Vs. Immutable
In a simple object when do you use `_.set` the data is updated if it is frozen nothing happens. The **SetImmutable** update the object tree until the final element to be replaced.

```javascript
// const set = require('lodash.set')
// const setImmutable = require('setimmutable')

// With mutable object
const nextObjMutable = set(originalObj, path, 3) // Update the element and return the original object.

nextObjMutable === originalObj // true

// With immutable object
const nextObjImmutable = setImmutable(originalObj, path, 3) // Update the tree element and return a new object.

nextObjImmutable === originalObj // false
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


## SetImmutable with Redux

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
          }
        })
      }
    }
    /* ... */
  }
}
```



[lodash.set]: https://lodash.com/docs#set "_.set(object, path, value)"

