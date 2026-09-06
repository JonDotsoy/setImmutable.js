# Changelog

All notable changes to this project are documented in this file, derived from
the git history of `package.json`'s `version` field.

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
