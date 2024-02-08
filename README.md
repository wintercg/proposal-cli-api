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

Environment variables should be exposed as a exotic (Proxy-like) object with getters/setters/deleters as specified below.

> [!IMPORTANT]
> This section is a draft of a **simplified** ES-like spec to detail the concept and is [under discussion](https://github.com/CanadaHonk/proposal-cli-api/issues/3). This should probably be moved to a more official/detailed spec file.

#### NormalizeName( *name* )

The abstract operation NormalizeName takes argument *name* and returns a string with "name normalization" done on it or a [throw completion](https://tc39.es/ecma262/#sec-completion-record-specification-type). This operation is needed as environment variables are case insensitive on some platforms (notably Windows). It performs the following steps when called:

1. If *name* [is not a String](https://tc39.es/ecma262/#sec-ecmascript-language-types-string-type), throw a **TypeError** exception.
1. If the [host](https://tc39.es/ecma262/#host) is on a environment variable case insensitive operating system (eg Windows), then
    1. Let *sText* be [StringToCodePoints](https://tc39.es/ecma262/#sec-stringtocodepoints)(*S*).
    1. Let *upperText* be the result of toUppercase(*sText*), according to the Unicode Default Case Conversion algorithm.
    1. Set *S* to [CodePointsToString](https://tc39.es/ecma262/#sec-codepointstostring)(*upperText*).
1. Return *S*.

#### EnvironmentVariables [[Get]] ( *P* )

The EnvironmentVariables getter gets the given environment variable in the [host](https://tc39.es/ecma262/#host) in a standard manner. It performs the following steps when called:

1. Let *name* be ? [NormalizeName](#normalizename-name-)(*P*).
1. If the [host](https://tc39.es/ecma262/#host) has the environment variable *name* set, then
    1. Return the value of the environment variable *name* from the [host](https://tc39.es/ecma262/#host).
1. Return **undefined**.

#### EnvironmentVariables [[GetOwnProperty]] ( *P* )

The EnvironmentVariables [[GetOwnProperty]] internal method returns a [normal completion containing](https://tc39.es/ecma262/#sec-completion-record-specification-type) a [Property Descriptor](https://tc39.es/ecma262/#sec-property-descriptor-specification-type) or **undefined**. It gets the given environment variable in the [host](https://tc39.es/ecma262/#host) in a standard manner. It performs the following steps when called:

1. Let *name* be ? [NormalizeName](#normalizename-name-)(*P*).
1. If the [host](https://tc39.es/ecma262/#host) has the environment variable *name* set, then
    1. Let *value* be the value of the environment variable *name* from the [host](https://tc39.es/ecma262/#host).
    1. Let *desc* be ? [ToPropertyDescriptor](https://tc39.es/ecma262/#sec-topropertydescriptor)(*value*).
    1. Perform [CompletePropertyDescriptor](https://tc39.es/ecma262/#sec-completepropertydescriptor)(*desc*).
    1. Return *desc*.
1. Return **undefined**.

#### EnvironmentVariables [[Set]] ( *P*, *V* )

The EnvironmentVariables setter sets the given environment variable from the [host](https://tc39.es/ecma262/#host) in a standard manner. It performs the following steps when called:

1. Let *name* be ? [NormalizeName](#normalizename-name-)(*P*).
1. Set the environment variable *name* to the given value *V* from the [host](https://tc39.es/ecma262/#host).
1. Return **true**.

#### EnvironmentVariables [[Delete]] ( *P* )

The EnvironmentVariables deleter unsets the given environment variable fom the [host](https://tc39.es/ecma262/#host) in a standard manner. It performs the following steps when called:

1. Let *name* be ? [NormalizeName](#normalizename-name-)(*P*).
1. Unset the environment variable *name* from the [host](https://tc39.es/ecma262/#host).
1. Return **true**.

#### EnvironmentVariables [[OwnPropertyKeys]] ( )

The EnvironmentVariables [[OwnPropertyKeys]] internal method returns a list of set environment variables from the [host](https://tc39.es/ecma262/#host) in a standard manner. It performs the following steps when called:

1. Return a list of set environment variables from the [host](https://tc39.es/ecma262/#host).

> [!NOTE]
> For EnvironmentVariables we intentionally use [[OwnPropertyKeys]] instead of newer Iterator, entries, etc as there could be environment variables with those names (even if unlikely). Ideally `Object.keys(CLI.env)`, `for (const name in CLI.env)`, `{ ...CLI.env }` should all work from these definitions.

> [!NOTE]
> For now, [[DefineOwnProperty]], [[HasProperty]], and more are left knowingly unspecified.


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

For selfish (@CanadaHonk) reasons, I was looking at adding these APIs to my JS engine+runtime and didn't know how I should expose them, so started this proposal :)
