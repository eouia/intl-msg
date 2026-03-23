const IntlMsg = require('./dist/cjs/main.cjs')
const assert = require('assert').strict
const fs = require('fs')
const vm = require('vm')


const dict = {
  "en": {
    "translations": {
      "DEFAULT_TEST": "Welcome to `intl-msg`.",
      "SIMPLE_MESSAGE": "This is a simple message in 'en' dictionary.",
      "CURRENT_LOCALES": "Current locale : {{locales:list}}",
      "NOT_ENUS": "This message doesn't exist in the en-US dictionary.",

      "MSG_1": "Variables test: foo => {{foo}}, bar => {{bar}}",
      "DATETIME_FORMAT": "Today is {{today:someDateFormat}}.",
      "DATETIME_RANGE_FORMAT": "The event runs {{period:eventDateRange}}.",
      "RELATIVETIME_FORMAT": "The next event will start {{event:relativeDayFormat}}.",
      "DURATION_FORMAT": "Elapsed time: {{elapsed:elapsedTime}}.",
      "HUMANIZEDTIME_FORMAT": "The time of event is {{time:humanized}}",
      "SELECT_FORMAT": "Welcome {{gender:titled}}{{job:titled}} {{name}}.",
      "PLURAL_FORMAT": "There {{enemy:beVerb}} {{enemy}} {{enemy:enemies}} in the {{stage}}{{stage:ordinal}} stage.",
      "PLURAL_RANGE_FORMAT": "Recommended for {{count}} {{count:ticketLabel}}.",
      "LIST_FORMAT": "Available Colors - {{colors:list}}",
      "NUMBER_FORMAT": "The total sales amount of the Berlin office is {{amount:EUR}}.",
      "NUMBER_RANGE_FORMAT": "Expected budget: {{amount:budgetRange}}.",
    },
    "formatters": {
      "EUR": {
        format: "number",
        options: { style: 'currency', currency: 'EUR' },
      },
      "list": {
        format: "list",
        options: { style: 'short', type: 'disjunction' }
      },
      "someDateFormat": {
        format: "dateTime",
        options: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
      },
      "eventDateRange": {
        format: "dateTimeRange",
        options: { month: 'short', day: 'numeric' },
      },
      "relativeDayFormat": {
        format: "relativeTime",
        unit: "day",
      },
      "elapsedTime": {
        format: "duration",
        options: {
          style: "short"
        }
      },
      "budgetRange": {
        format: "numberRange",
        options: { style: 'currency', currency: 'USD' }
      },
      "titled": {
        format: "select",
        "options": {
          "male": "Mr.",
          "female": "Ms.",
          "doctor": "Dr.",
          "professor": "Prof.",
          "sir": "Sir.",
          "other": ""
        }
      },
      "humanized": {
        format: "humanizedRelativeTime",
        options: {
          numeric: 'auto'
        }
      },
      "beVerb": {
        format: "pluralRules",
        rules: {
          "one": "is",
          "other": "are"
        },
        options: { type: 'cardinal' }
      },
      "enemies": {
        format: "pluralRules",
        rules: {
          "one": "enemy",
          "other": "enemies"
        }
      },
      "ordinal": {
        format: "pluralRules",
        rules: {
          "one": "st",
          "two": "nd",
          "few": "rd",
          "other": "th"
        },
        options: { type: 'ordinal' }
      },
      "ticketLabel": {
        format: "pluralRange",
        rules: {
          "one": "ticket",
          "other": "tickets"
        }
      },
    }
  },
  "en-US": {
    "translations": {
      "ONLY_ENUS": "This message exists only in the en-US dictionary."
    }
  },
  "de": {
    "translations": {
      "NOT_ENUS": "Diese Nachricht existiert nicht im 'en-US'-Wörterbuch.",
      "CURRENT_LOCALES": "aktuelles Gebietsschema : {{locales:list}}",
      "ONLY_DE": "Diese Nachricht existiert nur im 'de'-Wörterbuch.",
      "DATETIME_FORMAT": "Heute ist {{today:someDateFormat}}."
    },
    "formatters": {
      "someDateFormat": {
        format: "dateTime",
        options: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
      }
    }
  }
}


