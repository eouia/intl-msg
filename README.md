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
- fallback lookup uses the locale base name, so extension subtags like `en-US-u-ca-buddhist` still fall back through `en-US` and `en`

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

msg.message('EVENT', {
  period: { start: '2026-03-23', end: '2026-03-25' },
})
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

## Development

Install dependencies and run tests:

```sh
npm test
```

Tests currently build the package first, then run Mocha with `nyc` coverage.

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
