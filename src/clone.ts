function defaultCloneObject (objValue: any, srcValue?: any): any {
  return (objValue.constructor)
    ? new (objValue.constructor)()
    : {}
}

export = defaultCloneObject