const RED = '\033[0;31m'
const NC = '\033[0m'
const LCYAN = '\033[1;36m'
const BLUE = '\033[1;34m'
const YELLOW = '\033[1;33m'

const M = new IntlMsg()
M.addLocale('en-US')
M.addDictionary(dict)
M.setLogger({
  log: (...args) => { console.log("LOG:", ...args) },
  info: (...args) => { console.info("INFO:", ...args) },
  warn: (...args) => { console.warn("WARN:", ...args) },
  error: (...args) => { console.error("ERR:", ...args) }
}, true)

const _ = M.message.bind(M)

const test = (key, args = {}) => {
  var translated = _(key, args)
  console.log('----------------------------------')
  console.log(`Key: ${RED}${key}${NC}`)
  console.log(`RawMessage: ${LCYAN}${M.getRawMessage(key)}${NC}`)
  console.log(`Translated: ${BLUE}${translated}${NC}`)
  return translated
}

const title = (str) => {
  return `\n${YELLOW}${str}${NC}\n`
}



describe(title("1. Module construction test"), () => {
  it("default construction test", () => {
    const M = new IntlMsg()
    M.addLocale('en-US')
    M.addDictionary(dict)
    M.addLocale(['fr', 'ja-JP'])
    var translated = M.message('DEFAULT_TEST')
    console.log(translated)
    console.log(M.getLocale())
    assert.equal(
      translated, 'Welcome to `intl-msg`.'
    )
  })
  it("add new dictionary", () => {
    M.addDictionary({
      "ko-KR": {
        "translations": {
          "NEW_DICTIONARY": "새로운 한국어(ko-KR) 사전 등록",
          "TEST_1": "사전 변경"
        }
      }
    })
    M.addLocale('ko-KR')
    var translated = test('NEW_DICTIONARY')
    assert.equal(
      translated, "새로운 한국어(ko-KR) 사전 등록"
    )
  })
  it("modify dictionary", () => {
    M.addDictionary({
      "ko-KR": {
        "translations": {
          "NEW_DICTIONARY": "사전을 바꿉니다."
        }
      }
    })
    test("TEST_1")
    var translated = test('NEW_DICTIONARY')
    assert.equal(
      translated, "사전을 바꿉니다."
    )
  })
  it("factory pattern test", () => {
    const M = IntlMsg.factory()
    M.addLocale('en-US')
    M.addDictionary(dict)
    var translated = M.message('DEFAULT_TEST')
    console.log(translated)
    assert.equal(
      translated, 'Welcome to `intl-msg`.'
    )
  })
  it("construction with parameters", () => {
    const M = IntlMsg.factory({
      locales: 'en-US',
      dictionaries: dict
    })
    var translated = M.message('DEFAULT_TEST')
    console.log(translated)
    assert.equal(
      translated, 'Welcome to `intl-msg`.'
    )
  })
})



describe(title("2. Message convert test"), () => {
  it("undefined terms", () => {
    var translated = test('UNDEFINED_WORD')
    assert.equal(
      translated, 'UNDEFINED_WORD'
    )
  })

  it("simple message", () => {
    var translated = test('SIMPLE_MESSAGE')
    assert.equal(
      translated, 'This is a simple message in \'en\' dictionary.'
    )
  })

  it("defined message but no variable given", () => {
    var translated = test('MSG_1')
    assert.equal(
      translated, 'Variables test: foo => {{foo}}, bar => {{bar}}'
    )
  })

  it("defined message with variables", () => {
    var translated = test('MSG_1', { foo: 'foo', bar: 123, baz: 'unused' })
    assert.equal(
      translated, 'Variables test: foo => foo, bar => 123'
    )
  })
})

