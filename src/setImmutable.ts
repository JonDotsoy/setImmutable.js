import setWith = require('lodash.setwith')
import defaultCloneObject = require('./clone')

type CustomizerCloneObject = (objValue: any, srcValue: any) => any

/**
 * Path-aware return-type inference -- see README's "TypeScript" section
 * for the design and its known limits. Covers the two path forms whose
 * keys resolve statically (dot-separated strings and arrays of keys).
 * Bracket/numeric-index paths in string form (e.g. "list[1]", "a[2].b")
 * aren't parsed here -- they'd need real bracket parsing in Split below,
 * which is a separate, harder piece of work -- and a customClone that
 * changes the constructor along the way can't be typed at all, so both
 * fall back to `any` via the Path type param's constraint.
 */

type Split<S extends string, D extends string> =
  S extends `${infer Head}${D}${infer Rest}`
    ? [Head, ...Split<Rest, D>]
    : [S]

type PathTuple<P> =
  P extends string ? Split<P, '.'> :
  P extends readonly (string | number)[] ? P :
  never

type SetPath<T, Path extends readonly (string | number)[], V> =
  Path extends readonly [infer Head, ...infer Rest]
    ? Head extends string | number
      ? Rest extends readonly (string | number)[]
        ? Rest['length'] extends 0
          ? T extends readonly unknown[]
            ? { [K in keyof T]: K extends `${Head & (number | string)}` ? V : T[K] }
            : Omit<T, Head extends keyof T ? Head : never> & Record<Head, V>
          : T extends readonly unknown[]
            ? { [K in keyof T]: K extends `${Head & (number | string)}` ? SetPath<T[K], Rest, V> : T[K] }
            : Head extends keyof T
              ? Omit<T, Head> & Record<Head, SetPath<T[Head], Rest, V>>
              : Record<Head, SetPath<unknown, Rest, V>>
        : never
      : never
    : T

type SetImmutableResult<T, P extends string | readonly (string | number)[], V> =
  SetPath<T, PathTuple<P>, V>

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

export = setImmutable
