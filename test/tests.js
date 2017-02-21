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
      constructor(arg1, arg2) {
        if (!arg1) throw new TypeError('require arg1')
        if (!arg2) throw new TypeError('require arg2')

        this.arg1 = arg1
        this.arg2 = arg2
      }
    }

    const originalObj = {
      prop1:{
        prop1_1: new complexConstructor({a:1},{b:2})
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



  it.skip('mapping set immutables', () => {

    
    
  })



})


