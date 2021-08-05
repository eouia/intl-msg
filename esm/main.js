const isBrowser = (typeof window !== 'undefined')

if (typeof Intl === 'undefined') {
  throw new Error(`'Intl' is not supported in your browser or nodeJS. Check the version.`)
}

function purify (locale) {
  var lc = locale.replace(/_/g, '-') // For non BCP47 format
  try {
    return Intl.getCanonicalLocales(lc)
  } catch (e) {
    // console.log(`${lc} is not a valid locale name.`)
  }
}

function isPlainObject(value) {
	if (Object.prototype.toString.call(value) !== '[object Object]') {
		return false;
	}

	const prototype = Object.getPrototypeOf(value);
	return prototype === null || prototype === Object.prototype;
}


export class IntlMsg {
  #dictionaries = {}
  #locales = []
  constructor (locales = [], dictionaries = {}) {
    this.setLocale(locales)
    this.setDictionary(dictionaries)
  }

  static factory (locales = [], dictionaries = {}) {
    return new IntlMsg(locales, dictionaries)
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

  message (key, valObj = {}) {
    var { message, dictionaryName, originalLocale } = this.#findTerms(key)

    for (const prop of Object.keys(opts)) {
      var pattern = `{{((?<t>${prop})((?:\\:)(?<f>\\w+))?)}}`
      var rx = new RegExp(pattern, 'gm')
      var found = [...text.matchAll(rx)].map((i) => {
        var val = opts[prop]
        var ph = i[0]
        var groups = i?.groups
        if (groups.f) {
          console.log(groups)
          /*
          var formatter = formatters[groups.f] ?? {}
          var { format, options } = formatter
          if (format) {
            if (typeof this.#formatters[format] === 'function') {
              val = this.#formatters[format](locale, val, options)
            }
          }
          */
        }
        /*
        if (groups.r) {
          var { match, options } = pluralRules[groups.r] ?? {}
          var plural = new Intl.PluralRules(locale, options).select(val)
          val = match?.[plural] ?? match?.other ?? val
        }
        */
        text = text.replace(ph, val)
        return i?.groups
      })
    }
    return text
  }

  #findTerms (key) {
    // locales: ['en-GB', 'de', 'en', 'fr']
    // dictionaries : 'en', 'de-DE', 'en-GB'
    // => en-GB:en-GB, en-GB:en, de:X, en:en, en:en-GB, fr:X
    // return message, dictLocale,
    var message = key
    var dictionaryName = null
    var locales = [...this.#locales]

    const dictionaryList = Object.keys(this.#dictionaries)

    var found = null,
    var originalLocale = null
    for (let lc of locales) {
      if (found) continue
      var lcParts = lc.split('-')
      while(lcParts.length > 0) {
        var search = lcParts.join('-')
        if (dictionaryList.includes(search)) {
          found = search
          originalLocale = lc
          lcParts = []
        } else {
          lcParts.pop()
        }
      }
    }

    if (!found) return { message: key, dictionaryName: null}
    return {
      message: this.#dictionaries[found],
      dictionaryName: found,
      originalLocale: originalLocale
    }
  }

}