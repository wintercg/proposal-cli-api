// This is a not-production-ready polyfill of the WinterCG CLI API proposal.
// The proposal is highly likely to have breaking changes in the future!
// https://github.com/wintercg/proposal-cli-api

// Implemented:
// - args
// - env
// - exit

// Supported runtimes:
// - Node, or other runtimes implementing `process` (Bun, etc)
// - Deno

const NAMESPACE = 'CLI';

const ensureString = (v, badRet = undefined) => {
  if (typeof v !== 'string') return badRet;
  return true;
};

if (typeof process !== 'undefined') {
  // Node, or other runtimes implementing `process` (Bun, etc):
  // process.argv already excludes arguments used by the runtime,
  // but still has the runtime binary path and script path.
  // process.env is mostly there but we are more strict with checks.
  // process.exit is ~identical.

  const { argv, env } = process;
  globalThis[NAMESPACE] = {
    args: argv.slice(2),
    exit: n => process.exit(n ?? 0),
    env: new Proxy({}, {
      get: (_, p) => {
        if (typeof p !== 'string') return undefined;

        return env[p];
      },
      set: (_, p, v) => {
        if (typeof p !== 'string') return false;

        env[p] = String(v);
        return true;
      },
      has: (_, p) => {
        if (typeof p !== 'string') return false;

        return Object.prototype.hasOwnProperty.call(env, p);
      },
      deleteProperty: (_, p) => {
        if (typeof p !== 'string') return false;

        delete env[p];
        return true;
      },
      getOwnPropertyDescriptor: (_, p) => {
        if (typeof p !== 'string') return undefined;

        return { value: env[p], writable: true, enumerable: true, configurable: true };
      },
      ownKeys: () => Object.keys(env),
    })
  };
} else if (typeof Deno !== 'undefined') {
  // Deno:
  // Deno.args is already as specified.
  // Deno.env is Map-like instead of Object-like
  // so we polyfill it into CLI.env as specified.
  // Deno.exit is ~identical.

  const { args, exit, env } = Deno;
  globalThis[NAMESPACE] = {
    args,
    exit: n => exit(n ?? 0),
    env: new Proxy({}, {
      get: (_, p) => {
        if (typeof p !== 'string') return undefined;

        return env.get(p);
      },
      set: (_, p, v) => {
        if (typeof p !== 'string') return false;

        env.set(p, String(v));
        return true;
      },
      has: (_, p) => {
        if (typeof p !== 'string') return false;

        return env.has(p);
      },
      deleteProperty: (_, p) => {
        if (typeof p !== 'string') return false;

        env.delete(p);
        return true;
      },
      getOwnPropertyDescriptor: (_, p) => {
        if (typeof p !== 'string') return undefined;

        return { value: env.get(p), writable: true, enumerable: true, configurable: true };
      },
      ownKeys: () => Object.keys(env.toObject()),
    })
  };
} else {
  // Unknown runtime:
  // Warn and create mock API.

  console.warn('[cli-api-polyfill] Unknown runtime!');

  globalThis[NAMESPACE] = {
    args: [],
    exit: () => {},
    env: new Proxy({}, {
      get: (_, p) => {
        if (typeof p !== 'string') return undefined;

        return _[p];
      },
      set: (_, p, v) => {
        if (typeof p !== 'string') return false;

        _[p] = String(v);
        return true;
      },
      has: (_, p) => {
        if (typeof p !== 'string') return false;

        return Object.prototype.hasOwnProperty.call(_, p);
      },
      deleteProperty: (_, p) => {
        if (typeof p !== 'string') return false;

        delete _[p];
        return true;
      },
      getOwnPropertyDescriptor: (_, p) => {
        if (typeof p !== 'string') return undefined;

        return { value: _[p], writable: true, enumerable: true, configurable: true };
      },
      ownKeys: () => Object.keys(env),
    })
  };
}