describe(title("3. Locale fallback"), () => {
  it("'setLocale' with array", () => {
    M.setLocale(['en-US', 'de'])
    var translated = test('CURRENT_LOCALES', { locales: M.getLocale() })
    assert.equal(
      translated, 'Current locale : en-US or de'
    )
  })
  it("word exists only in 'en-US' dictionary. locale 'en-US' will use 'en-US' dictionary at first.", () => {
    var translated = test('ONLY_ENUS')
    assert.equal(
      translated, 'This message exists only in the en-US dictionary.'
    )
  })
  it("word doesn't exist in 'en-US' but exists in 'en' and 'de'. locale 'en-US' will use 'en' dictionary as a fallback because 'en' is implicit prior locale of 'en-US'", () => {
    var translated = test('NOT_ENUS')
    assert.equal(
      translated, 'This message doesn\'t exist in the en-US dictionary.'
    )
  })
  it("word exists only in 'de'. locale 'en-US' couldn't find this word in 'en-US' or fallback 'en' dictionaries. So the next fallback locale 'de' would be applied.", () => {
    var translated = test('ONLY_DE')
    assert.equal(
      translated, "Diese Nachricht existiert nur im 'de'-Wörterbuch."
    )
  })
  it("change the order of locales to ['de', 'en-US']", () => {
    M.setLocale(['de', 'en-US'])
    var translated = test('CURRENT_LOCALES', { locales: M.getLocale() })
    assert.equal(
      translated, 'aktuelles Gebietsschema : de,en-US'
    )
  })
  it("So the primary dictionary is changed to 'de'.", () => {
    M.setLocale(['de', 'en-US'])
    var translated = test('NOT_ENUS')
    assert.equal(
      translated, "Diese Nachricht existiert nicht im 'en-US'-Wörterbuch."
    )
  })
})

describe(title("4. Variable formatters"), () => {
  it("'dateTime' format test. It should display proper date by locale and options.", () => {
    M.setLocale(['en-US', 'de'])
    var translated = test('DATETIME_FORMAT', {today: '2021-08-19'})
    assert.equal(
      typeof translated, 'string'
    )
  })
  it("'dateTimeRange' format test. It should format a date range via Intl.DateTimeFormat.formatRange.", () => {
    var translated = test('DATETIME_RANGE_FORMAT', {
      period: { start: '2021-08-19', end: '2021-08-21' }
    })
    assert.equal(
      typeof translated, 'string'
    )
  })
  it("'relativeTime' format test. It should display proper phrase by locale, units and options", () => {
    var translated = test('RELATIVETIME_FORMAT', {event: 10})
    assert.equal(
      typeof translated, 'string'
    )
  })
  it("'humanizedRelativeTime' format test. It should display proper phrase by locale and options, unit will be chosen automatically by duration.", () => {
    var translated = test('HUMANIZEDTIME_FORMAT', { time: Date.now() - 1000 * 60 * 60 * 24 * 35})
    assert.equal(
      typeof translated, 'string'
    )
  })
  it("'duration' format test. It should format a duration record via Intl.DurationFormat.", () => {
    var translated = test('DURATION_FORMAT', {
      elapsed: { hours: 1, minutes: 30, seconds: 5 }
    })
    assert.equal(
      typeof translated, 'string'
    )
  })
  it("'select' format test. ", () => {
    var translated = test('SELECT_FORMAT', { name: 'Smith', gender: 'female', job: 'cook' })
    assert.equal(
      typeof translated, 'string'
    )
  })
  it("'pluralRules' format test. It should be displayed as plural rules by locale.", () => {
    var translated = test('PLURAL_FORMAT', {enemy:1, stage: 12})
    assert.equal(
      typeof translated, 'string'
    )
    var translated = test('PLURAL_FORMAT', {enemy:2, stage: 22})
    assert.equal(
      typeof translated, 'string'
    )
  })
  it("'pluralRange' format test. It should select rules for a numeric range via Intl.PluralRules.selectRange.", () => {
    var translated = test('PLURAL_RANGE_FORMAT', {
      count: { start: 1, end: 3 }
    })
    assert.equal(
      typeof translated, 'string'
    )
  })
  it("'list' format test. It should be displayed as a natural listing phrase.", () => {
    var translated = test('LIST_FORMAT', {colors: ['Red', 'Blue', 'White', 'Black']})
    assert.equal(
      typeof translated, 'string'
    )
  })
  it("'number' format test. It should be displayed as defined format by options.", () => {
    var translated = test('NUMBER_FORMAT', {amount: 1_234_567.89})
    assert.equal(
      typeof translated, 'string'
    )
  })
  it("'numberRange' format test. It should format a numeric range via Intl.NumberFormat.formatRange.", () => {
    var translated = test('NUMBER_RANGE_FORMAT', {
      amount: { start: 1200, end: 3400 }
    })
    assert.equal(
      typeof translated, 'string'
    )
  })
})

