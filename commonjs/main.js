const isBrowser = (typeof window !== 'undefined')

var INTL = null
if (typeof Intl !== 'undefined') {
  INTL = Intl
}


function bcp47ize (locale, func = ()=>{}) {
  var lc = locale.replace(/_/g, '-') // For non BCP47 format
  try {
    lc = INTL.getCanonicalLocales(lc)
    if (typeof func === 'function') func(lc)
  } catch (e) {
    var error = new Error(`${lc} is not a valid locale name.`)
    return null
  }
  return (Array.isArray(lc)) ? lc[0] : lc
}

function isPlainObject(value) {
	if (Object.prototype.toString.call(value) !== '[object Object]') {
		return false;
	}

	const prototype = Object.getPrototypeOf(value);
	return prototype === null || prototype === Object.prototype;
}

function toArray (item) {
  if(!item) return []
  return [...((Array.isArray(item)) ? [...item] : [item])]
}

function toShortStr (something, len = 20) {
  var c = (something?.toString() || String(something))
  return (c.length > len) ? c.slice(0, len) + '...' : c
}

function toDate (dateLike) {
  if (dateLike instanceof Date) return new Date(dateLike.getTime())
  var date = new Date(dateLike)
  if (date.toString === 'Invalid Date') return dateLike
  return date
}

function toPossibleLocales(locales = []) {
  if (!(Array.isArray(locales) && locales.length > 0)) return []
  return locales.reduce((result, locale) => {
    var lcParts = locale.split('-')
    while(lcParts.length > 0) {
      var search = lcParts.join('-')
      if (!result.includes(search)) result.push(search)
      lcParts.pop()
    }
    return result
  }, [])
}

function applyIntl(obj) {
  const required = [
    'getCanonicalLocales', 'PluralRules', 'DateTimeFormat', 'RelativeTimeFormat',
    'ListFormat', 'NumberFormat'
  ]
  if (
    typeof obj === 'object'
    && required.every((p) => {
      return obj.hasOwnProperty(p)
    })
  ) INTL = obj
  if (!INTL.hasOwnProperty(required[0])) throw new Error(
    "This module requires native 'Intl' feature or representative polyfill injection."
  )
}

var _log = {
  log: () => {},
  info: () => {},
  warn: () => {},
  error: () => {}
}

class Dictionary {
  #terms = new Map()
  #formatters = new Map()
  #name = ''
  constructor (locale) {
    bcp47ize(locale, (lc) => {
      this.#name = (Array.isArray[lc]) ? lc[0] || locale : 
    })
    if (!this.#name) throw new Error(`Invalid locale name '${locale}' as dictionary`)
    this.setTerm('TEST', 'This is a test phrase by default.')
  }
  setTerm (key, message) {
    return this.#terms.set(key, message)
  }
  getTerm (key) {
    return this.#terms.get(key)
  }
  getName () {
    return this.#name
  }
  setFormatter (key, formatter) {
    return this.#formatters.set(key, formatter)
  }
  getFormatter (key, formatter) {
    return this.#formatters.get(key, formatter)
  }
}

class INTLMsg {
  #dictionaries = new Map()
  #locales = []
  #formatters = {}

  constructor ({ log = null, intlPolyfill = null, verbose = false } = {}) {
    applyIntl(intlPolyfill)
    if (!INTL.hasOwnProperty('getCanonicalLocales')) throw new Error("This module required native 'Intl' module or ")
    this.#initFormatter()
    this.setLogger(log, verbose)
  }

  static factory ({ log = null, intlPolyfill = null, verbose = false } = {}) {
    return new INTLMsg({ log, intlPolyfill })
  }

  setLogger (log = null, verbose = false) {
    const required = ['log', 'info', 'warn', 'error']
    if (required.every((m) => { return log.hasOwnProperty(m)}) && verbose) _log = log
  }

