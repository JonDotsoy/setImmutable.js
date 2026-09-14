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

  it('only clones the nodes on path, keeping every other branch by reference', () => {
    const state = {
      user: {
        address: {
          city: 'Santiago',
          zip: '8320000'
        },
        payment: {
          num: '4111-1111-1111-1111',
          code: '007'
        },
        job: {
          title: 'Engineer'
        }
      },
      app: {
        theme: 'dark'
      }
    }
    deepFreeze(state)

    const nextState = setImmutable(state, 'user.payment.num', '9999-9999-9999-9999')

    // Root and every node on the path are cloned.
    expect(state).not.to.be(nextState)
    expect(state.user).not.to.be(nextState.user)
    expect(state.user.payment).not.to.be(nextState.user.payment)
    expect(state.user.payment.num).not.to.be(nextState.user.payment.num)

    // Everything else keeps its original reference (or value).
    expect(state.user.address).to.be(nextState.user.address)
    expect(state.user.payment.code).to.be(nextState.user.payment.code)
    expect(state.user.job).to.be(nextState.user.job)
    expect(state.app).to.be(nextState.app)

    // The update actually landed on the leaf.
    expect(nextState.user.payment.num).to.be('9999-9999-9999-9999')
  })

  it('clones every node on the path even when the new value equals the old one', () => {
    const a = { foo: { tar: 'biz' } }
    deepFreeze(a)

    const b = setImmutable(a, 'foo.tar', 'biz')

    // The root and every node on the path are still new objects,
    // even though the leaf value didn't actually change.
    expect(b).not.to.be(a)
    expect(b.foo).not.to.be(a.foo)

    // The leaf is a primitive, so "equal" just means "the same value" --
    // there's nothing to mutate or clone at that level.
    expect(b.foo.tar).to.be(a.foo.tar)
    expect(b.foo.tar).to.be('biz')
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

  describe('path syntax (bracket notation, sparse arrays, array-path edge cases)', () => {
    it('creates a nested path from a dot-string and returns a new object', () => {
      const original = {}
      const next = setImmutable(original, 'a.b.c', 1)

      expect(next.a.b.c).to.be(1)
      expect(next).not.to.be(original)
      expect(original).to.eql({})
    })

    it('creates an array-shaped path from pure bracket-index notation', () => {
      const original = []
      const next = setImmutable(original, '[0][1]', 'x')

      expect(next[0][1]).to.be('x')
      expect(next).not.to.be(original)
      expect(original).to.eql([])
    })

    it('accepts a mixed dot/bracket path (the exact form used in the README)', () => {
      const original = []
      const next = setImmutable(original, '[0].people.[1].firstName', 'Lucky')

      expect(next[0].people[1].firstName).to.be('Lucky')
      expect(next).not.to.be(original)
      expect(original).to.eql([])
    })

    it('accepts a numeric index inside an array path', () => {
      const original = {}
      const next = setImmutable(original, ['people', 0, 'name'], 'Ana')

      expect(next.people[0].name).to.be('Ana')
      expect(next).not.to.be(original)
      expect(original).to.eql({})
    })

    it('updates an existing array element without mutating the original', () => {
      const original = { list: [1, 2, 3] }
      deepFreeze(original)

      const next = setImmutable(original, 'list[1]', 99)

      expect(next.list).to.eql([1, 99, 3])
      expect(original.list).to.eql([1, 2, 3])
      expect(next).not.to.be(original)
      expect(next.list).not.to.be(original.list)
    })

    it('treats an array-path segment containing "." as a single key, not a nested path', () => {
      const original = {}
      const next = setImmutable(original, ['a', 'x.y'], 1)

      expect(next.a['x.y']).to.be(1)
      expect(next.a.x).to.be(undefined)
    })

    it('creates a sparse array for a numeric segment', () => {
      const original = {}
      const next = setImmutable(original, 'a[2].b', 1)

      expect(Array.isArray(next.a)).to.be(true)
      expect(next.a.length).to.be(3)
      expect(next.a[0]).to.be(undefined)
      expect(next.a[1]).to.be(undefined)
      expect(next.a[2].b).to.be(1)
    })

    it('only clones the branch it touches inside an array of objects', () => {
      const original = {
        people: [
          { id: 1, profile: { name: 'Ana' } },
          { id: 2, profile: { name: 'Beto' } },
          { id: 3, profile: { name: 'Caro' } }
        ],
        meta: { count: 3 }
      }
      deepFreeze(original)

      const next = setImmutable(original, 'people[1].profile.name', 'Beto Updated')

      expect(next.people[1].profile.name).to.be('Beto Updated')
      expect(original.people[1].profile.name).to.be('Beto')

      expect(next.people[0]).to.be(original.people[0])
      expect(next.people[2]).to.be(original.people[2])
      expect(next.meta).to.be(original.meta)

      expect(next.people[1]).not.to.be(original.people[1])
      expect(next.people[1].profile).not.to.be(original.people[1].profile)
      expect(next.people).not.to.be(original.people)
      expect(next).not.to.be(original)
    })
  })

  describe('ifChanged', () => {
    it('returns the exact same reference when the value at path is already equal', () => {
      const a = { foo: { tar: 'biz' } }
      deepFreeze(a)

      const b = setImmutable.ifChanged(a, 'foo.tar', 'biz')

      expect(b).to.be(a)
      expect(b.foo).to.be(a.foo)
    })

    it('clones normally when the value at path is different', () => {
      const a = { foo: { tar: 'biz' } }
      deepFreeze(a)

      const b = setImmutable.ifChanged(a, 'foo.tar', 'baz')

      expect(b).not.to.be(a)
      expect(b.foo).not.to.be(a.foo)
      expect(b.foo.tar).to.be('baz')
      expect(a.foo.tar).to.be('biz')
    })

    it('still honors customizerCloneObject when it does clone', () => {
      class Point {
        constructor (x, y) {
          this.x = x
          this.y = y
        }
      }

      const a = { origin: new Point(1, 2) }
      deepFreeze(a)

      function customClone (objValue, key) {
        return (objValue.constructor === Point) ? new Point(objValue.x, objValue.y) : clone(objValue)
      }

      const b = setImmutable.ifChanged(a, 'origin.x', 9, customClone)

      expect(b.origin instanceof Point).to.be(true)
      expect(b.origin.x).to.be(9)
      expect(a.origin.x).to.be(1)
    })

    it('does not clone when the path does not exist yet and val is undefined', () => {
      const a = {}
      deepFreeze(a)

      const b = setImmutable.ifChanged(a, 'a.b', undefined)

      expect(b).to.be(a)
    })

    it('treats NaN as equal to NaN (Object.is, not ===)', () => {
      const a = { a: NaN }
      deepFreeze(a)

      const b = setImmutable.ifChanged(a, 'a', NaN)

      expect(b).to.be(a)
    })
  })

  it.skip('set immutables', () => {})

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

