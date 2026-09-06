import setWith = require('lodash.setwith')
import defaultCloneObject = require('./clone')
import type { SetImmutableResult } from './path-types'

type CustomizerCloneObject = (objValue: any, srcValue: any) => any

function _cloneObj (objValue: any, srcValue?: any, customizerCloneObject?: CustomizerCloneObject): any {
  if (objValue instanceof Object) {
    const newBaseObject = (customizerCloneObject instanceof Function)
      ? customizerCloneObject(objValue, srcValue)
      : defaultCloneObject(objValue, srcValue)

    return Object.assign(newBaseObject, objValue)
  }

  // objValue is a primitive (e.g. a number, string, boolean...) -- there is
  // nothing to clone into by default, so the default clone leaves it as-is
  // (see README's "Existing-but-non-object segments" feature). customClone
  // still gets a chance to replace it with an object, opting into the path
  // descending further instead of silently stopping there -- see README's
  // "SetImmutable with complex constructors" for an example.
  if (customizerCloneObject instanceof Function) {
    return customizerCloneObject(objValue, srcValue)
  }

  return objValue
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

export = setImmutable
