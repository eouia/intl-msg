const isBrowser = (typeof window !== 'undefined')

var _intl = null
if (typeof Intl !== 'undefined') {
  _intl = Intl
}


function normalizeToBcp47 (locale, func = ()=>{}) {
  var lc = locale.replace(/_/g, '-') // For non BCP47 format
  try {
    lc = _intl.getCanonicalLocales(lc)
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
  if (date.toString() === 'Invalid Date') return dateLike
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
    obj !== null && typeof obj === 'object'
    && required.every((p) => {
      return obj.hasOwnProperty(p)
    })
  ) _intl = obj
  if (!_intl || !_intl.hasOwnProperty(required[0])) throw new Error(
    "This module requires native 'Intl' feature or representative polyfill injection."
  )
}

const DEFAULT_LOGGER = {
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
    normalizeToBcp47(locale, (lc) => {
      this.#name = (Array.isArray(lc)) ? lc[0] || locale : locale
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
  getFormatter (key) {
    return this.#formatters.get(key)
  }
}

class IntlMsg {
  #dictionaries = new Map()
  #locales = []
  #formatters = {}
  #log = DEFAULT_LOGGER

  constructor ({ log = null, intlPolyfill = null, verbose = false } = {}) {
    applyIntl(intlPolyfill)
    if (!_intl.hasOwnProperty('getCanonicalLocales')) throw new Error("This module required native 'Intl' module or ")
    this.#initFormatters()
    this.setLogger(log, verbose)
  }

  static factory ({ log = null, intlPolyfill = null, verbose = false, locales = null, dictionaries = null } = {}) {
    const instance = new IntlMsg({ log, intlPolyfill, verbose })
    if (locales) instance.addLocale(locales)
    if (dictionaries) instance.addDictionary(dictionaries)
    return instance
  }

  setLogger (log = null, verbose = false) {
    if (!log) return
    const required = ['log', 'info', 'warn', 'error']
    if (required.every((m) => { return log.hasOwnProperty(m)}) && verbose) this.#log = log
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
      normalizeToBcp47(lc, (filtered) => {
        if (!(Array.isArray(filtered) && filtered.length >= 1)) return
        filtered.forEach((f) => {
          if (this.#locales.includes(f)) return
          this.#locales.push(f)
        })
      }) 
    })
    return this
  }

  addDictionary(json = {}) {
    if (!isPlainObject(json)) {
      this.#log.warn('Invalid dictionary data:', toShortStr(json))
      return this
    }
    Object.keys(json).forEach((locale) => {
      var dict = json[locale]
      this.#mergeDictionary(locale, dict)
    })
    return this
  }

  #mergeDictionary(locale, dictData = {}) {
    if (!isPlainObject(dictData)) {
      this.#log.warn(`Invalid dictionary entry for locale '${locale}':`, toShortStr(dictData))
      return this
    }

    var {translations = {}, formatters = {}} = dictData
    var lc = normalizeToBcp47(locale)
    if (!lc) return this
    var dictionary = this.getDictionary(lc)
    if (!(dictionary instanceof Dictionary)) {
      dictionary = new Dictionary(lc)
      this.#dictionaries.set(lc, dictionary)
    }
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
    var lc = normalizeToBcp47(locale)
    if (this.#dictionaries.has(lc)) return this.#dictionaries.get(lc)
    return null
  }

  addTermToDictionary(locale, key, value) {
    var dict = this.getDictionary(locale)
    if (dict instanceof Dictionary) dict.setTerm(key, value)
    return this
  }
  
  getTermFromDictionary(locale, key) {
    var dict = this.getDictionary(locale)
    if (!(dict instanceof Dictionary)) return undefined
    return dict.getTerm(key)
  }

  getDictionaryNames () {
    return [...this.#dictionaries.keys()]
  }

  #findTerms (key, locales = null) {
    var rootLocales = locales ? toArray(locales) : [...this.#locales]

    const dictionaryList = [...this.#dictionaries.keys()]
    var found = null
    var originalLocale = null
    for (let rootLc of rootLocales) {
      if (found) break
      for (let lc of toPossibleLocales([rootLc])) {
        if (dictionaryList.includes(lc) && this.#dictionaries.get(lc).getTerm(key) !== undefined) {
          found = lc
          originalLocale = rootLc
          break
        }
      }
    }
    return {
      message: found ? this.#dictionaries.get(found).getTerm(key) : key,
      dictionaryName: found,
      originalLocale: originalLocale,
    }
  }

  getRawMessage(key, locales = null) {
    var { message } = this.#findTerms(key, locales)
    return message
  }

  message (key, options = {}) {
    var { message, dictionaryName, originalLocale } = this.#findTerms(key)

    for (const prop of Object.keys(options)) {
      var pattern = `{{((?<t>${prop})((?:\\:)(?<f>\\w+))?)}}`
      var rx = new RegExp(pattern, 'gm')
      var found = [...message.matchAll(rx)].map((i) => {
        var val = options[prop]
        var placeholder = i[0]
        var groups = i?.groups
        if (groups.f) {
          var formatterDefinition = this.#dictionaries.get(dictionaryName)?.getFormatter(groups.f)
          var formatterConfig = isPlainObject(formatterDefinition) ? { ...formatterDefinition } : formatterDefinition
          var format = formatterConfig?.format
          if (typeof this.#formatters[format] === 'function') {
            try {
              formatterConfig.value = val
              if (formatterConfig.locales == null) formatterConfig.locales = originalLocale
              val = this.#formatters[format](formatterConfig) ?? {}
            } catch (e) {
              this.#log.error (`Formatter '${format}' call error.`)
              this.#log.error({
                key: key,
                formatterConfig: formatterConfig,
              })
              // val은 원본 값으로 유지 → 아래 message.replace(ph, val)에서 원본 값으로 치환
            }
          }
        }
        message = message.replace(placeholder, val)
        return i?.groups
      })
    }
    return message
  }

  

  #initFormatters () {
    this.registerFormatter('pluralRules', function({locales, value, options, rules}) {
      if (isNaN(value)) return ''
      var plural = new _intl.PluralRules(locales, options).select(value)
      return rules?.[plural] ?? rules?.other ?? ''
    })
    this.registerFormatter('list', function ({locales, value, options = {}}) {
      if (!Array.isArray(value)) return value?.toString() || value
      return new _intl.ListFormat(locales, options).format(value)
    })
    this.registerFormatter('number', function ({locales, value, options = {}} = {}) {
      if (isNaN(value)) return value?.toString() || value
      var ret = new _intl.NumberFormat(locales, options).format(value)
      return ret
    })
    this.registerFormatter('select', function({locales, value, options}) {
      if (options?.[value]) return options?.[value]
      return options?.["other"] ?? value?.toString() ?? value
    })
    this.registerFormatter('dateTime', function ({locales, value, options = {}}) {
      var date = toDate(value)
      if (!(date instanceof Date)) return value
      return new _intl.DateTimeFormat(locales, options).format(date)
    })
    this.registerFormatter('relativeTime', function ({locales, value, options = {}, unit='seconds'}) {
      if (isNaN(value)) return value?.toString() || value
      return new _intl.RelativeTimeFormat(locales, options).format(value, unit)
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
      return new _intl.RelativeTimeFormat(locales, options).format(gap, unit)
    })
    return this
  }

  registerFormatter (format, func) {
    if (typeof func === 'function') { this.#formatters[format] = func }
    return this
  }
}

export default IntlMsg
