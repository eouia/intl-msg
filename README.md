# intl-msg

Native `Intl`-based i18n message formatting for modern Node.js, browsers, and Electron, with no runtime dependencies.

## Status

The package now builds from a single source file and publishes both CommonJS and ESM outputs:

- CommonJS: `dist/cjs/main.cjs`
- ESM: `dist/esm/main.js`
- Source of truth: `src/main.js`

Legacy files such as `commonjs/main.js`, `esm/main.js`, and the root `main.js` are now thin compatibility shims. Package consumers should rely on the published package entry points.

## Runtime requirements

This library is designed for modern JavaScript runtimes with full `Intl` support. It is not a legacy-browser compatibility build.

Minimum practical requirements:

- Node.js: 16+ recommended
- Browsers: native ESM support and modern class features, including private fields
- Electron: a modern Electron release whose bundled Chromium/Node versions satisfy the browser and Node requirements above

Required built-in `Intl` APIs:

- `Intl.getCanonicalLocales`
- `Intl.PluralRules`
- `Intl.DateTimeFormat`
- `Intl.RelativeTimeFormat`
- `Intl.ListFormat`
- `Intl.NumberFormat`

Required JavaScript features in the runtime:

- ES modules or a bundler that can consume them
- private class fields
- optional chaining
- nullish coalescing

If your target runtime does not provide the required `Intl` APIs, you must inject a compatible `intlPolyfill` when constructing `IntlMsg`.

Locale input remains compatibility-friendly:

- common non-BCP47 separators such as `en_US` are normalized to `en-US`
- fallback lookup checks the full canonical locale first, then falls back through the locale base name chain such as `en-US` and `en`

## Environment support

Supported in practice means:

- Node.js: works via the published CommonJS and ESM package entry points
- Browsers: works in modern browsers through native ESM, a bundler, or the browser global build
- Electron: works when the embedded Node/Chromium runtime provides the required `Intl` APIs and language features

Not currently provided:

- a legacy ES5 build
- a UMD or IIFE browser bundle
- automatic polyfills for missing `Intl` features

## Install

```sh
npm install intl-msg
```

If you publish under a scoped or alternate package name, replace `intl-msg` accordingly.

## Usage

### ESM

```js
import IntlMsg from 'intl-msg'

const msg = IntlMsg.factory({
  locales: ['en-US', 'en'],
  dictionaries: {
    en: {
      translations: {
        HELLO: 'Hello, {{name}}.',
      },
    },
  },
})

console.log(msg.message('HELLO', { name: 'Taylor' }))
```

### CommonJS

```js
const IntlMsg = require('intl-msg')

const msg = new IntlMsg()
msg.addLocale(['en-US', 'en'])
msg.addDictionary({
  en: {
    translations: {
      HELLO: 'Hello, {{name}}.',
    },
  },
})

console.log(msg.message('HELLO', { name: 'Taylor' }))
```

### Browser `<script>`

For modern browsers, the package also ships a browser global build at `dist/browser/intl-msg.js`.

```html
<script src="./dist/browser/intl-msg.js"></script>
<script>
  const msg = IntlMsg.factory({
    locales: ['en-US', 'en'],
    dictionaries: {
      en: {
        translations: {
          HELLO: 'Hello, {{name}}.',
        },
      },
    },
  })

  console.log(msg.message('HELLO', { name: 'Taylor' }))
</script>
```

This build is intended for modern browsers. It is not a transpiled legacy-browser build.

## Dictionary format

```json
{
  "en": {
    "translations": {
      "HELLO": "Hello, {{name}}."
    },
    "formatters": {
      "currency": {
        "format": "number",
        "options": {
          "style": "currency",
          "currency": "USD"
        }
      }
    }
  }
}
```

- `translations` maps message keys to template strings
- `formatters` maps formatter names to formatter config objects

## Message syntax

### Plain substitution

```txt
{{name}}
```

```js
msg.message('HELLO', { name: 'Taylor' })
// => 'Hello, Taylor.'
```

### Formatted substitution

```txt
{{amount:currency}}
```

```js
msg.addDictionary({
  en: {
    translations: {
      TOTAL: 'Total: {{amount:currency}}',
    },
    formatters: {
      currency: {
        format: 'number',
        options: { style: 'currency', currency: 'USD' },
      },
    },
  },
})

msg.message('TOTAL', { amount: 1234.5 })
// => 'Total: $1,234.50'
```

## Locale fallback

Locales are resolved using a fallback chain. For example:

- `en-US` tries `en-US`, then `en`
- `zh-Hant-TW` tries `zh-Hant-TW`, then `zh-Hant`, then `zh`

You can also provide multiple preferred locales:

```js
msg.setLocale(['fr-CA', 'fr', 'en'])
```

