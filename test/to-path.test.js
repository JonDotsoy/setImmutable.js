const toPath = require('../src/to-path')
const expect = require('expect.js')

describe('toPath', () => {
  describe('dot-separated strings', () => {
    it('a', () => {
      expect(toPath('a')).to.eql(['a'])
    })

    it('a.b', () => {
      expect(toPath('a.b')).to.eql(['a', 'b'])
    })

    it('a.b.c', () => {
      expect(toPath('a.b.c')).to.eql(['a', 'b', 'c'])
    })

    it('a.b.c.d.e', () => {
      expect(toPath('a.b.c.d.e')).to.eql(['a', 'b', 'c', 'd', 'e'])
    })
  })

  describe('pure bracket-index strings', () => {
    it('[0]', () => {
      expect(toPath('[0]')).to.eql(['0'])
    })

    it('[0][1]', () => {
      expect(toPath('[0][1]')).to.eql(['0', '1'])
    })

    it('[0][1][2]', () => {
      expect(toPath('[0][1][2]')).to.eql(['0', '1', '2'])
    })
  })

  describe('mixed dot/bracket strings', () => {
    it('a[0].b.c', () => {
      expect(toPath('a[0].b.c')).to.eql(['a', '0', 'b', 'c'])
    })

    it('a[2].b', () => {
      expect(toPath('a[2].b')).to.eql(['a', '2', 'b'])
    })

    it('list[1]', () => {
      expect(toPath('list[1]')).to.eql(['list', '1'])
    })

    it('[0].people.[1].firstName (the exact form used in the README)', () => {
      expect(toPath('[0].people.[1].firstName')).to.eql(['0', 'people', '1', 'firstName'])
    })

    it('a[0]', () => {
      expect(toPath('a[0]')).to.eql(['a', '0'])
    })
  })

  describe('multi-digit indexes', () => {
    it('a[12].b[345]', () => {
      expect(toPath('a[12].b[345]')).to.eql(['a', '12', 'b', '345'])
    })
  })

  describe('array paths pass through untouched', () => {
    it('[\'a\', \'b\']', () => {
      expect(toPath(['a', 'b'])).to.eql(['a', 'b'])
    })

    it('[\'a\', \'x.y\'] -- the dot inside a segment is not split', () => {
      expect(toPath(['a', 'x.y'])).to.eql(['a', 'x.y'])
    })

    it('[\'people\', 0, \'name\'] -- a number segment stays a number', () => {
      const result = toPath(['people', 0, 'name'])
      expect(result).to.eql(['people', 0, 'name'])
      expect(typeof result[1]).to.be('number')
    })
  })

  describe('edge cases', () => {
    it('empty string', () => {
      expect(toPath('')).to.eql([])
    })

    it('only "." and "[" "]" act as separators, not any non-alphanumeric char', () => {
      expect(toPath('user_id.first-name')).to.eql(['user_id', 'first-name'])
    })
  })
})
