const IntlMsg = require('./commonjs/main.js')
const assert = require('assert').strict


const dict = {
  "en": {
    "translations": {
      "DEFAULT_TEST": "Welcome to `intl-msg`.",
      "SIMPLE_MESSAGE": "This is a simple message in 'en' dictionary.",
      "CURRENT_LOCALES": "Current locale : {{locales:list}}",
      "NOT_ENUS": "This message doesn't exist in the en-US dictionary.",
      
      "MSG_1": "Variables test: foo => {{foo}}, bar => {{bar}}",
      "DATETIME_FORMAT": "Today is {{today:someDateFormat}}.",
      "TEST_1": "test for {{var}}, {{var:euroCurrency}}, {{var:dollarCurrency}}",
      "TEST_2": "Available colors : {{items:list}}",
      "TEST_3": "Today is {{today:someDateFormat}}.",
      "TEST_4": "Next event will start {{hour:relativeHour}}",
      "TEST_5": "There {{count:beVerb}} {{count}} item{{count:pluralS}} in the {{position}}{{position:ordinal}} storage.",
      "TEST_6": "Capitalized: 'foo'=>{{foo:cap}}, 'bar'=>{{bar:cap}}",
      "TEST_7": "I'm using normal English(en) dictionary."
    },
    "formatters": {
      "euroCurrency": {
        "format": "number",
        "options": { "style": 'currency', "currency": 'EUR' },

      },
      "dollarCurrency": {
        format: "number",
        options: { style: 'currency', currency: 'USD' },
      },
      "list": {
        format: "list",
        options: { style: 'short', type: 'disjunction' }
      },
      "someDateFormat": {
        format: "dateTime",
        options: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
      },
      "relativeHour": {
        format: "relativeTime",
        unit: "hour",
      },
      "beVerb": {
        format: "pluralRules",
        rules: {
          "one": "is",
          "other": "are"
        },
        options: { type: 'cardinal' }
      },
      "pluralS": {
        format: "pluralRules",
        rules: {
          "one": "",
          "other": "s"
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
      "cap": { format: "capitalize" }
    }
  },
  "en-US": {
    "translations": {
      "ONLY_ENUS": "This message exists only in the en-US dictionary.",

      "TEST_7": "I'm using a specific en-US dictionary."
    }
  },
  "de": {
    "translations": {
      "NOT_ENUS": "Diese Nachricht existiert nicht im 'en-US'-Wörterbuch.",
      "CURRENT_LOCALES": "aktuelles Gebietsschema : {{locales:list}}",
      "ONLY_DE": "Diese Nachricht existiert nur im 'de'-Wörterbuch.",
      "DATETIME_FORMAT": "Heute ist {{today:someDateFormat}}.",
    },
    "formatters": {
      "someDateFormat": {
        format: "dateTime",
        options: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
      },
    }
  }
}



describe("1. Module construction test", () => {
  it("default construction test", () => {
    const M = new IntlMsg()
    M.addLocale('en-US').addDictionary(dict)
    var translated = M.message('DEFAULT_TEST')
    console.log(translated)
    assert.equal(
      translated, 'Welcome to `intl-msg`.'
    )
  })
  it("factory pattern test", () => {
    const M = IntlMsg.factory()
    M.addLocale('en-US').addDictionary(dict)
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

const M = new IntlMsg()
M.addLocale('en-US').addDictionary(dict)
M.setLogger({
  log: (...args) => { console.log("LOG:", ...args) },
  error: (...args) => { console.error("ERR:", ...args) }
})

const _ = M.message.bind(M)

const test = (key, args = {}) => {
  var translated = _(key, args)
  console.log('----------------------------------')
  console.log('KEY:', key)
  console.log('RawMessage:', M.getRawMessage(key))
  console.log('Converted :', translated)
  return translated
}


describe("2. Message convert test", () => {
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

describe("3. Locale fallback", () => {
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

  M.setLocale(['de', 'en-US'])

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


describe("4. Variable formatters", () => {
  it("'dateTime' format", () => {
    var translated = test('DATETIME_FORMAT', {today: new Date()})
  })
})
/*
const M = new IntlMsg()

// add locale and add dictionary
M.addLocale('en-US').addDictionary(dict)

// set logger
M.setLogger({
  log: (...args) => { console.log(">>>", ...args)},
  error: (...args) => { console.error("ERR:", ...args)}
})

// simple message convert
console.log(M.message('TEST_1'))


// use factory pattern
const M2 = IntlMsg.factory({
  locales: ['en-US', 'en'],
  dictionaries: dict
})

console.log(M2.getLocales())

// convenient alias
const _ = M2.message.bind(M2)

// test add wrong data
M2.addDictionary('something wrong') // not json data. it will be ignored.
M2.addLocale('ObladiOblada')

console.log("1", _("TEST_1"))

console.log("2", _("TEST_1", { var: 12345.67 }))
console.log("3", _("TEST_2", { items: ['Blue', 'Red', 'White'] }))
console.log("4", _("TEST_3", { today: new Date() }))
console.log("5", _("TEST_4", { hour: 2 }))
console.log("6", _("TEST_5", { count: 1, position: 12 }))
console.log("6", _("TEST_5", { count: 3, position: 22 }))


M.registerFormatter('capitalize', ({locales, value, options}) => {
  var val = value?.toString() || String(value)
  const capitalize = ([ first, ...rest ]) => first.toLocaleUpperCase(locales) + rest.join('')
  return capitalize(val)
})

console.log("7", _("TEST_6", { foo: 'foo', bar: 123 }))


console.log("8", _("TEST_7"))

M.setLocale('en')
console.log("8", _("TEST_7"))

*/