describe(title("6. Additional coverage"), () => {
  it("browser global build exports IntlMsg on the global object", async () => {
    const source = fs.readFileSync('./dist/browser/intl-msg.js', 'utf8')
    const context = {
      console,
      Intl,
      Date,
      window: {},
    }

    vm.createContext(context)
    vm.runInContext(source, context)

    const BrowserIntlMsg = context.IntlMsg
    const result = vm.runInContext(`
      (() => {
        const msg = IntlMsg.factory({
          locales: 'en',
          dictionaries: {
            en: {
              translations: {
                HELLO: 'Hello from browser global build',
              },
            },
          },
        })

        return msg.message('HELLO')
      })()
    `, context)

    assert.equal(typeof BrowserIntlMsg, 'function')
    assert.equal(result, 'Hello from browser global build')
  })

  it("formatter locale does not leak between calls that share one fallback dictionary", () => {
    const M2 = new IntlMsg()
    M2.addDictionary({
      en: {
        translations: {
          PRICE: '{{amount:currency}}',
        },
        formatters: {
          currency: {
            format: 'number',
            options: { style: 'currency', currency: 'USD' },
          },
        },
      },
    })

    M2.setLocale(['en-US'])
    const usPrice = M2.message('PRICE', { amount: 1234.5 })

    M2.setLocale(['en-GB'])
    const gbPrice = M2.message('PRICE', { amount: 1234.5 })

    assert.notEqual(usPrice, gbPrice)
    assert.equal(usPrice, '$1,234.50')
    assert.equal(gbPrice, 'US$1,234.50')
  })

  it("legacy CommonJS shim loads the built CommonJS bundle", () => {
    const LegacyIntlMsg = require('./commonjs/main.js')
    const M2 = LegacyIntlMsg.factory({
      locales: 'en',
      dictionaries: {
        en: {
          translations: {
            HELLO: 'Hello from legacy CommonJS shim',
          },
        },
      },
    })

    assert.equal(typeof LegacyIntlMsg, 'function')
    assert.equal(M2.message('HELLO'), 'Hello from legacy CommonJS shim')
  })

  it("legacy ESM shim re-exports the canonical ESM source", async () => {
    const mod = await import('./esm/main.js')
    const LegacyESMIntlMsg = mod.default

    const M2 = LegacyESMIntlMsg.factory({
      locales: 'en',
      dictionaries: {
        en: {
          translations: {
            HELLO: 'Hello from legacy ESM shim',
          },
        },
      },
    })

    assert.equal(typeof LegacyESMIntlMsg, 'function')
    assert.equal(M2.message('HELLO'), 'Hello from legacy ESM shim')
  })

  it("ESM build: default import works with the published ESM bundle", async () => {
    const mod = await import('./dist/esm/main.js')
    const ESMIntlMsg = mod.default

    const M2 = ESMIntlMsg.factory({
      locales: 'en',
      dictionaries: {
        en: {
          translations: {
            HELLO: 'Hello from ESM',
          },
        },
      },
    })

    assert.equal(typeof ESMIntlMsg, 'function')
    assert.equal(M2.message('HELLO'), 'Hello from ESM')
  })

  it("intlPolyfill injection: passing native Intl as polyfill should work normally", () => {
    const M2 = new IntlMsg({ intlPolyfill: Intl })
    M2.addLocale('en')
    M2.addDictionary({ en: { translations: { HELLO: 'Hello' } } })
    assert.equal(M2.message('HELLO'), 'Hello')
  })

  it("intlPolyfill injection: incomplete polyfill is silently ignored when native Intl is available", () => {
    // 네이티브 Intl이 있는 환경에서 불완전한 polyfill은 무시되고 native Intl이 사용됨
    const M2 = new IntlMsg({ intlPolyfill: { invalid: true } })
    M2.addLocale('en')
    M2.addDictionary({ en: { translations: { HELLO: 'Hello' } } })
    assert.equal(M2.message('HELLO'), 'Hello')
  })

  it("duration formatter falls back gracefully when Intl.DurationFormat is unavailable", () => {
    const logs = []
    const logger = {
      log: (...args) => logs.push(['log', ...args]),
      info: (...args) => logs.push(['info', ...args]),
      warn: (...args) => logs.push(['warn', ...args]),
      error: (...args) => logs.push(['error', ...args]),
    }
    const intlWithoutDurationFormat = {
      getCanonicalLocales: Intl.getCanonicalLocales,
      PluralRules: Intl.PluralRules,
      DateTimeFormat: Intl.DateTimeFormat,
      RelativeTimeFormat: Intl.RelativeTimeFormat,
      ListFormat: Intl.ListFormat,
      NumberFormat: Intl.NumberFormat,
    }

    const M2 = new IntlMsg({
      intlPolyfill: intlWithoutDurationFormat,
      log: logger,
      verbose: true,
    })
    M2.addLocale('en')
    M2.addDictionary({
      en: {
        translations: {
          DURATION: 'Elapsed: {{value:elapsed}}',
        },
        formatters: {
          elapsed: {
            format: 'duration',
            options: { style: 'short' },
          },
        },
      },
    })

    const translated = M2.message('DURATION', {
      value: { hours: 1, minutes: 30 }
    })

    assert.equal(translated, 'Elapsed: {"hours":1,"minutes":30}')
    assert.equal(logs.length, 1)
    assert.equal(logs[0][0], 'warn')
    assert.equal(logs[0][1], "Formatter 'duration' requires Intl.DurationFormat support.")
  })

  it("numberRange formatter falls back gracefully when formatRange is unavailable", () => {
    const logs = []
    const logger = {
      log: (...args) => logs.push(['log', ...args]),
      info: (...args) => logs.push(['info', ...args]),
      warn: (...args) => logs.push(['warn', ...args]),
      error: (...args) => logs.push(['error', ...args]),
    }
    const intlWithoutNumberRange = {
      getCanonicalLocales: Intl.getCanonicalLocales,
      PluralRules: Intl.PluralRules,
      DateTimeFormat: Intl.DateTimeFormat,
      RelativeTimeFormat: Intl.RelativeTimeFormat,
      ListFormat: Intl.ListFormat,
      NumberFormat: class NumberFormat extends Intl.NumberFormat {
        formatRange = undefined
      },
      DurationFormat: Intl.DurationFormat,
    }

    const M2 = new IntlMsg({
      intlPolyfill: intlWithoutNumberRange,
      log: logger,
      verbose: true,
    })
    M2.addLocale('en')
    M2.addDictionary({
      en: {
        translations: {
          BUDGET: 'Budget: {{value:range}}',
        },
        formatters: {
          range: {
            format: 'numberRange',
            options: { style: 'currency', currency: 'USD' },
          },
        },
      },
    })

    const translated = M2.message('BUDGET', {
      value: { start: 1200, end: 3400 }
    })

    assert.equal(translated, 'Budget: $1,200.00 - $3,400.00')
    assert.equal(logs.length, 1)
    assert.equal(logs[0][0], 'warn')
    assert.equal(logs[0][1], "Formatter 'numberRange' requires Intl.NumberFormat.prototype.formatRange support.")
  })

  it("dateTimeRange formatter falls back gracefully when formatRange is unavailable", () => {
    const logs = []
    const logger = {
      log: (...args) => logs.push(['log', ...args]),
      info: (...args) => logs.push(['info', ...args]),
      warn: (...args) => logs.push(['warn', ...args]),
      error: (...args) => logs.push(['error', ...args]),
    }
    const intlWithoutDateTimeRange = {
      getCanonicalLocales: Intl.getCanonicalLocales,
      PluralRules: Intl.PluralRules,
      DateTimeFormat: class DateTimeFormat extends Intl.DateTimeFormat {
        formatRange = undefined
      },
      RelativeTimeFormat: Intl.RelativeTimeFormat,
      ListFormat: Intl.ListFormat,
      NumberFormat: Intl.NumberFormat,
      DurationFormat: Intl.DurationFormat,
    }

    const M2 = new IntlMsg({
      intlPolyfill: intlWithoutDateTimeRange,
      log: logger,
      verbose: true,
    })
    M2.addLocale('en')
    M2.addDictionary({
      en: {
        translations: {
          EVENT: 'Event: {{value:range}}',
        },
        formatters: {
          range: {
            format: 'dateTimeRange',
            options: { month: 'short', day: 'numeric' },
          },
        },
      },
    })

    const translated = M2.message('EVENT', {
      value: { start: '2021-08-19', end: '2021-08-21' }
    })

    assert.equal(translated, 'Event: Aug 19 - Aug 21')
    assert.equal(logs.length, 1)
    assert.equal(logs[0][0], 'warn')
    assert.equal(logs[0][1], "Formatter 'dateTimeRange' requires Intl.DateTimeFormat.prototype.formatRange support.")
  })

  it("pluralRange formatter falls back gracefully when selectRange is unavailable", () => {
    const logs = []
    const logger = {
      log: (...args) => logs.push(['log', ...args]),
      info: (...args) => logs.push(['info', ...args]),
      warn: (...args) => logs.push(['warn', ...args]),
      error: (...args) => logs.push(['error', ...args]),
    }
    const intlWithoutPluralRange = {
      getCanonicalLocales: Intl.getCanonicalLocales,
      PluralRules: class PluralRules extends Intl.PluralRules {
        selectRange = undefined
      },
      DateTimeFormat: Intl.DateTimeFormat,
      RelativeTimeFormat: Intl.RelativeTimeFormat,
      ListFormat: Intl.ListFormat,
      NumberFormat: Intl.NumberFormat,
      DurationFormat: Intl.DurationFormat,
    }

    const M2 = new IntlMsg({
      intlPolyfill: intlWithoutPluralRange,
      log: logger,
      verbose: true,
    })
    M2.addLocale('en')
    M2.addDictionary({
      en: {
        translations: {
          LABEL: 'Range label: {{value:tickets}}',
        },
        formatters: {
          tickets: {
            format: 'pluralRange',
            rules: {
              one: 'ticket',
              other: 'tickets',
            },
          },
        },
      },
    })

    const translated = M2.message('LABEL', {
      value: { start: 1, end: 3 }
    })

    assert.equal(translated, 'Range label: tickets')
    assert.equal(logs.length, 1)
    assert.equal(logs[0][0], 'warn')
    assert.equal(logs[0][1], "Formatter 'pluralRange' requires Intl.PluralRules.prototype.selectRange support.")
  })

  it("number formatter warns and falls back when currency is invalid", () => {
    const logs = []
    const logger = {
      log: (...args) => logs.push(['log', ...args]),
      info: (...args) => logs.push(['info', ...args]),
      warn: (...args) => logs.push(['warn', ...args]),
      error: (...args) => logs.push(['error', ...args]),
    }
    const M2 = new IntlMsg({ log: logger, verbose: true, intlPolyfill: Intl })
    M2.addLocale('en')
    M2.addDictionary({
      en: {
        translations: {
          TOTAL: 'Total: {{amount:price}}',
        },
        formatters: {
          price: {
            format: 'number',
            options: { style: 'currency', currency: 'not-a-real-currency' },
          },
        },
      },
    })

    const translated = M2.message('TOTAL', { amount: 1234.5 })
    const warning = logs.find((entry) => entry[0] === 'warn' && entry[1] === "Invalid Intl option 'currency':")

    assert.equal(translated, 'Total: 1234.5')
    assert.ok(warning)
    assert.equal(warning[2], 'NOT-A-REAL-CURRENCY')
  })

  it("dateTime formatter warns and falls back when calendar is invalid", () => {
    const logs = []
    const logger = {
      log: (...args) => logs.push(['log', ...args]),
      info: (...args) => logs.push(['info', ...args]),
      warn: (...args) => logs.push(['warn', ...args]),
      error: (...args) => logs.push(['error', ...args]),
    }
    const M2 = new IntlMsg({ log: logger, verbose: true, intlPolyfill: Intl })
    M2.addLocale('en')
    M2.addDictionary({
      en: {
        translations: {
          TODAY: 'Today: {{value:date}}',
        },
        formatters: {
          date: {
            format: 'dateTime',
            options: { calendar: 'not-a-real-calendar', month: 'short', day: 'numeric' },
          },
        },
      },
    })

    const translated = M2.message('TODAY', { value: '2021-08-19' })
    const warning = logs.find((entry) => entry[0] === 'warn' && entry[1] === "Invalid Intl option 'calendar':")

    assert.equal(translated, 'Today: 2021-08-19')
    assert.ok(warning)
    assert.equal(warning[2], 'not-a-real-calendar')
  })

  it("relativeTime formatter warns and falls back when unit is invalid", () => {
    const logs = []
    const logger = {
      log: (...args) => logs.push(['log', ...args]),
      info: (...args) => logs.push(['info', ...args]),
      warn: (...args) => logs.push(['warn', ...args]),
      error: (...args) => logs.push(['error', ...args]),
    }
    const M2 = new IntlMsg({ log: logger, verbose: true, intlPolyfill: Intl })
    M2.addLocale('en')
    M2.addDictionary({
      en: {
        translations: {
          ETA: 'ETA: {{value:eta}}',
        },
        formatters: {
          eta: {
            format: 'relativeTime',
            unit: 'not-a-real-unit',
          },
        },
      },
    })

    const translated = M2.message('ETA', { value: 3 })
    const warning = logs.find((entry) => entry[0] === 'warn' && entry[1] === "Invalid Intl option 'unit':")

    assert.equal(translated, 'ETA: 3')
    assert.ok(warning)
    assert.equal(warning[2], 'not-a-real-unit')
  })

  it("invalid per-locale dictionary payload is ignored without crashing", () => {
    const M2 = new IntlMsg()
    M2.addLocale('en')

    assert.doesNotThrow(() => {
      M2.addDictionary({
        en: null,
        fr: 123,
      })
    })

    assert.equal(M2.getDictionary('en'), null)
    assert.equal(M2.getDictionary('fr'), null)
  })

  it("Dictionary.getName() returns the canonical locale name", () => {
    M.setLocale(['en-US'])
    M.addDictionary(dict)
    assert.equal(M.getDictionary('en').getName(), 'en')
    assert.equal(M.getDictionary('en-US').getName(), 'en-US')
  })

  it("getDictionary() returns null for unknown locale", () => {
    assert.equal(M.getDictionary('zz'), null)
  })

  it("addTermToDictionary() adds a term that can be retrieved via getTermFromDictionary()", () => {
    M.addTermToDictionary('en', 'DYNAMIC_TERM', 'dynamically added')
    assert.equal(M.getTermFromDictionary('en', 'DYNAMIC_TERM'), 'dynamically added')
  })

  it("addTermToDictionary() on unknown locale does nothing (no crash)", () => {
    assert.doesNotThrow(() => M.addTermToDictionary('zz', 'KEY', 'value'))
  })

  it("getTermFromDictionary() returns undefined for unknown locale", () => {
    assert.equal(M.getTermFromDictionary('zz', 'KEY'), undefined)
  })

  it("getTermFromDictionary() returns undefined for unknown key", () => {
    assert.equal(M.getTermFromDictionary('en', 'NO_SUCH_KEY'), undefined)
  })

  it("toPossibleLocales: locale fallback chain expands correctly (en-US -> en)", () => {
    // toPossibleLocales는 #findTerms 내부에서 사용.
    // en-US 딕셔너리에 없는 키는 en 딕셔너리에서 찾아야 함 — fallback이 동작한다는 것이 곧 toPossibleLocales가 작동한다는 증거.
    const M2 = new IntlMsg()
    M2.addLocale('en-US')
    M2.addDictionary({
      'en': { translations: { 'FALLBACK_KEY': 'found in en' } },
      'en-US': { translations: { 'ENUS_ONLY': 'found in en-US' } }
    })
    // en-US에 없고 en에 있는 키 → en으로 fallback
    assert.equal(M2.message('FALLBACK_KEY'), 'found in en')
    // en-US에 있는 키 → en-US 우선
    assert.equal(M2.message('ENUS_ONLY'), 'found in en-US')
    // 로케일이 en-GB인 경우: en-GB → en 순서로 fallback
    M2.addLocale('en-GB')
    M2.setLocale(['en-GB'])
    assert.equal(M2.message('FALLBACK_KEY'), 'found in en')
  })

  it("formatter error: falls back to original value, no crash", () => {
    const M2 = new IntlMsg()
    M2.addLocale('en')
    M2.addDictionary({
      'en': {
        translations: { 'ERR_MSG': 'result is {{value:broken}}' },
        formatters: { 'broken': { format: 'alwaysThrows' } }
      }
    })
    M2.registerFormatter('alwaysThrows', () => { throw new Error('intentional error') })
    // 포매터가 실패해도 크래시 없이, 원본 값으로 치환된 메시지 반환
    const result = M2.message('ERR_MSG', { value: 'fallbackValue' })
    assert.equal(result, 'result is fallbackValue')
  })

  it("logger configuration is isolated per instance", () => {
    const logs = []
    const logger = {
      log: (...args) => logs.push(['log', ...args]),
      info: (...args) => logs.push(['info', ...args]),
      warn: (...args) => logs.push(['warn', ...args]),
      error: (...args) => logs.push(['error', ...args]),
    }

    const withLogger = new IntlMsg({ log: logger, verbose: true })
    withLogger.addDictionary([1, 2, 3])

    const withoutLogger = new IntlMsg()
    withoutLogger.addDictionary([4, 5, 6])

    assert.equal(logs.length, 1)
    assert.equal(logs[0][0], 'warn')
    assert.equal(logs[0][1], 'Invalid dictionary data:')
  })
})

