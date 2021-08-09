INTL = Intl
LOG = console

function checkLoggable (obj) {
  return ['log', 'info', 'warn', 'error'].every((m) => {
    return obj?.hasOwnProperty(m) && typeof obj[m] === 'function'
  })
}

function applyIntl(obj) {
  const required = [
    'getCanonicalLocales', 'PluralRules', 'DateTimeFormat', 'RelativeTimeFormat',
    'ListFormat', 'NumberFormat', 'Locale'
  ]
  if (
    typeof obj === 'object'
    && required.every((p) => {
      return obj?.hasOwnProperty(p) && typeof obj[m] === 'function'
    })
  ) INTL = obj
  if (!INTL.hasOwnProperty(required[0])) throw new Error(
    "This module requires native 'Intl' feature or representative polyfill injection."
  )
}

function bcp47ize (locale, func = () => {}) {
  const error = (locale) => {
    throw new Error(`Invalid locale identifier: ${locale.toString() || String(locale)}`)
  }
  if (typeof locale !== 'string') error(locale)
  var lc = locale.replace(/_/g, '-') // For non BCP47 format
  try {
    console.log('1', lc)
    var rlc = INTL.getCanonicalLocales(lc)
    console.log('2', rlc)
    loc = (Array.isArray(rlc)) ? rlc[0] : rlc
    if (typeof func === 'function') func(loc)
  } catch (e) {
    error(locale)
  }
  return lc
}

function toArray(item) {
  if (Array.isArray(item) || item instanceof Set) return [...item]
  if (typeof item === 'string' || item instanceof String) return [item]
  return []
}

class Dictionary {
  #terms = new Map()
  #name = ''
  #formatters = new Map()

  constructor (locale) {
    var name = bcp47ize(locale)
    if (!name) throw new Error (`Invalid locale identifier ${name}.`)
    this.#name = name
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



class IntlMsg {
  #dictionaries = new Map()
  #locales = []
  #formatters = new Map()

  constructor ({log = null, verbose = false, intlPolyfill = null} = {}) {
    if (verbose && typeof log === 'object' && checkLoggable(log)) LOG = log
    applyIntl(intlPolyfill)
  }

  getLocale () {
    return [...this.#locales]
  }

  setLocale (locale) {
    this.#locales = []
    this.addLocale(locale)
    return this
  }

  addLocale (locale) {
    var locales = toArray(locale)
    console.log('@', locales)
    locales.forEach((lc) => {
      bcp47ize(lc, (converted) => {
        if (converted) this.#locales.push(converted)
      })
    })
    return this
  }
}


var M = new IntlMsg()
M.setLocale('en_US')
M.addLocale('en-UK')
M.addLocale(['ko-KR', 'en-CA'])
console.log(M.getLocale())