Message lookup will try each locale in order, including each locale's fallback chain, until it finds a matching translation.

## Built-in formatters

The library includes these built-in formatters:

- `pluralRules`
- `pluralRange`
- `list`
- `number`
- `numberRange`
- `select`
- `dateTime`
- `dateTimeRange`
- `relativeTime`
- `duration`
- `humanizedRelativeTime`

### Example

```js
msg.addDictionary({
  en: {
    translations: {
      SUMMARY: 'Today is {{today:dateLabel}}. Total: {{amount:currency}}.',
    },
    formatters: {
      dateLabel: {
        format: 'dateTime',
        options: { weekday: 'long', month: 'long', day: 'numeric' },
      },
      currency: {
        format: 'number',
        options: { style: 'currency', currency: 'USD' },
      },
    },
  },
})

msg.message('SUMMARY', {
  today: '2026-03-23',
  amount: 1234.5,
})
// => 'Today is Monday, March 23. Total: $1,234.50.'
```

### Duration example

```js
msg.addDictionary({
  en: {
    translations: {
      ELAPSED: 'Elapsed: {{time:elapsed}}',
    },
    formatters: {
      elapsed: {
        format: 'duration',
        options: { style: 'short' },
      },
    },
  },
})

msg.message('ELAPSED', {
  time: { hours: 1, minutes: 30, seconds: 5 },
})
// => 'Elapsed: 1 hr, 30 min, 5 sec'
```

The `duration` formatter follows `Intl.DurationFormat` and expects a duration record object such as `{ hours: 1, minutes: 30 }`.

### Range examples

```js
msg.addDictionary({
  en: {
    translations: {
      BUDGET: 'Budget: {{amount:budget}}',
      EVENT: 'Event: {{period:schedule}}',
    },
    formatters: {
      budget: {
        format: 'numberRange',
        options: { style: 'currency', currency: 'USD' },
      },
      schedule: {
        format: 'dateTimeRange',
        options: { month: 'short', day: 'numeric' },
      },
    },
  },
})

msg.message('BUDGET', {
  amount: { start: 1200, end: 3400 },
})
// => 'Budget: $1,200.00 - $3,400.00'

msg.message('EVENT', {
  period: { start: '2026-03-23', end: '2026-03-25' },
})
// => 'Event: Mar 23-25'
```

The `numberRange` and `dateTimeRange` formatters expect an object with `{ start, end }`.

### Plural range example

```js
msg.addDictionary({
  en: {
    translations: {
      LABEL: 'Recommended for {{countText}} {{count:ticketLabel}}',
    },
    formatters: {
      ticketLabel: {
        format: 'pluralRange',
        rules: {
          one: 'ticket',
          other: 'tickets',
        },
      },
    },
  },
})

msg.message('LABEL', {
  countText: '1-3',
  count: { start: 1, end: 3 },
})
// => 'Recommended for 1-3 tickets'
```

The `pluralRange` formatter expects `{ start, end }` and uses `Intl.PluralRules.prototype.selectRange()`.

## Option validation

When the runtime supports `Intl.supportedValuesOf()`, the library validates commonly used Intl options before constructing formatters.

Currently validated where applicable:

- `currency`
- `unit`
- `calendar`
- `numberingSystem`

If an option is invalid, the formatter warns through the configured logger and falls back gracefully instead of relying only on a constructor exception.

## Parts-aware post-processing

Any formatter can optionally pass its result through one registered post-formatter as a second stage.
There is no recursive formatter pipeline: `format` runs first, then `postFormat` may run once.

Supported built-in formatters currently provide `parts` when available:

- `list`
- `number`
- `numberRange`
- `dateTime`
- `dateTimeRange`
- `relativeTime`

The post-formatter receives a context object including:

- `value`: the built-in formatter's default string result
- `parts`: the result of `formatToParts()` or `formatRangeToParts()` when supported
- `rawValue`: the original unformatted input value
- `format`: the built-in formatter name that ran first

For custom primary formatters, `postFormat` still works, but `parts` is only populated when the first stage formatter collected them.

Example:

```js
msg.registerFormatter('markCurrency', ({ value, parts }) => {
  const currency = parts.find((part) => part.type === 'currency')?.value ?? ''
  return `${value} [${currency}]`
})

msg.addDictionary({
  en: {
    translations: {
      TOTAL: 'Total: {{amount:price}}',
    },
    formatters: {
      price: {
        format: 'number',
        options: { style: 'currency', currency: 'USD' },
        postFormat: 'markCurrency',
      },
    },
  },
})

msg.message('TOTAL', { amount: 1234.5 })
// => 'Total: $1,234.50 [$]'
```

## Custom formatters

Register a formatter by name, then reference it from dictionary formatter definitions:

