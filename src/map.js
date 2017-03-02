const set = require('./setImmutable')
const {decompose} = require('decompose.js')

function mapSetImmutable (objArg, mapping) {
  if (Array.isArray(mapping)) {
    return [objArg, ...mapping].reduce((currentObj, [ path, value ]) => {
      return set(currentObj, path, value)
    })
  } else if (typeof (mapping) === 'function') {
    const nextMapping = []
    const setteable = Symbol('setteable')

    const r = mapping((...arg) => { nextMapping.push(arg); return setteable })

    if (Object(r) !== r) {
      return mapSetImmutable(objArg, nextMapping)
    } else {
      return mapSetImmutable(objArg, (decompose(r).filter(([, e]) => e === setteable).map(([path]) => ([path, nextMapping.shift()[0]]))))
    }
  }
}

exports = module.exports = mapSetImmutable

