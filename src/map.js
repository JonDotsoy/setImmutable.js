const set = require('./setImmutable')

function mapSetImmutable (obj, mapping) {

  if (Array.isArray(mapping)) {
    return [obj, ...mapping].reduce((currentObj, [ path, value ] ) => {
      return set(currentObj, path, value)
    })
  } else if ('function' === typeof mapping) {
    let currentObj = obj

    mapping((path, value) => {
      currentObj = set(currentObj, path, value)

      return currentObj
    })

    return currentObj
  }

}


exports = module.exports = mapSetImmutable

