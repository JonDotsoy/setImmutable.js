import toPath = require('./to-path')
import isIndexKey = require('./is-index')

function setWith (
  obj: any,
  path: string | readonly (string | number)[],
  val: any,
  customizer: (objValue: any, key: string | number) => any
): any {
  const segments = toPath(path)
  let node = obj

  for (let i = 0; i < segments.length; i++) {
    const key = segments[i]

    if (i === segments.length - 1) {
      node[key] = val
    } else {
      const existing = node[key]
      const container = (existing instanceof Object)
        ? customizer(existing, key)
        : (isIndexKey(segments[i + 1]) ? [] : {})

      node[key] = container
      node = container
    }
  }

  return obj
}

export = setWith
