function toPath (path: string | readonly (string | number)[]): (string | number)[] {
  if (Array.isArray(path)) return path.slice()

  const segments: string[] = []
  // Each match is either a "plain" segment between separators (. [ ]),
  // or a numeric index inside brackets -- the separators themselves
  // (., [, ]) are never captured, so "[0].people.[1].x" doesn't produce
  // empty segments from doubled-up separators.
  const re = /[^.[\]]+|\[(\d+)\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(path as string)) !== null) {
    segments.push(m[1] !== undefined ? m[1] : m[0])
  }
  return segments
}

export = toPath
