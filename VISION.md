# intl-msg Vision

## Why this project exists

`intl-msg` started from practical localization problems that appeared in MM over time.

A simple translator class worked for years, but several recurring issues kept showing up:

- translation files were expensive to maintain
- locale-specific differences were hard to express cleanly
- fallback behavior was too simple for real multilingual users
- custom user overrides were awkward to support
- natural-language formatting logic kept leaking into app and module code

This project exists to solve those problems with a more flexible message-resolution model built on native `Intl`.

## The problems it was meant to solve

### 1. Translation maintenance should not require full copies

If a translation provider only needs to change a few terms, they should not have to fork and maintain a full copy of the base dictionary.

Examples:

- a language pack may be incomplete or updated later than the main app
- a regional variant such as `en-CA` or `de-AU` may differ from a base locale only in a handful of terms
- a user may want to override only a few messages without replacing an entire official dictionary

The intended model is partial dictionaries plus fallback, not full duplicated dictionary snapshots.

### 2. Locale matters beyond translated words

A single `xx.json` is often not enough.

Different locales can vary in:

- vocabulary
- spelling
- grammar
- date formatting
- number formatting
- currency formatting
- numbering systems

This means localization should not be treated as plain string substitution alone. It must cooperate with locale-aware formatting.

That is why the project is built around native `Intl`, not around a standalone formatting layer disconnected from locale semantics.

### 3. Real users may need multi-step fallback chains

A single primary language plus final English fallback is often too simple.

Real users may prefer chains like:

- `fr-CA -> fr -> en-CA -> en`
- `sr -> hr -> hu -> en`
- `en-CA -> en-US -> en`

The goal was never just "find one locale". The goal was to support meaningful fallback paths before reaching the last safe default.

### 4. App developers should not hardcode every language rule

Module authors should be able to provide general values and stable message keys without embedding every language-specific grammar rule directly in app logic.

Translation providers should be able to localize:

- plural forms
- titles and honorifics
- list rendering
- number/date/time formatting
- relative phrasing
- locale-specific message patterns

That is why formatter definitions live in dictionaries rather than entirely in application code.

### 5. Users should be able to customize behavior

Users may need:

- custom minor-locale dictionaries
- personal wording choices
- project-specific overrides
- community-maintained language variants

The system should allow these without forcing core developers to officially ship and maintain every variation.

## What `intl-msg` is

`intl-msg` is not just a translator lookup helper.

It is better understood as a:

- locale-aware message resolution engine
- dictionary fallback system
- lightweight message templating layer
- native-`Intl` formatter orchestration layer

## Core design principles

### 1. Native `Intl` first

Whenever the platform provides a reliable locale-aware primitive, prefer that over a custom implementation.

This is why the library centers on:

- `Intl.DateTimeFormat`
- `Intl.RelativeTimeFormat`
- `Intl.ListFormat`
- `Intl.NumberFormat`
- `Intl.PluralRules`
- newer APIs such as `Intl.DurationFormat` and range formatting support

### 2. Partial dictionaries should be first-class

Dictionaries should be allowed to be incomplete on purpose.

Missing terms are not automatically an error if a higher-level fallback dictionary can provide the value.

### 3. Fallback is a feature, not a patch

Fallback is not only for error recovery.

It is a core modeling tool that makes these scenarios possible:

- official base dictionary plus delayed language packs
- regional variants with tiny diffs
- user custom overrides
- multi-locale preference chains

### 4. Formatting belongs near translation data

A module developer should be able to provide stable keys and values.
A translation provider should be able to decide how the final phrase is shaped.

This keeps language-specific logic closer to translation data and reduces overgrowth of app-side configuration.

### 5. Be forgiving about locale input

Users and developers often make locale-format mistakes such as:

- `en_US` instead of `en-US`
- lowercase/uppercase inconsistencies
- region/script omissions

The library should normalize common mistakes when possible, instead of turning them into unnecessary hard failures.

## What the current implementation already reflects

The current codebase already captures several parts of the original vision:

- locale normalization
- locale fallback chains
- dictionary merging
- formatter-aware message rendering
- custom formatter registration
- browser, Node.js, and Electron-friendly runtime design

Recent work also moved more behavior onto modern native `Intl` capabilities.

## What still remains conceptually important

The original motivation also points toward future design areas:

- dictionary layers such as `default`, `langpack`, and `user`
- richer fallback policies across both locale and source layer
- more explicit support for object-shaped message values
- more flexible loading models for Node.js, browsers, and Electron

Those ideas are compatible with the current direction. They are not a departure from the project; they are part of its original intent.

## Relationship to `Intl.MessageFormat`

It is reasonable to ask whether this project overlaps with the emerging `Intl.MessageFormat` proposal.

The answer is: partially, yes.

There is likely overlap in areas such as:

- message templating
- plural and select-style branching
- parts-oriented output
- locale-aware final message formatting

That overlap does not automatically make `intl-msg` redundant, because this project also has a different center of gravity.

The parts that remain especially important here are:

- dictionary storage and composition
- partial dictionaries and merge behavior
- locale fallback chains
- application-controlled loading and composition helpers
- user and language-pack overrides
- lightweight formatter orchestration around native `Intl`

In other words:

- `Intl.MessageFormat` aims toward a standard message-formatting primitive
- `intl-msg` is strongest when it acts as a dictionary resolution, fallback, and composition engine around native `Intl`

This means future work should be careful about expanding deep custom message-language features when a standards-based primitive may eventually cover that space better.

The safer long-term direction is to stay strong in:

- dictionary composition
- fallback policy
- locale-aware formatter integration
- customization and override workflows

and to treat message syntax features as a lightweight layer, not the entire identity of the project.

## In one sentence

`intl-msg` exists to make localization more maintainable, more locale-aware, and more customizable than a simple translation table, while still staying lightweight and rooted in native `Intl`.
