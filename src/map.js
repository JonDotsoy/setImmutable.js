const set = require('./setImmutable')

function mapSetImmutable (objArg, mapping) {
  if (Array.isArray(mapping)) {
    return [objArg, ...mapping].reduce((currentObj, [ path, value ]) => {
      return set(currentObj, path, value)
    })
  } else if (typeof (mapping) === 'function') {
    const nextMapping = []

    const r = mapping((...arg) => { nextMapping.push(arg) })

    return mapSetImmutable(objArg, nextMapping)
  }
}

exports = module.exports = mapSetImmutable

