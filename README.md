# CLI API Proposal
WinterCG proposal for standardizing CLI APIs.

### [Discussion on GitHub Issues](https://github.com/CanadaHonk/proposal-cli-api/issues)

## Explainer

This explainer is a WIP draft, as such may drastically change in the future. This is primarily focused on what should be exposed and how. There may be a "V2" in future with more high-level APIs like parsing arguments, but for now this is only [ensuring such APIs could be implemented in userland](https://github.com/CanadaHonk/proposal-cli-api/issues/6).

Process-level information such as arguments and environment variables are commonly used in many CLI applications. Currently, JS runtimes do not have any standardized method to get this information:
- Node: `process.argv`<sup>1</sup>, `process.env`<sup>3</sup>
- Deno: `Deno.args`<sup>2</sup>, `Deno.env`<sup>4</sup>
- Bun: `Bun.argv`<sup>1</sup>, `Bun.env`<sup>3</sup>

<sup>(0: Bare arguments including binary path and script path, excluding options consumed. 2: Arguments excluding runtime args. 3: Bare object. 4: Map-like object)</sup>

### Arguments

Arguments should not be exposed raw, instead they [should have "runtime args" removed](https://github.com/CanadaHonk/proposal-cli-api/issues/3). "Runtime args" are any arguments which are specific to the runtime itself: runtime binary path, script path, and runtime arguments. For example, `Deno.args` currently excludes these while `process.argv` has the runtime binary path and script path. Runtimes may wish to expose the raw arguments themselves via their own API, but that is intentionally not standardized in this proposal.

#### Examples

| Raw arguments | Expected | `process.argv` (comparison) |
| ---- | -------- | -------------- |
| `runtime script.js` | `[]` | `[ '/bin/runtime', '/tmp/script.js' ]` |
| `runtime script.js example` | `[ 'example' ]` | `[ '/bin/runtime', '/tmp/script.js', 'example' ]` |
| `runtime script.js one two three` | `[ 'one', 'two', 'three' ]` | `[ '/bin/runtime', '/tmp/script.js', 'one', 'two', 'three' ]` |
| `runtime --cool-runtime-argument script.js foo bar` | `[ 'foo', 'bar' ]` | `[ '/bin/runtime', '/tmp/script.js', 'foo', 'bar' ]` |
| `runtime script.js --cool-runtime-argument foo bar` | `[ '--cool-runtime-argument', 'foo', 'bar' ]` | `[ '/bin/runtime', '/tmp/script.js', '--cool-runtime-argument', 'foo', 'bar' ]` |

### Environment Variables

Environment variables should be exposed as a exotic object with getters/setters/deleters as specified below. This behaves similar to `process.env`, but intentionally stricter.

> [!IMPORTANT]
> This section is a draft of a **simplified** ES-like spec to detail the concept and is [under discussion](https://github.com/CanadaHonk/proposal-cli-api/issues/3). This should probably be moved to a separate spec file.

#### EnvironmentVariables [[Get]] ( *P* )

The EnvironmentVariables getter gets the given environment variable in a [host-defined](https://tc39.es/ecma262/#host-defined) manner. It performs the following steps when called:

1. If *P* [is not a String](https://tc39.es/ecma262/#sec-ecmascript-language-types-string-type), return **undefined**.
1. If, checking in a [host-defined](https://tc39.es/ecma262/#host-defined) manner, the environment variable *P* is set, then
    1. Return the value of the environment variable *P* in a [host-defined](https://tc39.es/ecma262/#host-defined) manner.
1. Return **undefined**.

> [!NOTE]
> Some platforms, notably Windows, have case insensitive environment variable lookups. This should be handled in the host-defined manners. For example, if `FOO` was set and `foo` was looked up, the value of `FOO` would be used. If `foo` was then set, the original case `FOO` would retain (like a case-insensitive pointer lookup).

#### EnvironmentVariables [[GetOwnProperty]] ( *P* )

The EnvironmentVariables [[GetOwnProperty]] internal method returns a [normal completion containing](https://tc39.es/ecma262/#sec-completion-record-specification-type) a [Property Descriptor](https://tc39.es/ecma262/#sec-property-descriptor-specification-type) or **undefined**. It gets the given environment variable in a [host-defined](https://tc39.es/ecma262/#host-defined) manner. It performs the following steps when called:

1. If *P* [is not a String](https://tc39.es/ecma262/#sec-ecmascript-language-types-string-type), return **undefined**.
1. If, checking in a [host-defined](https://tc39.es/ecma262/#host-defined) manner, the environment variable *P* is set, then
    1. Let *value* be the value of the environment variable *P* retrieved in a [host-defined](https://tc39.es/ecma262/#host-defined) manner.
    1. Return the PropertyDescriptor { [[Value]]: *value*, [[Writable]]: true, [[Enumerable]]: true, [[Configurable]]: true }.
1. Return **undefined**.

#### EnvironmentVariables [[Set]] ( *P*, *V* )

The EnvironmentVariables setter sets the given environment variable in a [host-defined](https://tc39.es/ecma262/#host-defined) manner. It performs the following steps when called:

1. If *P* [is not a String](https://tc39.es/ecma262/#sec-ecmascript-language-types-string-type), return **false**.
1. Let *value* be ? [ToString](https://tc39.es/ecma262/#sec-tostring)(*V*).
1. Set the environment variable *P* to *value* in a [host-defined](https://tc39.es/ecma262/#host-defined) manner.
1. Return **true**.

#### EnvironmentVariables [[Delete]] ( *P* )

The EnvironmentVariables deleter unsets the given environment variable in a [host-defined](https://tc39.es/ecma262/#host-defined) manner. It performs the following steps when called:

1. If *P* [is not a String](https://tc39.es/ecma262/#sec-ecmascript-language-types-string-type), return **false**.
1. If, checking in a [host-defined](https://tc39.es/ecma262/#host-defined) manner, the environment variable *P* is set, then
  1. Unset the environment variable *P* in a [host-defined](https://tc39.es/ecma262/#host-defined) manner.
1. Return **true**.

> [!NOTE]
> Set and unset environment variables both return **true** for deletion.

#### EnvironmentVariables [[HasProperty]] ( *P* )

The EnvironmentVariables [[HasProperty]] internal method checks if the given environment variable is set in a [host-defined](https://tc39.es/ecma262/#host-defined) manner. It performs the following steps when called:

1. If *P* [is not a String](https://tc39.es/ecma262/#sec-ecmascript-language-types-string-type), return **false**.
1. If, checking in a [host-defined](https://tc39.es/ecma262/#host-defined) manner, the environment variable *P* is set, then
    1. Return **true**.
1. Return **false**.

#### EnvironmentVariables [[OwnPropertyKeys]] ( )

The EnvironmentVariables [[OwnPropertyKeys]] internal method returns a list of set environment variables retrieved in a [host-defined](https://tc39.es/ecma262/#host-defined) manner. It performs the following steps when called:

1. Return a list of set environment variables retrieved in a [host-defined](https://tc39.es/ecma262/#host-defined) manner.

> [!NOTE]
> For EnvironmentVariables we intentionally use [[OwnPropertyKeys]] instead of newer Iterator, entries, etc as there could be environment variables with those names (even if unlikely). Ideally `Object.keys(CLI.env)`, `for (const name in CLI.env)`, `{ ...CLI.env }` should all work from these definitions.

> [!NOTE]
> For now, [[DefineOwnProperty]], and more are left knowingly unspecified.


### Terminal Metadata

The following metadata (capabilities/preferences) about the terminal should be exposed:
- Whether the terminal is interactive or non-interactive
- Whether color should be used or [avoided](https://no-color.org/)

[// todo: exposed how?](https://github.com/CanadaHonk/proposal-cli-api/issues/9)

### Exiting

There should be an `exit` function, optionally allowing an exit code number defaulting to `0` (`exit(code?: number)`).

// todo: exit hooks/listeners

### Stdout

// todo

### Stdin

// todo

## Why standardize?

Currently, if you want the same script which uses arguments or other CLI APIs to work across runtimes, you have to add specific code for each runtime:

```js
let args = [];

if (typeof process !== 'undefined') args = process.argv.slice(2);
if (typeof Deno !== 'undefined') args = Deno.args.slice();
// ...
```

While this could be helped with a library (boilerplate :/) or by more runtimes implementing `process` (not a standard :/), WinterCG looks like a good place to really standardize these APIs.

For selfish (@CanadaHonk) reasons, I was looking at adding these APIs to my JS engine+runtime and didn't know how I should expose them, so started this proposal :^)
