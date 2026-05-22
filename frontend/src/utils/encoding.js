const MOJIBAKE_HINT_RE = /(?:Ã.|Â.|â.|ç.|æ.|å.|ä.)|[ÃÂâäåæçèéêëìíîïðñòóôõöøùúûüýÿœ€™©®§]/
const CJK_RE = /[\u4e00-\u9fff]/g
const LATIN1_NOISE_RE = /[\u00c0-\u00ff§©®]/g

const countMatches = (value, regex) => {
  const matches = value.match(regex)
  return matches ? matches.length : 0
}

const scoreText = value => {
  const chineseCount = countMatches(value, CJK_RE)
  const latinNoiseCount = countMatches(value, LATIN1_NOISE_RE)
  const replacementCount = (value.match(/�/g) || []).length
  return chineseCount * 3 - latinNoiseCount * 2 - replacementCount * 4
}

const decodeLatin1Utf8Once = value => {
  const bytes = Uint8Array.from(Array.from(value, char => char.charCodeAt(0) & 0xff))
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

const decodeBestEffort = value => {
  let best = value
  let current = value

  for (let i = 0; i < 3; i++) {
    let decoded
    try {
      decoded = decodeLatin1Utf8Once(current)
    } catch (error) {
      break
    }

    if (!decoded || decoded === current) {
      break
    }

    if (scoreText(decoded) > scoreText(best)) {
      best = decoded
      current = decoded
    } else {
      break
    }
  }

  return best
}

export const fixMojibakeText = value => {
  if (typeof value !== 'string' || !value) {
    return value
  }

  if (!MOJIBAKE_HINT_RE.test(value)) {
    return value
  }

  return decodeBestEffort(value)
}

export const normalizeEncoding = value => {
  if (typeof value === 'string') {
    return fixMojibakeText(value)
  }

  if (Array.isArray(value)) {
    return value.map(item => normalizeEncoding(item))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeEncoding(item)])
    )
  }

  return value
}
