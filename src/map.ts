import set = require('./setImmutable')
import decomposeModule = require('decompose.js')
import type { SetImmutableResult } from './path-types'

const { decompose } = decomposeModule

/**
 * Path-aware return-type inference for map's "array of [path, value]
 * pairs" syntax (see README's "TypeScript" section) -- folds
 * SetImmutableResult over each pair in order, the same way the runtime
 * reduce() above applies them one at a time. Only this syntax is typed:
 * the two function-based syntaxes (`set => { ... }` and `set => ({...})`)
 * can't be typed the same way -- there's no way to statically track
 * which paths a callback's `set()` calls will report at runtime -- so
 * they stay `any` via the separate overload below.
 */
type MapPairs<T, Pairs extends readonly (readonly [any, any])[]> =
  Pairs extends readonly [infer Head, ...infer Rest]
    ? Head extends readonly [infer P extends string | readonly (string | number)[], infer V]
      ? Rest extends readonly (readonly [any, any])[]
        ? MapPairs<SetImmutableResult<T, P, V>, Rest>
        : SetImmutableResult<T, P, V>
      : T
    : T

function mapSetImmutable<T, Pairs extends readonly (readonly [any, any])[]> (
  objArg: T,
  mapping: Pairs
): MapPairs<T, Pairs>
function mapSetImmutable<T> (
  objArg: T,
  mapping: (set: (...args: any[]) => any) => any
): any
function mapSetImmutable (objArg: any, mapping: any): any {
  if (Array.isArray(mapping)) {
    return [objArg, ...mapping].reduce((currentObj: any, [ path, value ]: [any, any]) => {
      return set(currentObj, path, value)
    })
  } else if (typeof (mapping) === 'function') {
    const nextMapping: any[] = []
    const setteable = Symbol('setteable')

    const refund = mapping((...arg: any[]) => { nextMapping.push(arg); return setteable })

    if (Object(refund) !== refund) {
      return mapSetImmutable(objArg, nextMapping)
    } else {
      return mapSetImmutable(objArg,
        decompose(refund)
        // Filter only sets content
        .filter(([, content]: [any, any]) => content === setteable)
        // Join the path and new content
        .map(([path]: [any, any]) => ([path, nextMapping.shift()[0]]))
      )
    }
  }
}

export = mapSetImmutable
