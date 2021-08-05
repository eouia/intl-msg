const isBrowser = (typeof window !== 'undefined')

if (typeof Intl === 'undefined') {
  throw new Error(`'Intl' is not supported in your browser or nodeJS. Check the version.`)
}

function purify (locale, func = ()=>{}) {
  var lc = locale.replace(/_/g, '-') // For non BCP47 format
  try {
    if (typeof func === 'function') func(Intl.getCanonicalLocales(lc))
  } catch (e) {
    console.error(`${lc} is not a valid locale name.`)
  }
}

function isPlainObject(value) {
	if (Object.prototype.toString.call(value) !== '[object Object]') {
		return false;
	}

	const prototype = Object.getPrototypeOf(value);
	return prototype === null || prototype === Object.prototype;
}

var _log = console

class IntlMsg {
  #dictionaries = {}
  #locales = []
  #formatters = {}

  constructor (locales = [], dictionaries = {}, log = console) {
    this.setLocale(locales)
    this.setDictionary(dictionaries)
    this.#initFormatter()
    this.setLogger(log)
  }

  static factory (locales = [], dictionaries = {}, log = console) {
    return new IntlMsg(locales, dictionaries, { log, debug })
  }

  setLogger (log = console) {
    _log = log
  }

  getLocale () {
    return [...this.#locales]
  }

  setLocale (locales = []) {
    this.#locales = []
    this.addLocale(locales)
  }

  addLocale (locales = []) {
    var newLocales = []
    if (typeof locales === 'string') newLocales.push(locales)
    if (Array.isArray(locales)) newLocales = [...locales]
    if (newLocales.length < 1) return this

    newLocales.forEach((lc) => {
      purify(lc, (filtered) => {

        if (!(Array.isArray(filtered) && filtered.length >= 1)) return
        filtered.forEach((f) => {
          if (this.#locales.includes(f)) return
          this.#locales.push(f)
        })
      })
    })
    return this
  }

  setDictionary (json = {}) {
    this.#dictionaries = {}
    this.addDictionary(json)
  }
  
  addDictionary (json = {}) {
    if (!isPlainObject(json)) return this
    for (let locale of Object.keys(json)) {
      if (this.#dictionaries.hasOwnProperty(locale)) {
        var exist = Object.assign({}, this.#dictionaries[locale])
        this.#dictionaries[locale] = Object.assign({}, exist, json[locale])
      } else {
        this.#dictionaries[locale] = json[locale]
      }
    }
    return this
  }

  message (key, opts = {}) {
    var { message, dictionaryName, originalLocale } = this.#findTerms(key)

    for (const prop of Object.keys(opts)) {
      var pattern = `{{((?<t>${prop})((?:\\:)(?<f>\\w+))?)}}`
      var rx = new RegExp(pattern, 'gm')
      var found = [...message.matchAll(rx)].map((i) => {
        var val = opts[prop]
        var ph = i[0]
        var groups = i?.groups
        if (groups.f) {
          var options = this.#dictionaries[dictionaryName]?.formatters?.[groups.f]
          var format = options?.format
          if (typeof this.#formatters[format] === 'function') {
            try {
              options.value = val
              options.locales ||= originalLocale
              val = this.#formatters[format](options) ?? {}
            } catch (e) {
              _log.log(`Formatter '${format}' call error.`)
              _log.error(e)
            }
          }
        }
        message = message.replace(ph, val)
        return i?.groups
      })
    }
    return message
  }

  #findTerms (key) {
    var message = key
    var dictionaryName = null
    var locales = [...this.#locales]

    const dictionaryList = Object.keys(this.#dictionaries)
    var found = null
    var originalLocale = null
    for (let lc of locales) {
      if (found) continue
      var lcParts = lc.split('-')
      while(lcParts.length > 0) {
        var search = lcParts.join('-')
        if (dictionaryList.includes(search) && this.#dictionaries[search]?.translations?.[key]) {
          found = search
          originalLocale = lc
          lcParts = []
        } else {
          lcParts.pop()
        }
      }
    }

    return {
      message: this.#dictionaries[found]?.translations[key] || key,
      dictionaryName: found,
      originalLocale: originalLocale
    }
  }

  #initFormatter () {
    this.registerFormatter('dateTime', function ({locales, value, options = {}}) {
      if (!(value instanceof Date)) return value.toString() || value
      return new Intl.DateTimeFormat(locales, options).format(value)
    })
    this.registerFormatter('relativeTime', function ({locales, value, options = {}, unit}) {
      if (isNaN(value)) return value?.toString() || value
      return new Intl.RelativeTimeFormat(locales, options).format(value, unit)
    })
    this.registerFormatter('list', function ({locales, value, options = {}}) {
      if (!Array.isArray(value)) return value?.toString() || value
      return new Intl.ListFormat(locales, options).format(value)
    })
    this.registerFormatter('number', function ({locales, value, options = {}} = {}) {
      if (isNaN(value)) return value?.toString() || value
      var ret = new Intl.NumberFormat(locales, options).format(value)
      return ret
    })
    this.registerFormatter('pluralRules', function({locales, value, options, rules}) {
      if (isNaN(value)) return ''
      var plural = new Intl.PluralRules(locales, options).select(value)
      return rules?.[plural] ?? rules?.other ?? ''
    })
  }

  registerFormatter (format, func) {
    if (typeof func === 'function') { this.#formatters[format] = func }
    return this
  }


}

module.exports = IntlMsg