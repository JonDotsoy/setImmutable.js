/**
 * Path-aware type utilities shared between setImmutable and map -- see
 * README's "TypeScript" section for the design and its known limits.
 * Covers the two path forms whose keys resolve statically (dot-separated
 * strings and arrays of keys). Bracket/numeric-index paths in string form
 * (e.g. "list[1]", "a[2].b") aren't parsed here -- they'd need real
 * bracket parsing in Split below, which is a separate, harder piece of
 * work -- and a customClone that changes the constructor along the way
 * can't be typed at all, so both fall back to `any` via the Path type
 * param's constraint.
 *
 * This is a types-only module: everything here is erased at build time
 * (no runtime export), so it costs nothing in the published .js output.
 */

export type Split<S extends string, D extends string> =
  S extends `${infer Head}${D}${infer Rest}`
    ? [Head, ...Split<Rest, D>]
    : [S]

export type PathTuple<P> =
  P extends string ? Split<P, '.'> :
  P extends readonly (string | number)[] ? P :
  never

export type SetPath<T, Path extends readonly (string | number)[], V> =
  Path extends readonly [infer Head, ...infer Rest]
    ? Head extends string | number
      ? Rest extends readonly (string | number)[]
        ? Rest['length'] extends 0
          ? T extends readonly unknown[]
            ? { [K in keyof T]: K extends `${Head & (number | string)}` ? V : T[K] }
            : Omit<T, Head extends keyof T ? Head : never> & Record<Head, V>
          : T extends readonly unknown[]
            ? { [K in keyof T]: K extends `${Head & (number | string)}` ? SetPath<T[K], Rest, V> : T[K] }
            : Omit<T, Head> & Record<Head, SetPath<Head extends keyof T ? T[Head] : unknown, Rest, V>>
        : never
      : never
    : T

export type SetImmutableResult<T, P extends string | readonly (string | number)[], V> =
  SetPath<T, PathTuple<P>, V>
