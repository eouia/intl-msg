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
      "RELATIVETIME_FORMAT": "The next event will start {{event:relativeDayFormat}}.",
      "HUMANIZEDTIME_FORMAT": "The time of event is {{time:humanized}}",
      "SELECT_FORMAT": "Welcome {{gender:titled}}{{job:titled}} {{name}}.",
      "PLURAL_FORMAT": "There {{enemy:beVerb}} {{enemy}} {{enemy:enemies}} in the {{stage}}{{stage:ordinal}} stage.",
      "LIST_FORMAT": "Available Colors - {{colors:list}}",
      "NUMBER_FORMAT": "The total sales amount of the Berlin office is {{amount:EUR}}.",
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
      "relativeDayFormat": {
        format: "relativeTime",
        unit: "day",
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
  error: (...args) => { console.error("ERR:", ...args) }
})

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
    M.addLocales(['fr', 'ja-JP']) // addLocales alias test.
    var translated = M.message('DEFAULT_TEST')
    console.log(translated)
    console.log(M.getLocales())
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
    M.setLocales(['en-US', 'de'])
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

describe(title("4. Variable formatters"), () => {
  it("'dateTime' format test. It should display proper date by locale and options.", () => {
    M.setLocale(['en-US', 'de'])
    var translated = test('DATETIME_FORMAT', {today: '2021-08-19'})
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
})