describe(title("5. Error/Exceptions Test"), () => {
  const logError = (e) => {
    console.error('>', e.message)
  }
  it("Weird locale name check (Try to add 'Klingon', 'Quenya' and 'ObladiOblada'. The last should be ignored without error break)", () => {
    console.log('------------------------------')
    try {
      M.addLocale(['Klingon', 'Quenya', 'ObladiOblada'])
      console.log('Current locales:', M.getLocale())
      assert.ok(true)
    } catch (e) {
      logError(e)
      assert.fail(e.toString())
    }
  })
  it("Invalid dictionary check. Invalid dictionary should be ignored without error break.", () => {
    console.log('------------------------------')
    try {
      M.addDictionary([1, 2, 3, 4])
      M.addDictionary({
        "ObladiOblada": {
          "translations": {
            "MSG": "Blah Blah"
          }
        }
      })
      console.log('Current dictionaries:', M.getDictionaryNames())
      assert.ok(true)
    } catch (e) {
      logError(e)
      assert.fail(e.toString())
    }
  })
  it("Check Invalid date value for dateTime/relativeTime format without error break ", () => {
    console.log('------------------------------')
    try {
      var translated = test('DATETIME_FORMAT', {today: 'XXXXXXXXXX'})
      assert.ok(true)
    } catch (e) {
      logError(e)
      assert.fail(e.toString())
    }
  })
})
