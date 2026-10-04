export interface SpeakOptions {
  /** Override speaking rate for this utterance. */
  rate?: number
  pitch?: number
  browserOnly?: boolean
  voiceName?: string | null
  onStart?: () => void
  onEnd?: () => void
}

let voiceCache: SpeechSynthesisVoice[] = []
let waiters: ((v: SpeechSynthesisVoice[]) => void)[] = []

function primeVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  const grab = () => {
    const list = window.speechSynthesis.getVoices()
    if (list.length) {
      voiceCache = list
      waiters.splice(0).forEach((w) => w(list))
    }
  }
  grab()
  window.speechSynthesis.addEventListener?.('voiceschanged', grab)
}
if (typeof window !== 'undefined') primeVoices()

function voicesReady(timeoutMs = 1200): Promise<SpeechSynthesisVoice[]> {
  if (voiceCache.length) return Promise.resolve(voiceCache)
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return Promise.resolve([])
  const fresh = window.speechSynthesis.getVoices()
  if (fresh.length) {
    voiceCache = fresh
    return Promise.resolve(fresh)
  }
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      resolve(window.speechSynthesis.getVoices())
    }, timeoutMs)
    waiters.push((v) => {
      window.clearTimeout(timer)
      resolve(v)
    })
  })
}

let currentAudioPlayer: HTMLAudioElement | null = null

export function stopAudio() {
  if (typeof window === 'undefined') return
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  if (currentAudioPlayer) {
    try {
      currentAudioPlayer.pause()
      currentAudioPlayer.currentTime = 0
    } catch {}
    currentAudioPlayer = null
  }
}

export function speak(word: string, rateOrOpts?: number | SpeakOptions) {
  const opts: SpeakOptions =
    typeof rateOrOpts === 'number' ? { rate: rateOrOpts } : rateOrOpts ?? {}

  stopAudio()
  fallbackSpeechSynthesis(word, opts)
}

function fallbackSpeechSynthesis(word: string, opts: SpeakOptions) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    opts.onEnd?.()
    return
  }

  window.speechSynthesis.cancel()
  void voicesReady().then((voices) => {
    const u = new SpeechSynthesisUtterance(word)
    u.rate = opts.rate ?? 0.9
    const saved = opts.voiceName ?? null
    const chosen =
      (saved && voices.find((v) => v.name === saved)) ||
      pickChildFriendlyVoice(voices)

    if (chosen) {
      u.voice = chosen
      u.pitch = opts.pitch ?? (saved ? 1.0 : 1.2)
    } else {
      u.pitch = opts.pitch ?? 1.2
    }

    if (opts.onStart) u.onstart = opts.onStart
    u.onend = () => {
      opts.onEnd?.()
    }
    u.onerror = () => {
      opts.onEnd?.()
    }
    window.speechSynthesis.speak(u)
  })
}

export function pickChildFriendlyVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | undefined {
  if (!voices.length) return undefined

  const nonMale = voices.filter((v) => !/david|male|george|mark|guy/i.test(v.name))
  const pool = nonMale.length ? nonMale : voices

  const zira = pool.find((v) => /zira/i.test(v.name))
  if (zira) return zira

  const en = pool.filter((v) => /^en(-|_|$)/i.test(v.lang))
  const enPool = en.length ? en : pool

  const liked = [
    'zira',
    'jenny',
    'aria',
    'samantha',
    'ava',
    'karen',
    'moira',
    'tessa',
    'sonia',
    'libby',
    'allison',
    'nicky',
    'female',
  ]
  for (const name of liked) {
    const hit = enPool.find((v) => v.name.toLowerCase().includes(name))
    if (hit) return hit
  }

  return enPool[0] || pool[0]
}
