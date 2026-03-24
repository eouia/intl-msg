# intl-msg Roadmap

## Goal

Expand `intl-msg` in a way that stays true to the library's purpose:

- small message-formatting layer on top of native `Intl`
- minimal runtime complexity
- useful across Node.js, browsers, and Electron
- modern-runtime friendly, not legacy-browser focused

## Working style

We will proceed one step at a time.

For each step:

1. agree on the API or behavior
2. implement only that slice
3. add or update tests
4. verify with `npm test`
5. review before moving to the next step

## Priority order

### Step 1. Add `duration` formatter

Why first:

- highest value for message formatting
- directly complements existing `dateTime`, `relativeTime`, and `humanizedRelativeTime`
- low conceptual risk

Settled behavior:

- dictionary formatter config uses `format: "duration"`
- input value is an `Intl.DurationFormat`-style duration record object
- formatter forwards options to `Intl.DurationFormat`
- shorthand numeric inputs are out of scope for this step
- if `Intl.DurationFormat` is unavailable, the formatter warns and falls back gracefully

### Step 2. Add range formatters

Why second:

- very natural fit for pricing, schedules, counts, and date spans
- builds on existing single-value formatter model

Settled behavior:

- formatter names are `numberRange` and `dateTimeRange`
- input shape is `{ start, end }`
- unsupported runtimes warn and fall back gracefully

### Step 3. Add `pluralRange` support

Why third:

- useful, but narrower than duration and display ranges
- depends on how we want to express range values in message templates

Settled behavior:

- formatter name is `pluralRange`
- input shape is `{ start, end }`
- dictionary rule selection mirrors `pluralRules`
- unsupported runtimes warn and fall back gracefully

### Step 4. Improve locale/options validation

Why fourth:

- improves correctness and error messages
- does not change user-facing capabilities as much as earlier steps

Settled behavior:

- use `Intl.supportedValuesOf()` where available
- validate `currency`, `unit`, `calendar`, and `numberingSystem`
- warn and fall back gracefully when invalid values are provided

### Step 5. Revisit locale modeling with `Intl.Locale`

Why fifth:

- useful for internal correctness
- broader refactor than the earlier feature additions

Candidate improvements:

- use `Intl.Locale` for parsing and normalization helpers
- better handling of script/region subtags
- clearer future path for locale-aware option handling

Guardrails for this step:

- preserve the library's forgiving behavior for common locale input mistakes
- continue accepting inputs such as `en_US` by normalizing them before validation
- avoid turning previously tolerated locale input into hard failures unless clearly invalid
- prefer internal correctness improvements over user-visible behavior changes

Settled behavior:

- use `Intl.Locale` when available for internal locale metadata
- preserve compatibility-friendly input normalization
- compute fallback chains from locale base names instead of extension-bearing tags

## Explicitly out of scope for now

- legacy-browser transpiled build
- template syntax redesign
- rich structured output API based on `formatToParts`
- `Intl.Segmenter` integration

These may be revisited later after the core formatter roadmap is complete.

## Recent follow-up

The `formatToParts()` follow-up was implemented in the smallest useful form:

- `number`, `numberRange`, `dateTime`, and `dateTimeRange` can pass `parts` into a registered formatter referenced by `customFormatter`
- the main `message()` API still returns strings and remains the primary public output
- no separate `...Parts` formatter family or `messageParts()` API was added
- this keeps parts support available for advanced post-processing without turning structured parts into the library's main output model

Reference:

- prior parts-oriented work in [`MMRIZE/MMM-CustomElementTime`](https://github.com/MMRIZE/MMM-CustomElementTime) helped validate the idea of post-processing Intl parts rather than exposing them as the primary end-user API
