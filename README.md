# CLI API Proposal
WinterCG proposal for standardizing CLI APIs.

### [Discussion on GitHub Issues](https://github.com/CanadaHonk/proposal-cli-api/issues)

## Explainer

This explainer is a WIP draft, as such may drastically change in the future. This is primarily focused on what should be exposed and how. There may be a "V2" in future with more high-level APIs like parsing arguments, but for now this is only [ensuring such APIs could be implemented in userland](https://github.com/CanadaHonk/proposal-cli-api/issues/6).

Process-level information such as arguments and environment variables are commonly used in many CLI applications. Currently, JS runtimes do not have any standardized method to get this information:
- Node: `process.argv`<sup>1</sup>, `process.env`<sup>3</sup>
- Deno: `Deno.args`<sup>2</sup>, `Deno.env`<sup>4</sup>
- Bun: `Bun.argv`<sup>1</sup>, `Bun.env`<sup>3</sup>

<sup>(1: Bare arguments including runtime args. 2: Arguments excluding runtime args. 3: Bare object. 4: Map-like object)</sup>

### Arguments

Arguments should not be exposed raw, instead they [should have "runtime args" removed](https://github.com/CanadaHonk/proposal-cli-api/issues/3). "Runtime args" are any arguments which are specific to the runtime itself: runtime binary path, script path, and runtime arguments. For example, `Deno.args` currently does this while `process.argv` does not. Runtimes may wish to expose the raw arguments themselves via their own API, but that is intentionally not standardized in this proposal.

#### Examples

| argv | Expected |
| ---- | -------- |
| `runtime script.js` | `[]` |
| `runtime script.js ecmascript` | `[ 'ecmascript' ]` |
| `runtime script.js one two three` | `[ 'one', 'two', 'three' ]` |
| `runtime --cool-runtime-argument script.js foo bar` | `[ 'foo', 'bar' ]` |
| `runtime script.js --cool-runtime-argument foo bar` | `[ '--cool-runtime-argument', 'foo', 'bar' ]` |

### Environment Variables

[// todo: exposed via object or Map or custom?](https://github.com/CanadaHonk/proposal-cli-api/issues/3)

### Terminal Metadata

The following metadata about the terminal should be exposed:
- Whether the terminal is interactive or non-interactive
- Whether color should be used or [avoided](https://no-color.org/)

[// todo: exposed as what?](https://github.com/CanadaHonk/proposal-cli-api/issues/9)

### Stdout

// todo

### Stdin

// todo

### Exiting

There should be an `exit` function, optionally allowing an exit code number defaulting to `0` (`exit(code?: number)`).

// todo: exit hooks/listeners
