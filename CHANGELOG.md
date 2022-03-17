# v3.0.0 (2022-03-17)

- #11 - Removed support for very old versions of Node.js by dropping the auto-polyfill of Array.includes and Object.values. This allows removing core-js as a dependency, which means faster installs, no hypothetical future performance problems, and no more console spam.

- If you're using a modern JS environment, you should use [the native `structuredClone` function](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone). So consider this package legacy.
