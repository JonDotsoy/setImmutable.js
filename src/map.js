const set = require('./setImmutable')

function mapSetImmutable (obj, mapping) {

  if (Array.isArray(mapping)) {
    return [obj, ...mapping].reduce((currentObj, [ path, value ] ) => {
      return set(currentObj, path, value)
    })
  } else if ('function' === typeof mapping) {
    let currentObj = obj

    mapping((...args) => {
      let path
      let value

      if (args.length > 2) {
        value = args.pop()
        path = args
      } else {
        [path, value] = args
      }

      currentObj = set(currentObj, path, value)

      return currentObj
    })

    return currentObj
  }

}


exports = module.exports = mapSetImmutable

