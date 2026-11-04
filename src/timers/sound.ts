/** Pitidos con Web Audio (sin archivos). iOS requiere crearlo tras un toque del usuario. */
let ctx: AudioContext | null = null

export function unlockAudio() {
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch { /* sin audio */ }
}

export function beep(kind: 'tick' | 'short' | 'long' | 'end') {
  if (!ctx) return
  const tones: [freq: number, start: number, dur: number][] =
    kind === 'tick' ? [[520, 0, 0.06]]
      : kind === 'short' ? [[660, 0, 0.12]]
      : kind === 'long' ? [[990, 0, 0.45]]
        : [[990, 0, 0.25], [990, 0.35, 0.25], [1320, 0.7, 0.6]]
  for (const [freq, start, dur] of tones) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = freq
    const t0 = ctx.currentTime + start
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(kind === 'tick' ? 0.08 : 0.25, t0 + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t0)
    osc.stop(t0 + dur + 0.02)
  }
}