  getLocale () {
    return [...this.#locales]
  }


  setLocale (locales = []) {
    this.#locales = []
    this.addLocale(locales)
    return this
  }


  addLocale (locales = []) {
    var newLocales = toArray(locales) 
    if (newLocales.length < 1) return this
    newLocales.forEach((lc) => {
      bcp47ize(lc, (filtered) => {
        if (!(Array.isArray(filtered) && filtered.length >= 1)) return
        filtered.forEach((f) => {
          if (this.#locales.includes(f)) return
          this.#locales.push(f)
        })
      }) 
    })
    return this
  }

  parseJsonToDictionary(json = {}) {
    if (typeof json !== 'object') {
      _log.warn('Invalid dictionary data:', toShortStr(json))
      return this
    }
    json.keys().forEach((locale) => {
      var dict = json[locale]
      this.addJsonToDictionaryWithLocale(locale, dict)
    })
    return this
  }

  addJsonToDictionaryWithLocale(locale, {translations = {}, formatters = {}}) {
    var dictionary = this.getDictionary(locale)
    if (!(dictionary instanceof Dictionary)) return this
    if (translations && typeof translations === 'object') {
      for(let [key, value] of Object.entries(translations)) {
        if (typeof key === 'string')
        dictionary.setTerm(key, value)
      }
    }
    if (formatters && typeof formatters === 'object') {
      for(let [key, value] of Object.entries(formatters)) {
        if (typeof key === 'string')
        dictionary.setFormatter(key, value)
      }
    }
    return this
  } 

  getDictionary(locale) {
    var lc = bcp47ize(locale)
    if (this.#dictionaries.has(lc)) return this.#dictionaries.get(lc)
    return null
  }

  addTermToDictionary(locale, key, value) {
    var dict = this.getDictionary(locale)
    if (dict instanceof Dictionary) dict.addTerm(key, value)
    return this
  }
  
  getTermFromDictionary(locale, key) {
    var dict = this.getDictionary(locale)
    return this.#demandDictionary(locale).getTerm(key)
  }

  getDictionaryNames () {
    return [...this.#dictionaries.keys())]
  }

  #findTerms (key, locales = null) {
    var message = key
    var dictionaryName = null
    var locales = (locales) ? toArray(locales) : [...this.#locales]

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
      originalLocale: originalLocale,
    }
  }

  getRawMessage(key, locales = null) {
    var { message } = this.#findTerms(key, locales)
    return message
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
              _log.error (`Formatter '${format}' call error.`)
              _log.error({
                key: key,
                options: options,
              })
              return null
            }
          }
        }
        message = message.replace(ph, val)
        return i?.groups
      })
    }
    return message
  }

  

  #initFormatter () {
    this.registerFormatter('pluralRules', function({locales, value, options, rules}) {
      if (isNaN(value)) return ''
      var plural = new INTL.PluralRules(locales, options).select(value)
      return rules?.[plural] ?? rules?.other ?? ''
    })
    this.registerFormatter('list', function ({locales, value, options = {}}) {
      if (!Array.isArray(value)) return value?.toString() || value
      return new INTL.ListFormat(locales, options).format(value)
    })
    this.registerFormatter('number', function ({locales, value, options = {}} = {}) {
      if (isNaN(value)) return value?.toString() || value
      var ret = new INTL.NumberFormat(locales, options).format(value)
      return ret
    })
    this.registerFormatter('select', function({locales, value, options}) {
      if (options?.[value]) return options?.[value]
      return options?.["other"] ?? value?.toString() ?? value
    })
    this.registerFormatter('dateTime', function ({locales, value, options = {}}) {
      var date = toDate(value)
      if (!(date instanceof Date)) return value
      return new INTL.DateTimeFormat(locales, options).format(date)
    })
    this.registerFormatter('relativeTime', function ({locales, value, options = {}, unit='seconds'}) {
      if (isNaN(value)) return value?.toString() || value
      return new INTL.RelativeTimeFormat(locales, options).format(value, unit)
    })
    this.registerFormatter('humanizedRelativeTime', function({locales, value, options = {}}) {
      var date = toDate(value)
      if (!(date instanceof Date)) return value
      var unit = 'seconds'
      var now = Date.now()
      var diff = Math.round((date - now) / 1000)
      var aDiff = Math.abs(diff)
      var gap = diff
      const rules = [
        ['minutes', 60] ,
        ['hours', 60 * 60],
        ['days', 60 * 60 * 24],
        ['weeks', 60 * 60 * 24 * 7],
        ['months',  60 * 60 * 24 * 30],
        ['quarters', 60 * 60 * 24 * 90],
        ['years', 60 * 60 * 24 * 365]
      ]
      for (let [u, f] of rules) {
        if (Math.floor(aDiff / f) < 1) continue
        unit = u
        gap = Math.floor(diff / f)
      }
      return new INTL.RelativeTimeFormat(locales, options).format(gap, unit)
    })
    return this
  }

  registerFormatter (format, func) {
    if (typeof func === 'function') { this.#formatters[format] = func }
    return this
  }
}

module.exports = INTLMsg