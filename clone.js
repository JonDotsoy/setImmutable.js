function defaultCloneObject (objValue, srcValue) {
  return (objValue.constructor)
    ? new (objValue.constructor)()
    : {}
}

exports = module.exports = defaultCloneObject
