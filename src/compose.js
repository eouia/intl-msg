function isPlainObject(value) {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === null || prototype === Object.prototype
}

function mergeDictionaryEntry(target = {}, source = {}) {
  const mergedTranslations = {
    ...(isPlainObject(target.translations) ? target.translations : {}),
    ...(isPlainObject(source.translations) ? source.translations : {}),
  }
  const mergedFormatters = {
    ...(isPlainObject(target.formatters) ? target.formatters : {}),
    ...(isPlainObject(source.formatters) ? source.formatters : {}),
  }

  const result = {}
  if (Object.keys(mergedTranslations).length > 0) result.translations = mergedTranslations
  if (Object.keys(mergedFormatters).length > 0) result.formatters = mergedFormatters
  return result
}

function mergeDictionaries(target = {}, source = {}) {
  if (!isPlainObject(source)) return target

  const result = { ...target }
  for (const locale of Object.keys(source)) {
    const existingEntry = isPlainObject(result[locale]) ? result[locale] : {}
    const nextEntry = isPlainObject(source[locale]) ? source[locale] : null
    if (!nextEntry) continue
    result[locale] = mergeDictionaryEntry(existingEntry, nextEntry)
  }
  return result
}

export async function composeDictionaries(plan = [], loader, options = {}) {
  if (!Array.isArray(plan)) throw new TypeError('plan must be an array')
  if (typeof loader !== 'function') throw new TypeError('loader must be a function')

  const onError = options.onError ?? 'throw'
  let merged = {}

  for (const entry of plan) {
    try {
      const loaded = await loader(entry)
      if (!loaded) continue
      merged = mergeDictionaries(merged, loaded)
    } catch (error) {
      if (onError === 'skip') continue
      throw error
    }
  }

  return merged
}

export default composeDictionaries
