function defaultResolvePath({ locale, source }) {
  return `./dictionaries/${source}/${locale}.json`
}

function defaultResolveUrl({ locale, source }) {
  return `/dictionaries/${source}/${locale}.json`
}

export function createMemoryLoader(registry = {}) {
  return async function memoryLoader({ locale, source }) {
    return registry?.[source]?.[locale] ?? null
  }
}

export function createFetchLoader({
  resolveUrl = defaultResolveUrl,
  fetchImpl = globalThis.fetch,
  parse = async (response) => response.json(),
} = {}) {
  if (typeof resolveUrl !== 'function') throw new TypeError('resolveUrl must be a function')
  if (typeof fetchImpl !== 'function') throw new TypeError('fetchImpl must be a function')
  if (typeof parse !== 'function') throw new TypeError('parse must be a function')

  return async function fetchLoader(entry) {
    const url = await resolveUrl(entry)
    if (!url) return null

    const response = await fetchImpl(url)
    if (!response?.ok) return null

    const dictionary = await parse(response)
    return dictionary ?? null
  }
}

export function createPathLoader({
  resolvePath = defaultResolvePath,
  readFile,
  parse = JSON.parse,
} = {}) {
  if (typeof resolvePath !== 'function') throw new TypeError('resolvePath must be a function')
  if (typeof readFile !== 'function') throw new TypeError('readFile must be a function')
  if (typeof parse !== 'function') throw new TypeError('parse must be a function')

  return async function pathLoader(entry) {
    const path = await resolvePath(entry)
    if (!path) return null

    try {
      const fileContents = await readFile(path, 'utf8')
      const dictionary = await parse(fileContents)
      return dictionary ?? null
    } catch (error) {
      if (error && (error.code === 'ENOENT' || error.code === 'ENOTDIR')) return null
      throw error
    }
  }
}

export default {
  createMemoryLoader,
  createFetchLoader,
  createPathLoader,
}
