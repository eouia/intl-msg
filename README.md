# intl-msg

Native `Intl`-based i18n message formatting for Node.js and browsers, with no runtime dependencies.

## Status

The package now builds from a single source file and publishes both CommonJS and ESM outputs:

- CommonJS: `dist/cjs/main.cjs`
- ESM: `dist/esm/main.js`
- Source of truth: `src/main.js`

Legacy files such as `commonjs/main.js`, `esm/main.js`, and the root `main.js` are now thin compatibility shims. Package consumers should rely on the published package entry points.

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
- `list`
- `number`
- `select`
- `dateTime`
- `relativeTime`
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