```js
msg.registerFormatter('capitalize', ({ value }) => {
  const text = value == null ? '' : String(value)
  return text ? text[0].toUpperCase() + text.slice(1).toLowerCase() : text
})

msg.addDictionary({
  en: {
    translations: {
      TITLE: 'Welcome, {{name:titleCase}}.',
    },
    formatters: {
      titleCase: {
        format: 'capitalize',
      },
    },
  },
})

msg.message('TITLE', { name: 'tAYLOR' })
// => 'Welcome, Taylor.'
```

Custom formatter callbacks receive a single config object. Common fields include:

- `locales`
- `value`
- `options`
- any additional formatter-specific properties from the dictionary config

## API

### `new IntlMsg(options?)`

Creates an instance.

Supported options:

- `log`
- `verbose`
- `intlPolyfill`

### `IntlMsg.factory(options?)`

Convenience constructor. In addition to the constructor options, it also accepts:

- `locales`
- `dictionaries`

### `addLocale(locales)`

Adds one locale or an array of locales.

### `setLocale(locales)`

Replaces the current locale list.

### `getLocale()`

Returns the current locale list.

### `addDictionary(dictionaryJson)`

Merges dictionary data into the current instance.

### `getDictionary(locale)`

Returns the `Dictionary` instance for a locale, or `null`.

### `getDictionaryNames()`

Returns the registered locale names.

### `addTermToDictionary(locale, key, value)`

Adds or replaces a translation term for a locale.

### `getTermFromDictionary(locale, key)`

Returns a term value, or `undefined`.

### `getRawMessage(key, locales?)`

Returns the untranslated template string selected by locale lookup.

### `message(key, values?)`

Formats and returns the final message string.

### `registerFormatter(name, fn)`

Registers a custom formatter callback.

Dictionary formatter configs may also set `postFormat` to the name of a registered formatter. Only two stages are supported: `format`, then `postFormat`.

## Development

Install dependencies and run tests:

```sh
npm test
```

Tests currently build the package first, then run Mocha with `nyc` coverage.

## Production use

`intl-msg` is usable in real applications today, especially when you want:

- partial dictionaries
- locale-aware formatting driven by translation data
- explicit fallback behavior
- application-controlled dictionary loading

It is a good fit when:

- your app can decide where dictionaries live
- you want to merge default dictionaries, language packs, and user overrides
- you want to stay close to native `Intl` behavior

Things to keep in mind:

- dictionary discovery is application-owned
- the optional `compose` and `loaders` helpers are intentionally small
- modern runtimes are assumed
- this is not an ICU MessageFormat replacement

For runtime language switching, prefer composing a fresh dictionary set and creating a fresh `IntlMsg` instance instead of mutating one long-lived instance in place.

## Optional composition helper

The package also provides an optional composition helper for building one merged dictionary from a priority plan:

```js
import composeDictionaries from 'intl-msg/compose'

const dictionaries = await composeDictionaries(
  [
    { locale: 'en', source: 'default' },
    { locale: 'en-US', source: 'langpack' },
    { locale: 'en-CA', source: 'user' },
  ],
  async ({ locale, source }) => {
    // Application-specific loading logic goes here.
    // Return a partial dictionary object or null.
  }
)
```

This helper is intentionally small and optional. It does not replace the core `IntlMsg` API.

## Optional loader helpers

The package also provides optional strict helpers via `intl-msg/loaders`:

```js
import { createMemoryLoader, createFetchLoader, createPathLoader } from 'intl-msg/loaders'
```

These helpers are intentionally narrow:

- they work well for simple, conventional layouts
- they do not try to discover arbitrary custom dictionary locations
- applications can override URL/path resolution through callbacks

Examples:

```js
const memoryLoader = createMemoryLoader(registry)

const fetchLoader = createFetchLoader({
  resolveUrl: ({ locale, source }) => `/dictionaries/${source}/${locale}.json`,
})

const pathLoader = createPathLoader({
  resolvePath: ({ locale, source }) => `./dictionaries/${source}/${locale}.json`,
  readFile: fs.promises.readFile,
})
```

Node.js path example:

```js
import IntlMsg from 'intl-msg'
import composeDictionaries from 'intl-msg/compose'
import { createPathLoader } from 'intl-msg/loaders'
import { readFile } from 'node:fs/promises'

const loader = createPathLoader({
  readFile,
  resolvePath: ({ locale, source }) =>
    `${process.cwd()}/dictionaries/${source}/${locale}.json`,
})

const dictionaries = await composeDictionaries(
  [{ locale: 'en-US', source: 'default' }],
  loader
)

const msg = IntlMsg.factory({
  locales: ['en-US', 'en'],
  dictionaries,
})

console.log(msg.message('HELLO'))
```
