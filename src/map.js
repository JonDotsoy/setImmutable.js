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

    const refund = mapping((...arg) => { nextMapping.push(arg); return setteable })

    if (Object(refund) !== refund) {
      return mapSetImmutable(objArg, nextMapping)
    } else {
      return mapSetImmutable(objArg,
        decompose(refund)
        // Filter only sets content
        .filter(([, content]) => content === setteable)
        // Join the path and new content
        .map(([path]) => ([path, nextMapping.shift()[0]]))
      )
    }
  }
}

exports = module.exports = mapSetImmutable

