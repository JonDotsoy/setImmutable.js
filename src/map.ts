import set = require('./setImmutable')
import decomposeModule = require('decompose.js')

const { decompose } = decomposeModule

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
