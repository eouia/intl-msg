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

console.log(toPossibleLocales([
  'en', 'ko-Kore-KR', 'en-CA', 'en', 'ja-JP'
]))