import setWith = require('./set-with')
import get = require('./get')
import defaultCloneObject = require('./clone')
import type { SetImmutableResult } from './path-types'

type CustomizerCloneObject = (objValue: any, srcValue: any) => any

function _cloneObj (objValue: any, srcValue?: any, customizerCloneObject?: CustomizerCloneObject): any {
  if (objValue instanceof Object) {
    const newBaseObject = (customizerCloneObject instanceof Function)
      ? customizerCloneObject(objValue, srcValue)
      : defaultCloneObject(objValue, srcValue)

    return Object.assign(newBaseObject, objValue)
  } else {
    return objValue
  }
}

function setImmutable<T, P extends string | readonly (string | number)[], V> (
  obj: T,
  path: P,
  val: V,
  customizerCloneObject?: CustomizerCloneObject
): SetImmutableResult<T, P, V> {
  return setWith(_cloneObj(obj), path, val,
    (objValue: any, srcValue: any) => {
      return _cloneObj(objValue, srcValue, customizerCloneObject)
    }
  )
}

setImmutable.ifChanged = function ifChanged<T, P extends string | readonly (string | number)[], V> (
  obj: T,
  path: P,
  val: V,
  customizerCloneObject?: CustomizerCloneObject
): SetImmutableResult<T, P, V> {
  if (Object.is(get(obj, path), val)) {
    return obj as SetImmutableResult<T, P, V>
  }

  return setImmutable(obj, path, val, customizerCloneObject)
}

export = setImmutable
