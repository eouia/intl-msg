# WARNING: NOT YET COMPLETED

# intl-msg
Simple native `Intl`(> node 16) based message converter for nodeJS and browser (CommonJS and ES Module)


## Install

```sh
npm install --save intl-msg
```

## import & require
**For es module**
```js

import IntlMsg from 'intl-msg'
```

**For commonJS**
```js
const IntlMsg = require('intl-msg')
```

**For pure JS in the browser**
```html
 <script type="module" src="YOUR_DIST/intl-msg.min.js"></script>
```

## Usage
```js
const myMsg = IntlMsg.factory() // const myMsg = new IntlMsg()
myMsg.addLocale(['en-GB', 'en'])
myMsg.addDictionary(myDictionary)
const translated = myMsg.msg('myTerm', values)
console.log(translated)
```


## JSON Dictionary
### Structure
```json
{
  "LOCALENAME" : {
    "translations" : {
      ... // Term : Message pairs
    },
    "formatters" : { // optionsla if you don't need
      ... // predefined or custom formatter descriptions 
    }
  },
  "OTHER LOCALENAME": { 
    ... 
  },
  ...
}
```
**Example**
See [test.js](https://github.com/eouia/intl-msg/blob/main/test.js)

## Locale fallback
Let's assume you have a complete dictionary for English(en) and partial dictionary for French(fr). 
```json
{
  "en": {
    "translations" : {
      "SAY_HELLO" : "Hello, world.",
      "MANIFESTO" : "I'm the king of the world!"
    }
  },
  "fr": {
    "translations" : {
      "SAY_HELLO" : "Bonjour le monde."
      // 'MANIFESTO' is missing
    }
  }
}
```
If you set the locale as `['fr', 'en']`, IntlMsg will try to find the terms in prior dictionary first, then try other dictionaries by order until a proper match found. It would be useful when you cannot provide full dictionaries for various languages.
```js
myMsg.addLocale(['fr', 'en'])
console.log(myMsg.translate('SAY_HELLO')) // 'Bonjour le monde.'
console.log(myMsg.translate('MANIFESTO')) // 'I'm the king of the world!'
```

It could be also useful when the language has sub-locales (e.g: `en-US`, `en-GB`, `en-CA`, `en-AU`, ...). You can make a default dictionary for common default language, then describe exceptional terms and rules for each sub-locale.
```json
{
  "en" : {
    "translations" : {
      "SAY_HELLO" : "Hello, world",
    },
  },
  "en-AU" : {
    "translations" : {
      "SAY_HELLO" : "G'day, world",
    }
  }
}
```
```js
myMsg.setLocale('en')
myMsg.message('SAY_HELLO') // hello, world

myMsg.setLocale('en-GB')
myMsg.message('SAY_HELLO') // hello, world 
// Even though 'en-GB' dictionary doesn't exist, 'en-GB' locale can use 'en' dictionary by default, because 'en' is primary locale of 'en-GB'.

myMsg.setLocale('en-AU')
myMsg.message('SAY_HELLO') // G'day, world (from 'en-AU' dictionary, because 'SAY_HELLO' is defined.)

myMsg.setLocale('fr')
myMsg.message('SAY_HELLO') // SAY_HELLO
// 'fr' dictionary doesn't exist, so 'SAY_HELLO' cannot be translated.
// Better case will be .setLocale(['fr', 'en']) for˜ a fallback
```


## Value injection
You can inject your values into message with `{{var}}`, `{{var?pluralRule}}`, `{{var:formatter}}` template tag.

```json
{
  "en" : {
    "translations": {
      "CURRENT_SCORE": "Your score is '{{currentScore}}'",
      "SCORE_MESSAGE" : "You earn {{score}} point{{score?s}} on {{time:shortHourFormat}}"
    },
    "pluralRules": {
      "s": {
        "one": "",
        "other": "s"
      }
    },
    "formatters": {
      "shortHourFormat": {
        "format": "dateTime",
        "option": {
          "hour": "numeric", 
          "dayPeriod": "short"
        }
      }
    }
  }
}
```
```js
myMsg.message('CURRENT_SCORE', { currentScore: 1000 })
// => Your score is 1000
myMsg.message('SCORE_MESSAGE', {score: 10, time: Date.now()})
// => You earn 10 points on 10 at night      (It could be different by locale.)
```

### Basic value `{{var}}`
Just use `Object` or `Map` then use it's key(property name) to insert.
```js
// "MESSAGE" : "Hello, user '{{name}}'."
myMsg.message('MESSAGE', { name: 'Bob' })
// => Hello, user 'Bob'.
```

### Conditional plural rules `{{var?rule}}`
You can apply conditional plural rule to replace the value by it's number. (e.g: plural postfixes, verb variations, ordinal count, ...)
```json
{
  ...
  "pluralRules": {
    "beVerb": {
      "one" : "is",
      "other" : "are"
    },
  }
}
```
```js
// "MESSAGE" : "There {{count?beVerb}} {{count}} dice on the board."
myMsg.message('MESSAGE', { count: 1 }) // => There is 1 dice on the board.
myMsg.message('MESSAGE', { count: 2 }) // => There are 2 dice on the board.
```

### Formatter `{{var:formatter}}`
There are 4 default formatters pre-defined by native `Intl` module(`dateTime`, `relativeTime`, `list`, `number`). You can add your custom formatter by your needs.

```js
// "MESSAGE" : "Income : {{amount:number}}"
var cash = 12345.67
myMsg.setLocale('en-US')
myMsg.message('MESSAGE', { amount: cash }) // => Income : 12,345.67
myMsg.message('MESSAGE', { 
  amount: { 
    value: cash, 
    options: { style: 'currency', currency: 'EUR' }
  } 
}) // => Income : 12,345.67 €
myMsg.setLocale('de-DE')
myMsg.message('MESSAGE', { amount: cash }) // => Income : 12.345,67
myMsg.message('MESSAGE', { 
  amount: { 
    value: cash, 
    options: { style: 'currency', currency: 'EUR' }
  } 
}) // => Income : 12.345,67 €
```
Each variable object needs to have 3 sub properties - `value`, `options` and `locale`. 
However when the variable is a just plain data type not object, it regards as without options and current primary locale. (You rarely need `locale` in usual case.)

#### default Formatter : `dateTime`
```js
// "MESSAGE" : "Today is  '{{date:dateTime}}' in German language"
var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
myMsg.message('MESSAGE', { 
  date: {
    value: Date.now(),
    locale: 'de-DE',
    options: options
  }
})
// => Today is 'Donnerstag, 20. Dezember 2012' in German language.
```
See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat

#### default Formatter: `relativeTime`
```js
// "MESSAGE" : "Next Event: {{period:relativeTime}}"
var options = { numeric: "auto" }
myMsg.message('MESSAGE', { 
  period: {
    value: 1,
    options: options,
    unit: "day"
  }
})
// => Next Event: tomorrow
```
You need additional `unit` property to convert relative format.

See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat


#### default formatter: `list`
```js
// "MESSAGE" : "Color list: {{colors:list}}"
const colors = ['Blue', 'Red', 'White']
var options = { style: 'long', type: 'conjunction' }
myMsg.message('MESSAGE', { 
  colors: {
    value: colors,
    options: options
  }
})
// => Color list: Blue, Red, and White
```
See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat

#### default Formatter: `number`

### Custom formatter

## Methods
### (factory constructor)
- **return** : `IntlMsg` object
```js
const myMSG = new IntlMsg()
// or
const myMSG = IntlMsg.factory()
```
 
### .addLocale (locales)
- **param** 
  - locales : **text** or **array of text** (e.g: 'en' or ['en', 'en-GB'])
    - locale names should be BCP-47 or likes. (It will be regulated by `Intl.getCanonicalLocales()` but entirely wrong locale name couldn't be accepted.)
- **return** : self (chainable)

You can add several locales. The first locale would be your main locale. Others would be fallback locale by order when the term or dictionary of prior locales couldn't be matched with.
```js
myMsg.addLocale(['de-DE', 'fr'])
```

### .setLocale (locales)
- **param**
  - locales : **text** or **array of text** (e.g: 'en' or ['en', 'en-GB'])
- **return** : self (chainable)

You can reset the locale with this method.
```js
myMsg.setLocale('en')
```

### .getLocale ()
- **return** : array of locale names

Return the locales of current object.
```js
const locales = myMsg.getLocale()
```
### .addDictionary (dictionaryJSON)
- **param**
  - dictionaryJSON : **JSON object** for dictionary. (See the below part.)
- **return** : self (chainable)

Add the dictionary as JSON Object. When the same dictionary or term exists, it will be merged with new one.
```js
const myDictionary = { JSON Object }
myMsg.addDictionary(myDictionary)
```

### .message (term, values)
- **param**
  - term : key of the message to convert, defined in dictionary
  - values: (optional) Object of values to be consumed in the message.
- **return** : **text** converted.

Find the terms in the dictionary and convert to the target message.
```js
var message = myMsg.message('SAY_HELLO')
console.log(message)

var message = myMsg.message('MSG_TEST', { foo: 'foo', bar: 123 })

var _ = myMsg.message.bind(myMsg) // convenient alias
console.log(_('SAY_HELLO'))
```

### .registerFormatter(formatName, formatFunc)
- **param**
  - formatName : **text** for format identifier
  - formatFunc : **callback function (locale, from, options)** to do custom formatting
    - **callback param** :
      - locale: current locale to work
      - from: original value before formatting
      - options: options for custom formatting.
    - **callback return** : **text** converted
- **return** : self (chainable)
`IntlMsg` already has 4 predefined formatters - `dateTime`, `relativeTime`, `list`, `number`. Additionally you can add your own custom formatter.

```js
myMsg.registerFormatter('Capitalize', (locale, from, options) => {
  var word = (typeof from === 'string') ? from : from.toString()
  return word[0].toUpperCase() + word.slice(1).toLowerCase()
})

const myDict = {
  "en" : {
    "translations": {
      "TEST" : "This is a {{value:myFormat}"
    },
    "formatters": {
      "myFormat" : {
        "format": "Capitalize",
      }
    }
  }
}

myMsg.addLocale('en').addDictionary(myDict)
var result = myMsg.message('TEST', { value: 'dog' })
console.log(result) // It will show 'This is a Dog'
```
