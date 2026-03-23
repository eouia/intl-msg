# Dictionary Composition Proposal

## Purpose

This document describes a simpler future direction for `intl-msg`.

Instead of turning the runtime into a permanently multi-layered dictionary engine, the preferred approach is:

- declare a priority chain
- load dictionaries in that order
- merge them into one effective dictionary
- run `IntlMsg` against the merged result

This keeps the runtime model simple while still supporting the original goals of the project.

## Why this is preferable

The project originally needed to support cases like:

- app-provided default dictionaries
- official language-pack dictionaries
- user custom dictionaries
- partial regional overrides such as `en-CA`

One possible design is an explicit multi-layer resolver inside the runtime.
But that pushes a lot of complexity into every lookup.

A simpler design is:

1. decide the priority chain for the current user
2. load whatever dictionaries are available in that chain
3. merge them into one runtime dictionary set
4. let `IntlMsg` resolve messages normally

This preserves most of the value while keeping the core engine small.

## Key idea

The important abstraction is not "there are always three layers".

The important abstraction is:

- dictionary sources may differ
- dictionaries may be partial
- lookup order must be controllable

That can be expressed by a composition plan rather than a permanent layer system.

## Example composition chain

A user might want:

- app default `en`
- official language pack `en-US`
- user override `en-CA`

That can be modeled as a priority chain:

```js
[
  { locale: 'en', source: 'default' },
  { locale: 'en-US', source: 'langpack' },
  { locale: 'en-CA', source: 'user' }
]
```

The runtime then loads what it can, in that order, and merges.

If `en-CA` only defines a few keys, those keys override the earlier dictionaries while the rest continue to come from `en-US` or `en`.

## Why merge-first is attractive

### 1. It matches the current architecture

`IntlMsg` already works well once dictionaries are in memory.

That means the simplest evolution path is:

- keep `IntlMsg` as the in-memory message engine
- move source selection and loading into a preparation step

### 2. It avoids permanent lookup complexity

Instead of checking multiple sources during every message lookup, the system pays the cost once during composition.

### 3. It works across environments

Node.js, Electron, and browsers can use different loading strategies while still converging on the same merged dictionary shape.

### 4. It fits partial dictionaries naturally

Partial dictionaries are not a problem. They are the point.

## Proposed conceptual API

This does not have to be implemented immediately, but the model could look like:

```js
const plan = [
  { locale: 'en', source: 'default' },
  { locale: 'en-US', source: 'langpack' },
  { locale: 'en-CA', source: 'user' }
]

const mergedDictionary = await composeDictionaries(plan, loader)

const msg = IntlMsg.factory({
  locales: ['en-CA', 'en-US', 'en'],
  dictionaries: mergedDictionary
})
```

Where:

- `plan` defines precedence
- `loader` knows how to obtain dictionary data for each plan item
- `composeDictionaries()` merges available results in order

## Browser constraints

The browser is where this problem originally became difficult.

### What browsers can usually load

Depending on the application, browsers may load dictionaries from:

- dictionaries bundled into the app at build time
- JSON or JS files exposed over HTTP(S)
- dynamic ESM imports
- in-memory objects already injected by the app
- browser storage such as IndexedDB or localStorage

### What browsers cannot assume

A browser runtime cannot assume:

- arbitrary filesystem access
- stable local file paths
- permission to read user-chosen paths automatically
- that every dictionary location is fetchable

This means browser support must stay loader-driven.

The core library should not assume where dictionaries live.

## Loader model

The clean separation is:

- `IntlMsg`: message engine
- loader/composer: dictionary acquisition and merge

A loader can be sync or async depending on the environment.

### Example loader behaviors

- Node.js loader: read JSON files from disk or dynamic import modules
- Electron loader: use app-managed file or IPC APIs
- Browser loader: fetch known URLs, dynamic import known chunks, or read app-provided objects

## Runtime language changes

Changing language at runtime is not inherently a problem if composition is treated as a replaceable step.

Recommended model:

1. compute a new priority chain
2. load or reuse dictionaries for that chain
3. compose a new merged dictionary
4. replace the active `IntlMsg` instance or replace its dictionaries/locales

### Important requirement

Dictionary composition should be treated as immutable output.

That means:

- do not keep mutating the same merged dictionary object across language changes
- build a fresh merged result for each resolved language plan

This avoids stale cross-language state and makes switching safer.

### Caching strategy

Runtime changes become practical when dictionary loading is cached.

A reasonable model is:

- cache raw dictionaries by `(source, locale)`
- rebuild merged dictionaries from cached raw parts
- only fetch/import missing parts

This keeps switching responsive without forcing all dictionaries to be preloaded.

## Failure handling

Composition should be tolerant.

If a plan item is missing:

- skip it
- continue with the next fallback source

The important invariant is that a final safe default dictionary should exist somewhere in the chain.

## Suggested design rule

Do not make dictionary discovery part of `IntlMsg`.

`IntlMsg` should remain responsible for:

- locale normalization
- fallback-aware message lookup
- formatter execution

Dictionary discovery and loading should stay outside the core engine.

## Summary

The simpler and more practical model is:

- define a priority chain
- load what is available
- merge into one effective dictionary set
- let `IntlMsg` operate on that merged result

This keeps the engine compact, respects browser limitations, and still supports the original goals:

- partial dictionaries
- official language packs
- user overrides
- regional customization
- runtime language changes
