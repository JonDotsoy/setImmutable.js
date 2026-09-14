import toPath = require('./to-path')

function get (obj: any, path: string | readonly (string | number)[]): any {
  return toPath(path).reduce((acc: any, key: string | number) => {
    return (acc == null) ? undefined : acc[key]
  }, obj)
}

export = get
