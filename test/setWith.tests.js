const setWith = require('../src/setWith')
const expect = require('expect.js')

describe('setWith', () => {
  describe('path parsing', () => {
    it('creates a nested path from a dot-separated string', () => {
      const obj = {}
      setWith(obj, 'a.b.c', 1)
      expect(obj.a.b.c).to.be(1)
    })

    it('accepts a single top-level key with no dots', () => {
      const obj = {}
      setWith(obj, 'a', 1)
      expect(obj.a).to.be(1)
    })

    it('creates a 5-level-deep path', () => {
      const obj = {}
      setWith(obj, 'a.b.c.d.e', 1)
      expect(obj.a.b.c.d.e).to.be(1)
    })

    it('accepts an array path, taking each entry as a literal key', () => {
      const obj = {}
      setWith(obj, ['a', 'b'], 2)
      expect(obj.a.b).to.be(2)
    })

    it('does not split a dotted key inside an array path', () => {
      const obj = {}
      setWith(obj, ['a', 'x.y'], 1)
      expect(obj.a['x.y']).to.be(1)
      expect(obj.a.x).to.be(undefined)
    })

    it('accepts a numeric index inside an array path', () => {
      const obj = {}
      setWith(obj, ['people', 0, 'name'], 'Ana')
      expect(obj.people[0].name).to.be('Ana')
      expect(Array.isArray(obj.people)).to.be(true)
    })

    it('parses a bracket-only index path', () => {
      const obj = []
      setWith(obj, '[0][1]', 'x')
      expect(obj[0][1]).to.be('x')
    })

    it('parses a path mixing dot and bracket-index segments', () => {
      const obj = []
      setWith(obj, '[0].people.[1].firstName', 'Lucky')
      expect(obj[0].people[1].firstName).to.be('Lucky')
    })

    it('updates an existing array element via a bracket suffix', () => {
      const obj = { list: [1, 2, 3] }
      setWith(obj, 'list[1]', 99)
      expect(obj.list).to.eql([1, 99, 3])
    })

    it('creates a sparse array when a numeric segment has no existing value', () => {
      const obj = {}
      setWith(obj, 'a[2].b', 1)
      expect(Array.isArray(obj.a)).to.be(true)
      expect(obj.a.length).to.be(3)
      expect(obj.a[0]).to.be(undefined)
      expect(obj.a[1]).to.be(undefined)
      expect(obj.a[2].b).to.be(1)
    })

    it('reads a single-quoted bracket key literally, unescaping backslashes', () => {
      const obj = {}
      setWith(obj, "a['it\\'s']", 1)
      expect(obj.a["it's"]).to.be(1)
    })

    it('reads a double-quoted bracket key literally', () => {
      const obj = {}
      setWith(obj, 'a["b.c"]', 1)
      expect(obj.a['b.c']).to.be(1)
    })

    it('treats a leading dot as an empty first segment', () => {
      const obj = {}
      setWith(obj, '.a', 1)
      expect(obj[''].a).to.be(1)
    })
  })

  describe('structural behavior', () => {
    it('mutates the given object in place and returns it', () => {
      const obj = {}
      const result = setWith(obj, 'a.b', 1)
      expect(result).to.be(obj)
      expect(obj.a.b).to.be(1)
    })

    it('reuses an existing object node instead of replacing it', () => {
      const inner = { existing: true }
      const obj = { a: inner }
      setWith(obj, 'a.b', 1)
      expect(obj.a).to.be(inner)
      expect(obj.a.existing).to.be(true)
      expect(obj.a.b).to.be(1)
    })

    it('overwrites a non-object node found where the next segment expects a container', () => {
      const obj = { a: 'not-an-object' }
      setWith(obj, 'a.b', 1)
      expect(obj.a).to.eql({ b: 1 })
    })

    it('does nothing and returns the value as-is for non-object input', () => {
      expect(setWith(1, 'a', 2)).to.be(1)
      expect(setWith(null, 'a', 2)).to.be(null)
      expect(setWith(undefined, 'a', 2)).to.be(undefined)
      expect(setWith('str', 'a', 2)).to.be('str')
    })

    it('overwrites the leaf value even when one already exists', () => {
      const obj = { a: { b: 1 } }
      setWith(obj, 'a.b', 2)
      expect(obj.a.b).to.be(2)
    })
  })

  describe('customizer', () => {
    it('is called with (objValue, key, nested) for every non-leaf segment', () => {
      const calls = []
      const obj = { a: { b: 1 } }

      setWith(obj, 'a.b', 2, (objValue, key, nested) => {
        calls.push([objValue, key, nested])
        return undefined
      })

      expect(calls.length).to.be(1)
      expect(calls[0][0]).to.be(obj.a)
      expect(calls[0][1]).to.be('a')
      expect(calls[0][2]).to.be(obj)
    })

    it('is not called for the final (leaf) segment', () => {
      let calls = 0
      setWith({}, 'a', 1, () => { calls++; return undefined })
      expect(calls).to.be(0)
    })

    it('uses the customizer return value verbatim when defined', () => {
      const tag = { custom: true }
      const obj = {}
      setWith(obj, 'a.b', 1, () => tag)
      expect(obj.a).to.be(tag)
      expect(obj.a.b).to.be(1)
    })

    it('falls back to default node creation when the customizer returns undefined', () => {
      const obj = {}
      setWith(obj, 'a.b', 1, () => undefined)
      expect(obj.a).to.eql({ b: 1 })
    })

    it('falls back to an array when the next path segment is an index', () => {
      const obj = {}
      setWith(obj, 'a.0', 1, () => undefined)
      expect(Array.isArray(obj.a)).to.be(true)
    })
  })

  describe('prototype-pollution guard', () => {
    it('leaves Object.prototype untouched for a "__proto__" dot path', () => {
      setWith({}, '__proto__.polluted', 'yes')
      expect(({}).polluted).to.be(undefined)
    })

    it('leaves Object.prototype untouched for a ["constructor", "prototype", key] array path', () => {
      setWith({}, ['constructor', 'prototype', 'polluted'], 'yes')
      expect(({}).polluted).to.be(undefined)
    })

    it('returns the object unchanged (no-op) when the path contains an unsafe key', () => {
      const obj = { a: 1 }
      const result = setWith(obj, '__proto__.x', 'yes')
      expect(result).to.be(obj)
      expect(obj).to.eql({ a: 1 })
    })

    it('aborts before assigning when the unsafe key is the final segment', () => {
      const obj = {}
      setWith(obj, 'a.__proto__', { polluted: true })
      // Segments walked before the unsafe one are still created (same as
      // lodash's own guard), but the unsafe segment itself is never assigned.
      expect(obj.a).to.eql({})
      expect(Object.prototype.polluted).to.be(undefined)
    })
  })
})
