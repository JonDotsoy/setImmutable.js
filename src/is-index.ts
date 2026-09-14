function isIndexKey (key: string | number): boolean {
  if (typeof key === 'number') return Number.isInteger(key) && key >= 0
  return /^(0|[1-9]\d*)$/.test(key)
}

export = isIndexKey
