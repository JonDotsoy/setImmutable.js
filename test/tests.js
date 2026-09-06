require('debug').enable('tests')
const log = require('debug')('tests')
const setImmutable = require('../src/setImmutable')
const map = require('../src/map')
const clone = require('../src/clone')
const expect = require('expect.js')
const set = require('lodash.set')
const deepFreeze = require('deepfreeze')

describe('setImmutable', () => {
  it('with simple object', () => {
    const store = (
      {
        app: {
          title: 'a title',
          engine: 'browser'
        },
        people: [
          {
            name: {value: 'jna'},
            props: {
              age: 32
            }
          }
        ]
      }
    )
    deepFreeze(store)

    const nextStore = setImmutable(store, 'people.0.props.age', 30)

    expect(store).not.to.be(nextStore)
    expect(store.people).not.to.be(nextStore.people)
    expect(store.people[0]).not.to.be(nextStore.people[0])
    expect(store.people[0].props).not.to.be(nextStore.people[0].props)
    expect(store.people[0].props.age).not.to.be(nextStore.people[0].props.age)

    expect(store.app).to.be(nextStore.app)
    expect(store.app.title).to.be(nextStore.app.title)
    expect(store.app.engine).to.be(nextStore.app.engine)
    expect(store.people[0].name).to.be(nextStore.people[0].name)
  })

  it('with advance object', () => {
    class complexConstructor {
      constructor (arg1, arg2) {
        if (!arg1) throw new TypeError('require arg1')
        if (!arg2) throw new TypeError('require arg2')

        this.arg1 = arg1
        this.arg2 = arg2
      }
    }

    const originalObj = {
      prop1: {
        prop1_1: new complexConstructor({a: 1}, {b: 2})
      }
    }

    deepFreeze(originalObj)

    function customizerCloneToComplexConstructor (objValue, srcValue) {
      switch (objValue.constructor) {
        case complexConstructor: return new complexConstructor(objValue.arg1, objValue.arg2)
        default: return clone(objValue)
      }
    }

    const nextObject = setImmutable(originalObj, ['prop1', 'prop1_1', 'arg1', 'a'], 9, customizerCloneToComplexConstructor)

    expect(nextObject).not.to.be(originalObj)
    expect(nextObject.prop1.prop1_1.arg1.a).to.be(9)
    expect(nextObject.prop1).not.to.be(originalObj.prop1)
    expect(nextObject.prop1.prop1_1).not.to.be(originalObj.prop1.prop1_1)
    expect(nextObject.prop1.prop1_1.arg1).not.to.be(originalObj.prop1.prop1_1.arg1)
    expect(nextObject.prop1.prop1_1.arg1.a).not.to.be(originalObj.prop1.prop1_1.arg1.a)
    expect(nextObject.prop1.prop1_1.arg2).to.be(originalObj.prop1.prop1_1.arg2)
    expect(nextObject.prop1.prop1_1.arg2.b).to.be(originalObj.prop1.prop1_1.arg2.b)
  })

  it('with bracket/index string path', () => {
    const object = {}

    deepFreeze(object)

    const nextObject = setImmutable(object, '[0][1][2]', 'a')

    expect(nextObject).not.to.be(object)
    expect(JSON.stringify(nextObject)).to.be(JSON.stringify({ '0': [null, [null, null, 'a']] }))
    expect(Array.isArray(nextObject['0'])).to.be(true)
    expect(Array.isArray(nextObject['0'][1])).to.be(true)
    expect(nextObject['0'][1][2]).to.be('a')
  })

  it('with a path descending through a primitive value', () => {
    // `a` is a number, not an object -- there is nothing for 'a.b' to
    // descend into. The default clone leaves a primitive value as-is
    // (see `_cloneObj`), so lodash.setWith tries to assign 'b' onto that
    // primitive, which silently no-ops instead of overwriting `a` with
    // `{ b: 2 }` the way mutable `_.set` would.
    const object = { a: 1 }

    deepFreeze(object)

    const nextObject = setImmutable(object, 'a.b', 2)

    expect(nextObject).not.to.be(object)
    expect(nextObject.a).to.be(1)
    expect(nextObject.a.b).to.be(undefined)
  })

  it('with customClone replacing a primitive value to allow the path to continue', () => {
    // Same starting point as the previous test (`a` is a number), but this
    // customClone opts a primitive into becoming an object, so 'a.b' has
    // somewhere to land instead of silently no-oping.
    const object = { a: 1 }

    deepFreeze(object)

    function customClone (objValue, srcValue) {
      if (typeof objValue === 'number') return {}
      return clone(objValue, srcValue)
    }

    const nextObject = setImmutable(object, 'a.b', 2, customClone)

    expect(nextObject).not.to.be(object)
    expect(nextObject.a).not.to.be(1)
    expect(nextObject.a.b).to.be(2)
    expect(object.a).to.be(1)
  })

  describe('mapping set immutables', () => {
    it('Syntax 1', () => {
      const prevObj = {}

      const nextObj = map(prevObj, [
        [ ['a', 'b', 'c'],      1 ],
        [ 'a.b.d',              2 ],
        [ ['c', 'a', 'b', 'c'], 3 ]
      ])

      expect(nextObj).not.to.be(prevObj)
      expect(() => {
        expect(nextObj.a.b.c).to.be(1)
        expect(nextObj.a.b.d).to.be(2)
        expect(nextObj.c.a.b.c).to.be(3)
      }).not.throwError()
    })

    it('Syntax 2', () => {
      const prevObj = {}

      const nextObj = map(prevObj, set => {
        set(['a', 'b', 'c'],      1)
        set('a.b.d',              2)
        set(['c', 'a', 'b', 'c'], 3)
        set(['d', 'e', 'a', 'b'], 4)
      })

      expect( nextObj ).not.to.be( prevObj )
      expect( nextObj.a.b.c ).to.be( 1 )
      expect( nextObj.a.b.d ).to.be( 2 )
      expect( nextObj.c.a.b.c ).to.be( 3 )
      expect( nextObj.d.e.a.b ).to.be( 4 )
    })

    it('Syntax 3', () => {
      const myObj = {}

      const newObj = map(myObj, set => ({
        a: {
          b: {
            c: set(1)
          },
          l: {
            o: {
              t: set(2)
            }
          }
        }
      }))

      expect( newObj ).not.to.be( myObj )

      expect( newObj.a.b.c ).to.be( 1 )
      expect( newObj.a.l.o.t ).to.be( 2 )
    })

  })
})

