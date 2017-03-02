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

    it.skip('Syntax 3', () => {

      const c = {}
      const e = {}

      const myObj = {
        a:{
          b: {
            c,
            e
          }
        }
      }

      const n = {
        l: 4
      }

      const newObj = map(myObj, set => ({
        a: {
          b: {
            c: set(n)
          },
          l: {
            o: {
              t: set(n)
            }
          }
        }
      }))


      expect(newObj.a.b.c).not.to.be(myObj.a.b.c)
      expect(newObj.a.b).not.to.be(myObj.a.b)
      expect(newObj.a).not.to.be(myObj.a)
      expect(newObj).not.to.be(myObj)
      expect(newObj.a.b.e).to.be(myObj.a.b.e)

    })

  })
})

