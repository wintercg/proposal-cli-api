// This polyfill of the WinterCG CLI API proposal is highly likely to have breaking changes in the future!
// https://github.com/CanadaHonk/proposal-cli-api

// Implemented:
// - args


const NAMESPACE = 'CLI';

if (typeof process !== 'undefined') {
  // Node or Node-compatible runtime (Bun):
  // process.argv already excludes arguments used by the runtime,
  // but still has the runtime binary path and script path.

  const { argv } = process;
  globalThis[NAMESPACE] = {
    args: argv.slice(2)
  };
} else if (typeof Deno !== 'undefined') {
  // Deno:
  // Deno.args is already as specified.

  const { args } = Deno;
  globalThis[NAMESPACE] = {
    args
  };
} else {
  // Unknown runtime:
  // Warn and create mock API.

  console.warn('[cli-api-polyfill] Unknown runtime!');

  globalThis[NAMESPACE] = {
    args: []
  };
}