# Contributing

Thanks for helping improve Restate.

1. Fork the repository and create a focused branch.
2. Change the source in `restate@original`.
3. Run `npm install` once in `builder`.
4. Run `npm run restate:test` in `builder`.
5. Open a pull request that explains the behavior change and includes tests.

Please keep the public API cohesive, make persistence explicit, avoid adding
platform code to the wrong bundle, and preserve React and React Native
compatibility. Every state, storage, lifecycle, or packaging change should add
or update a regression test.

Restate release artifacts must remain readable. Do not add encryption,
obfuscation, name mangling, or minification to `build-restate.js`; its source
maps must continue to include the original source content.
