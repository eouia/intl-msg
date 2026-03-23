# Loader API Proposal

## Goal

Define a small optional helper surface for loading and composing dictionaries without expanding the core `IntlMsg` runtime too much.

The intent is:

- keep `IntlMsg` focused on message resolution
- make dictionary acquisition pluggable
- support Node.js, browsers, and Electron with environment-specific loaders
- avoid prematurely splitting this into a separate project

## Positioning

The loader system should be:

- included in this repository
- optional to use
- separate from the core engine

That means applications can still do this:

```js
const msg = IntlMsg.factory({ locales, dictionaries })
```

But applications that need dynamic loading can use helper utilities on top of the core library.

## Recommended package shape

Conceptually:

- `intl-msg` -> core engine
- `intl-msg/compose` -> composition helper
- `intl-msg/loaders/*` -> optional environment-oriented utilities

This does not have to be implemented all at once, but it is the preferred boundary.

## Core concept

The core engine should not know how to discover dictionaries.

Instead, a helper should:

1. receive a composition plan
2. call a user-provided loader
3. merge available dictionaries
4. return the composed dictionary object

## Composition plan shape

Minimal proposed shape:

```js
[
  { locale: 'en', source: 'default' },
  { locale: 'en-US', source: 'langpack' },
  { locale: 'en-CA', source: 'user' }
]
```

Possible future optional fields:

- `id`
- `version`
- `namespace`
- `required`
- `meta`

But the helper should start small and only require:

- `locale`
- `source`

## Loader function contract

The simplest loader shape is:

```js
async function loader(entry) {
  // entry: { locale, source, ... }
  // return:
  //   - dictionary object
  //   - null / undefined if not found
  //   - throw only for real transport or parsing failures
}
```

Expected semantics:

- missing dictionary is not automatically an error
- the composition step may continue if a plan item is absent
- hard failures should be rare and explicit

## Proposed helper API

### `composeDictionaries(plan, loader, options?)`

Suggested behavior:

- iterate the plan in order
- await each loader result
- skip missing results
- merge dictionaries in order
- return a single dictionary object compatible with `IntlMsg`

Conceptual usage:

```js
const dictionaries = await composeDictionaries(plan, loader)

const msg = IntlMsg.factory({
  locales: ['en-CA', 'en-US', 'en'],
  dictionaries,
})
```

## Merge semantics

The helper should preserve the current library's mental model:

- later dictionaries override earlier ones
- dictionaries may be partial
- missing locales or missing keys are acceptable

That means the composition order is the important policy input.

## Error model

Recommended behavior:

- missing resource -> skip and continue
- invalid dictionary shape -> warn or collect error, then skip
- transport or parse failure -> configurable behavior

Suggested option:

```js
{
  onError: 'throw' | 'skip'
}
```

Default recommendation:

- `skip` for missing entries
- `throw` for explicit loader failures unless the caller overrides it

## Browser loaders

The project should not assume one universal browser loader.

Useful browser-oriented patterns:

### 1. Fetch loader

```js
async function loader({ locale, source }) {
  const response = await fetch(`/i18n/${source}/${locale}.json`)
  if (!response.ok) return null
  return { [locale]: await response.json() }
}
```

Good when:

- dictionaries are served over HTTP(S)
- paths are stable and app-controlled

### 2. Dynamic import loader

```js
async function loader({ locale, source }) {
  try {
    const mod = await import(`./dictionaries/${source}/${locale}.js`)
    return mod.default
  } catch (e) {
    return null
  }
}
```

Good when:

- dictionaries are bundled as chunks
- the app build controls what can be imported

### 3. In-memory loader

```js
function createMemoryLoader(registry) {
  return async function loader({ locale, source }) {
    return registry[source]?.[locale] ?? null
  }
}
```

Good when:

- the host app already manages dictionary state
- browser storage is handled outside `intl-msg`

## Node.js loaders

Useful Node-oriented patterns:

- filesystem JSON loader
- dynamic module import loader
- database-backed loader

These should still satisfy the same loader contract.

## Electron loaders

Electron should usually not be special-cased inside the core helper.

Instead, Electron apps can provide loaders that use:

- preload-injected data
- IPC requests
- app-specific file APIs

The helper only needs the standard loader contract.

## Runtime language switching

Recommended flow:

1. compute a new composition plan
2. call `composeDictionaries()`
3. create a new `IntlMsg` instance from the result
4. swap it into the app

This should be preferred over heavily mutating one long-lived instance in place.

## Caching

Caching should usually happen outside the core helper or behind the loader.

For example:

- a loader can memoize results by `(source, locale)`
- composition can stay deterministic and stateless

That keeps the helper small.

## What should stay out of scope

The optional helper should not try to own:

- URL discovery conventions
- filesystem layout conventions
- browser storage policy
- app state management
- UI refresh behavior after language changes

Those belong to the host application.

## Summary

The recommended next step is not a heavyweight loader framework.

It is a very small optional layer:

- one plan format
- one loader contract
- one composition helper

That is enough to support dynamic dictionary acquisition while keeping `IntlMsg` itself compact and environment-agnostic.
