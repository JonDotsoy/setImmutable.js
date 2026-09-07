# Changelog

All notable changes to this project are documented in this file, derived from
the git history of `package.json`'s `version` field.

## [1.0.0] - 2026-09-07

First stable release. No functional changes since 0.2.0 — this release
promotes the existing `set`/`map`/`clone` API to 1.0.0. Consolidated feature
set:

- **`set(object, path, value, [customClone])`** — sets `value` at `path`
  without mutating `object`. Walks `path` from the root and clones only the
  nodes it visits (structural sharing), so every branch not on `path`, and
  every sibling not touched, keeps its original reference — cheaper than a
  deep clone and safe to use on `Object.freeze`d input (unlike `_.set`,
  which silently mutates through a frozen root's unfrozen children).
  - Accepts dot-separated string paths (`'a.b.c'`), array-of-keys paths
    (`['a', 'b', 'c']`), and bracket/index string paths
    (`'[0][1][2]'`, `'a[2].b'`).
  - Creates any missing intermediate segment as a plain object, or an array
    when the next segment is an index — same as `_.set`.
  - Takes an optional `customClone(objValue, key)` to control how existing
    objects on `path` are cloned, for constructors that need special
    construction arguments instead of the default no-arg clone.
- **`clone(value)`** — the default per-node clone `set` uses when no
  `customClone` is given: a new, empty instance of `value.constructor`
  (`new value.constructor()`, or `{}` if there is none). Exported standalone
  as `setimmutable/clone` so a custom clone function can fall back to it.
- **`map(object, mapping)`** — applies several `set` updates to `object` in
  one call, still without mutating it. `mapping` accepts three syntaxes:
  1. An array of `[path, value]` pairs, applied in order so later pairs see
     earlier updates.
  2. A function `set => { ... }` that calls `set(path, value)` directly,
     batching plain `set` calls.
  3. A function `set => (object literal)` that calls `set(value)` inline
     inside a returned object/array literal — `map` infers each value's
     path from its position in the literal.
- **Subpath exports** — `setimmutable`, `setimmutable/map`, and
  `setimmutable/clone` all resolve as both `require()` and ESM `import`
  (via `package.json`'s `"exports"` map).
- **TypeScript-aware source** — `src/setImmutable.ts` and `src/map.ts`
  (array-of-pairs syntax only) are generic and path-aware: given a typed
  input object and a literal path, the compiler infers the exact resulting
  shape, including newly created keys, up to 31 path segments deep. Known
  limits: bracket/index paths aren't parsed at the type level (use
  array-of-keys for typed array indexing), `customClone`'s effect on the
  result type isn't tracked, and `map`'s two function-based syntaxes stay
  untyped. The published package itself still ships as plain JS with no
  `.d.ts`.

## [0.2.0] - 2026-09-06

- Add CI workflow (`tc01-types`, `tc` matrix TC02-TC06) that installs the
  published package from the npm registry and checks it on Node 6, 10, 12,
  LTS and latest, across `require()`, static/dynamic `import`, and bare
  imports.
- Post a PR comment summarizing every CI job's test result as a
  syntax x Node-version table, with a collapsible full test-suite script and
  a collapsible `npm pack` file listing.
- Migrate the source from JavaScript to TypeScript (`src/*.ts`), with typed
  `setImmutable`, `map`, and `clone` signatures and type-level tests
  (`expect-type`).
- Migrate the build from gulp+babel to `bun build` (transpile-only, no
  bundling).
- Add `package.json` `"exports"` so `setimmutable/map` and
  `setimmutable/clone` resolve as ESM subpath imports.
- Add a `"files"` allowlist so `npm pack` only ships the built package
  (`setImmutable.js`, `map.js`, `clone.js`) instead of source, tests, and CI
  config.
- Rewrite the README: technical intro, documented `set()`/`map()`/`clone()`
  API, import-first code examples, an expanded explanation of why
  SetImmutable pairs with Redux, and removal of the stale Travis CI badge.
- Add an automated publish workflow: PRs that bump `package.json` get a
  preview build on npm (dist-tag matching the version's prerelease
  identifier, e.g. `rc`) and a GitHub Release linking to it; merging a
  version bump to `master` publishes it for real (dist-tag `latest`) the
  same way, with npm Trusted Publishing (OIDC, no stored token) and
  provenance.

## [0.1.9] - 2017-02-22

- Added Syntax 3 to `map()`.
- Added a new syntax to `set()`.
- Added `.travis.yml` for CI (Node 6).
- Added project brand to the README.

## [0.1.8] - 2017-02-21

- Version bump ("End version"); no functional changes recorded.

## [0.1.6] - 2017-02-21

- Fixed the `main` file reference in `package.json`.

## [0.1.5] - 2017-02-21

- Version bump ("Update version"); no functional changes recorded.

## [0.1.4] - 2017-02-20 to 2017-02-21

- Updated `set`.
- Added a `prepublish` script.
- General project updates (build task, `.npmignore`, test directory
  handling, removed `index.js`).

## [0.1.3] - 2017-01-30

- Added a link to Redux in the README.

## [0.1.2] - 2017-01-30

- Updated the README.

## [0.1.1] - 2017-01-30

- Initial package metadata update after the first release.

## [0.1.0] - 2017-01-29

- Initial commit.
