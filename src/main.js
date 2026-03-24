const isBrowser = (typeof window !== 'undefined')
const NATIVE_INTL = typeof Intl !== 'undefined' ? Intl : null


function sanitizeLocaleInput(locale) {
  if (typeof locale !== 'string') return null
  return locale.replace(/_/g, '-')
}

function createLocaleInfo(locale, intlApi) {
  const sanitizedLocale = sanitizeLocaleInput(locale)
  if (!sanitizedLocale) return null

  try {
    const canonicalLocales = intlApi.getCanonicalLocales(sanitizedLocale)
    const canonicalLocale = Array.isArray(canonicalLocales) ? canonicalLocales[0] : canonicalLocales
    const localeInfo = {
      original: locale,
      sanitized: sanitizedLocale,
      canonical: canonicalLocale,
      baseName: canonicalLocale,
    }

    if (typeof intlApi.Locale === 'function') {
      const intlLocale = new intlApi.Locale(canonicalLocale)
      localeInfo.baseName = intlLocale.baseName || canonicalLocale
      localeInfo.language = intlLocale.language
      localeInfo.script = intlLocale.script
      localeInfo.region = intlLocale.region
    }

    return localeInfo
  } catch (e) {
    return null
  }
}

function normalizeToBcp47 (locale, intlApi, func = ()=>{}) {
  const localeInfo = createLocaleInfo(locale, intlApi)
  if (!localeInfo) return null
  const canonicalLocales = [localeInfo.canonical]
  if (typeof func === 'function') func(canonicalLocales)
  return localeInfo.canonical
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

function parsePlaceholderExpression(expression) {
  if (typeof expression !== 'string') return null
  const trimmed = expression.trim()
  if (!trimmed) return null

  const match = trimmed.match(/^(?<path>[A-Za-z_$][\w$]*(?:\[\d+\]|\[(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')\]|\.[A-Za-z_$][\w$]*)*)(?::(?<formatter>\w+))?$/)
  if (!match?.groups?.path) return null

  return {
    path: match.groups.path,
    formatter: match.groups.formatter || null,
  }
}

function parsePathSegments(path) {
  const segments = []
  let cursor = 0

  while (cursor < path.length) {
    if (path[cursor] === '.') {
      cursor += 1
    }

    const remaining = path.slice(cursor)
    const identifierMatch = remaining.match(/^[A-Za-z_$][\w$]*/)
    if (identifierMatch) {
      segments.push(identifierMatch[0])
      cursor += identifierMatch[0].length
      continue
    }

    const numericIndexMatch = remaining.match(/^\[(\d+)\]/)
    if (numericIndexMatch) {
      segments.push(Number(numericIndexMatch[1]))
      cursor += numericIndexMatch[0].length
      continue
    }

    const quotedKeyMatch = remaining.match(/^\[(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)')\]/)
    if (quotedKeyMatch) {
      const rawKey = quotedKeyMatch[1] ?? quotedKeyMatch[2] ?? ''
      const quote = quotedKeyMatch[1] != null ? '"' : "'"
      const unescapedKey = rawKey.replace(new RegExp(`\\\\${quote}`, 'g'), quote).replace(/\\\\/g, '\\')
      segments.push(unescapedKey)
      cursor += quotedKeyMatch[0].length
      continue
    }

    return null
  }

  return segments
}

function resolvePathValue(root, path) {
  const segments = parsePathSegments(path)
  if (!Array.isArray(segments) || segments.length < 1) {
    return { found: false, value: undefined }
  }

  let current = root
  for (const segment of segments) {
    if (current == null) return { found: false, value: undefined }
    if (typeof segment === 'number') {
      if (!Array.isArray(current) || segment < 0 || segment >= current.length) {
        return { found: false, value: undefined }
      }
      current = current[segment]
      continue
    }
    if (!Object(current) || !hasOwn(Object(current), segment)) {
      return { found: false, value: undefined }
    }
    current = current[segment]
  }

  return { found: true, value: current }
}

function toDate (dateLike) {
  if (dateLike instanceof Date) return new Date(dateLike.getTime())
  var date = new Date(dateLike)
  if (date.toString() === 'Invalid Date') return dateLike
  return date
}

function isRangeObject(value) {
  return isPlainObject(value) && Object.hasOwn(value, 'start') && Object.hasOwn(value, 'end')
}

function getSupportedIntlValues(intlApi, key) {
  if (typeof intlApi.supportedValuesOf !== 'function') return null
  try {
    return intlApi.supportedValuesOf(key)
  } catch (e) {
    return null
  }
}

function normalizeIntlOptionValue(key, value) {
  if (typeof value !== 'string') return value
  if (key === 'currency') return value.toUpperCase()
  if (key === 'calendar' || key === 'numberingSystem' || key === 'unit') return value.toLowerCase()
  return value
}

function normalizeRelativeTimeUnit(intlApi, unit) {
  const normalizedUnit = normalizeIntlOptionValue('unit', unit)
  const supportedUnits = getSupportedIntlValues(intlApi, 'unit')
  if (!supportedUnits) return normalizedUnit
  if (supportedUnits.includes(normalizedUnit)) return normalizedUnit
  if (normalizedUnit.endsWith('s')) {
    const singularUnit = normalizedUnit.slice(0, -1)
    if (supportedUnits.includes(singularUnit)) return singularUnit
  }
  return normalizedUnit
}

function validateIntlOptions(intlApi, options = {}, log = DEFAULT_LOGGER) {
  if (!isPlainObject(options)) return { valid: false, options }

  const supportedOptionKeys = ['currency', 'unit', 'calendar', 'numberingSystem']
  for (const key of supportedOptionKeys) {
    if (!Object.hasOwn(options, key)) continue

    const normalizedValue = normalizeIntlOptionValue(key, options[key])
    const supportedValues = getSupportedIntlValues(intlApi, key)
    if (!supportedValues) {
      options[key] = normalizedValue
      continue
    }

    if (!supportedValues.includes(normalizedValue)) {
      log.warn(`Invalid Intl option '${key}':`, normalizedValue)
      return { valid: false, options }
    }

    options[key] = normalizedValue
  }

  return { valid: true, options }
}

function toPossibleLocales(locales = [], intlApi) {
  if (!(Array.isArray(locales) && locales.length > 0)) return []
  return locales.reduce((result, locale) => {
    const localeInfo = createLocaleInfo(locale, intlApi)
    if (!localeInfo) return result

    if (!result.includes(localeInfo.canonical)) result.push(localeInfo.canonical)

    var lcParts = localeInfo.baseName.split('-')
    while(lcParts.length > 0) {
      var search = lcParts.join('-')
      if (!result.includes(search)) result.push(search)
      lcParts.pop()
    }
    return result
  }, [])
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key)
}

function resolveIntl(intlPolyfill = null) {
  const required = [
    'getCanonicalLocales',
    'PluralRules',
    'DateTimeFormat',
    'RelativeTimeFormat',
    'ListFormat',
    'NumberFormat',
  ]

  if (
    intlPolyfill !== null
    && typeof intlPolyfill === 'object'
    && required.every((key) => hasOwn(intlPolyfill, key))
  ) {
    return intlPolyfill
  }

  if (NATIVE_INTL && required.every((key) => hasOwn(NATIVE_INTL, key))) {
    return NATIVE_INTL
  }

  throw new Error(
    "This module requires an Intl implementation with getCanonicalLocales, PluralRules, DateTimeFormat, RelativeTimeFormat, ListFormat, and NumberFormat."
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
  constructor (locale, intlApi) {
    normalizeToBcp47(locale, intlApi, (lc) => {
      this.#name = (Array.isArray(lc)) ? lc[0] || locale : locale
    })
    if (!this.#name) throw new Error(`Invalid locale name '${locale}' as dictionary`)
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
  #intl = null
  #locales = []
  #formatters = {}
  #log = DEFAULT_LOGGER

  constructor ({ log = null, intlPolyfill = null, verbose = false } = {}) {
    this.#intl = resolveIntl(intlPolyfill)
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
      normalizeToBcp47(lc, this.#intl, (filtered) => {
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
    var lc = normalizeToBcp47(locale, this.#intl)
    if (!lc) return this
    var dictionary = this.getDictionary(lc)
    if (!(dictionary instanceof Dictionary)) {
      dictionary = new Dictionary(lc, this.#intl)
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
    var lc = normalizeToBcp47(locale, this.#intl)
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
      for (let lc of toPossibleLocales([rootLc], this.#intl)) {
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
    const placeholderPattern = /{{\s*([^{}]+?)\s*}}/gm

    return message.replace(placeholderPattern, (placeholder, expression) => {
      const parsed = parsePlaceholderExpression(expression)
      if (!parsed) return placeholder

      const resolved = resolvePathValue(options, parsed.path)
      if (!resolved.found) return placeholder

      let val = resolved.value
      if (parsed.formatter) {
        const formatterDefinition = this.#dictionaries.get(dictionaryName)?.getFormatter(parsed.formatter)
        const formatterConfig = isPlainObject(formatterDefinition) ? { ...formatterDefinition } : formatterDefinition
        const format = formatterConfig?.format

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
          }
        }
      }

      return val
    })
  }

  

  #initFormatters () {
    const intlApi = this.#intl
    this.registerFormatter('pluralRules', function({locales, value, options, rules}) {
      if (isNaN(value)) return ''
      var plural = new intlApi.PluralRules(locales, options).select(value)
      return rules?.[plural] ?? rules?.other ?? ''
    })
    this.registerFormatter('pluralRange', ({locales, value, options, rules}) => {
      if (!isRangeObject(value)) return rules?.other ?? `${value?.toString() || value}`
      if (isNaN(value.start) || isNaN(value.end)) return rules?.other ?? `${value.start} - ${value.end}`

      var pluralRules = new intlApi.PluralRules(locales, options);
      if (typeof pluralRules.selectRange !== 'function') {
        this.#log.warn("Formatter 'pluralRange' requires Intl.PluralRules.prototype.selectRange support.")
        return rules?.other ?? `${value.start}-${value.end}`
      }

      var plural = pluralRules.selectRange(value.start, value.end);
      return rules?.[plural] ?? rules?.other ?? ''
    })
    this.registerFormatter('list', function ({locales, value, options = {}}) {
      if (!Array.isArray(value)) return value?.toString() || value
      return new intlApi.ListFormat(locales, options).format(value)
    })
    this.registerFormatter('number', ({locales, value, options = {}} = {}) => {
      if (isNaN(value)) return value?.toString() || value
      var { valid, options: validatedOptions } = validateIntlOptions(intlApi, options, this.#log)
      if (!valid) return value?.toString() || value
      var ret = new intlApi.NumberFormat(locales, validatedOptions).format(value)
      return ret
    })
    this.registerFormatter('numberRange', ({locales, value, options = {}} = {}) => {
      if (!isRangeObject(value)) return value?.toString() || value
      if (isNaN(value.start) || isNaN(value.end)) return `${value.start} - ${value.end}`

      var { valid, options: validatedOptions } = validateIntlOptions(intlApi, options, this.#log)
      if (!valid) return `${value.start} - ${value.end}`

      var formatter = new intlApi.NumberFormat(locales, validatedOptions);
      if (typeof formatter.formatRange !== 'function') {
        this.#log.warn("Formatter 'numberRange' requires Intl.NumberFormat.prototype.formatRange support.")
        return `${formatter.format(value.start)} - ${formatter.format(value.end)}`
      }
      return formatter.formatRange(value.start, value.end)
    })
    this.registerFormatter('select', function({locales, value, options}) {
      if (options?.[value]) return options?.[value]
      return options?.["other"] ?? value?.toString() ?? value
    })
    this.registerFormatter('dateTime', ({locales, value, options = {}}) => {
      var date = toDate(value)
      if (!(date instanceof Date)) return value
      var { valid, options: validatedOptions } = validateIntlOptions(intlApi, options, this.#log)
      if (!valid) return value
      return new intlApi.DateTimeFormat(locales, validatedOptions).format(date)
    })
    this.registerFormatter('dateTimeRange', ({locales, value, options = {}}) => {
      if (!isRangeObject(value)) return value?.toString() || value

      var start = toDate(value.start)
      var end = toDate(value.end)
      var { valid, options: validatedOptions } = validateIntlOptions(intlApi, options, this.#log)

      if (!valid) return `${value.start} - ${value.end}`

      var formatter = new intlApi.DateTimeFormat(locales, validatedOptions);

      if (!(start instanceof Date) || !(end instanceof Date)) return `${value.start} - ${value.end}`
      if (typeof formatter.formatRange !== 'function') {
        this.#log.warn("Formatter 'dateTimeRange' requires Intl.DateTimeFormat.prototype.formatRange support.")
        return `${formatter.format(start)} - ${formatter.format(end)}`
      }
      return formatter.formatRange(start, end)
    })
    this.registerFormatter('relativeTime', ({locales, value, options = {}, unit='seconds'}) => {
      if (isNaN(value)) return value?.toString() || value
      var normalizedUnit = normalizeRelativeTimeUnit(intlApi, unit)
      var { valid, options: validatedOptions } = validateIntlOptions(intlApi, options, this.#log)
      var supportedUnits = getSupportedIntlValues(intlApi, 'unit')

      if (!valid) return value?.toString() || value
      if (supportedUnits && !supportedUnits.includes(normalizedUnit)) {
        this.#log.warn("Invalid Intl option 'unit':", normalizedUnit)
        return value?.toString() || value
      }

      return new intlApi.RelativeTimeFormat(locales, validatedOptions).format(value, normalizedUnit)
    })
    this.registerFormatter('duration', ({locales, value, options = {}}) => {
      if (typeof intlApi.DurationFormat !== 'function') {
        this.#log.warn("Formatter 'duration' requires Intl.DurationFormat support.")
        return isPlainObject(value) ? JSON.stringify(value) : value?.toString() || value
      }
      if (!isPlainObject(value)) return value?.toString() || value
      var { valid, options: validatedOptions } = validateIntlOptions(intlApi, options, this.#log)
      if (!valid) return isPlainObject(value) ? JSON.stringify(value) : value?.toString() || value
      return new intlApi.DurationFormat(locales, validatedOptions).format(value)
    })
    this.registerFormatter('humanizedRelativeTime', ({locales, value, options = {}}) => {
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
      var normalizedUnit = normalizeRelativeTimeUnit(intlApi, unit)
      var { valid, options: validatedOptions } = validateIntlOptions(intlApi, options, this.#log)
      var supportedUnits = getSupportedIntlValues(intlApi, 'unit')

      if (!valid) return value
      if (supportedUnits && !supportedUnits.includes(normalizedUnit)) {
        this.#log.warn("Invalid Intl option 'unit':", normalizedUnit)
        return value
      }

      return new intlApi.RelativeTimeFormat(locales, validatedOptions).format(gap, normalizedUnit)
    })
    return this
  }

  registerFormatter (format, func) {
    if (typeof func === 'function') { this.#formatters[format] = func }
    return this
  }
}

export default IntlMsg
