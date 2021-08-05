const IntlMsg = require('./commonjs/main.js')


const dict = {
  "en": {
    "translations": {
      "TEST_1": "test for {{var}}, {{var:euroCurrency}}, {{var:dollarCurrency}}",
      "TEST_2": "Available colors : {{items:list}}",
      "TEST_3": "Today is {{today:someDateFormat}}.",
      "TEST_4": "Next event will start {{hour:relativeHour}}",
      "TEST_5": "There {{count:beVerb}} {{count}} item{{count:pluralS}} in the {{position}}{{position:ordinal}} storage.",
      "TEST_6": "Capitalized: 'foo'=>{{foo:cap}}, 'bar'=>{{bar:cap}}",
      "TEST_7": "My locale is 'en'."
    },
    "formatters": {
      "euroCurrency": {
        format: "number",
        options: { style: 'currency', currency: 'EUR' },

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
      "TEST_7": "My locale is 'en-US'"
    }
  }
}

const M = new IntlMsg()
M.addLocale('en-US').addDictionary(dict)
M.setLogger({
  log: (...args) => { console.log(">>>", ...args)},
  error: (...args) => { console.error("ERR:", ...args)}
})
const _ = M.message.bind(M)


console.log("1", _("TEST_1"))

console.log("2", _("TEST_1", { var: 12345.67 }))
console.log("3", _("TEST_2", { items: ['Blue', 'Red', 'White'] }))
console.log("4", _("TEST_3", { today: new Date() }))
console.log("5", _("TEST_4", { hour: 2 }))
console.log("6", _("TEST_5", { count: 1, position: 22 }))


M.registerFormatter('capitalize', ({locales, value, options}) => {
  value = value?.toString() || String(value)
  const capitalize = ([ first, ...rest ]) => first.toLocaleUpperCase(locales) + rest.join('')
  return capitalize(value)
})

console.log("7", _("TEST_6", { foo: 'foo', bar: 123 }))


console.log("8", _("TEST_7"))