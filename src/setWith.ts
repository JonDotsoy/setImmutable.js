/**
 * Local replacement for the deprecated `lodash.setwith` package (see
 * https://github.com/lodash/lodash/issues/4813 -- lodash's per-method
 * packages, this one included, are no longer maintained). Reimplements
 * just the slice of lodash's `setWith` this project relies on: parsing a
 * dot/bracket path string (or taking an array path literally, key by
 * key, with no further parsing of each entry), walking/creating the
 * intermediate nodes via `customizer`, and assigning the final value.
 */

type Key = string | number

type Customizer = (objValue: any, key: Key, nested: any) => any

// Mirrors lodash's own `rePropName` / `reEscapeChar`: splits a path string
// into its dot- and bracket-index segments, unescaping quoted bracket keys.
const rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g
const reEscapeChar = /\\(\\)?/g

function stringToPath (value: string): Key[] {
  const result: Key[] = []

  if (value.charCodeAt(0) === 46 /* . */) {
    result.push('')
  }

  value.replace(rePropName, (match: string, number?: string, quote?: string, subString?: string): string => {
    result.push(quote ? subString!.replace(reEscapeChar, '$1') : (number || match))
    return match
  })

  return result
}

function castPath (path: Key | readonly Key[]): Key[] {
  return Array.isArray(path) ? path.slice() : stringToPath(String(path))
}

const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER
const reIsUint = /^(?:0|[1-9]\d*)$/

function isIndex (value: Key): boolean {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 0 && value < MAX_SAFE_INTEGER
  }
  return reIsUint.test(value) && Number(value) < MAX_SAFE_INTEGER
}

function isObject (value: any): boolean {
  const type = typeof value
  return value != null && (type === 'object' || type === 'function')
}

function assignValue (object: any, key: Key, value: any): void {
  if (key === '__proto__') {
    Object.defineProperty(object, key, { configurable: true, enumerable: true, writable: true, value })
  } else {
    object[key] = value
  }
}

function setWith (object: any, path: Key | readonly Key[], value: any, customizer?: Customizer): any {
  if (!isObject(object)) {
    return object
  }

  const pathArr = castPath(path)
  const length = pathArr.length
  const lastIndex = length - 1
  let index = -1
  let nested = object

  while (nested != null && ++index < length) {
    const key = pathArr[index]
    let newValue = value

    if (index !== lastIndex) {
      const objValue = nested[key]
      newValue = customizer ? customizer(objValue, key, nested) : undefined
      if (newValue === undefined) {
        newValue = isObject(objValue) ? objValue : (isIndex(pathArr[index + 1]) ? [] : {})
      }
    }

    assignValue(nested, key, newValue)
    nested = nested[key]
  }

  return object
}

export = setWith
