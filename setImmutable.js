const setWith = require('lodash.setwith')
const defaultCloneObject = require('./clone')

function _cloneObj (objValue, srcValue, customizerCloneObject) {
  if (objValue instanceof Object) {
    const newBaseObject = (customizerCloneObject instanceof Function)
      ? customizerCloneObject(objValue, srcValue)
      : defaultCloneObject(objValue, srcValue)

    return Object.assign(newBaseObject, objValue)
  } else {
    return objValue
  }
}

function setImmutable (obj, path, val, customizerCloneObject) {
  return setWith(_cloneObj(obj), path, val,
    (objValue, srcValue) => {
      return _cloneObj(objValue, srcValue, customizerCloneObject)
    }
  )
}

exports = module.exports = setImmutable
