import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

const goal = atom({ plugin: 'task-anchor', key: 'goal' } as const, null)
const focus = atom({ plugin: 'task-anchor', key: 'focus' } as const, 1)
const offStreak = atom({ plugin: 'task-anchor', key: 'offStreak' } as const, 0)
const isHidden = atom({ plugin: 'task-anchor', key: 'isHidden' } as const, false)

const DRIFT_BELOW = 0.3
const MIN_WORDS = 3
const MIN_GOAL_WORDS = 4 // a casual line ("on est bon") is not a goal
const STOP = new Set(
  ('le la les un une des de du et ou en au aux ce ces cet cette que qui quoi dont pour par sur dans avec sans est sont ' +
    'etre avoir fait faire peux peut veux vas ton ta tes mon ma mes son sa ses nous vous ils elles pas plus mais donc ' +
    'the a an and or of to in on for with is are be do does can you your my it this that these those not but so ' +
    'please merci stp bon ok oui non alors aussi comme tout tous toute very just').split(' '),
)

// Crude lexical proxy for "is this prompt about the goal": keyword sets, accents folded,
// plural/suffix trimmed. Real semantic distance would need embeddings the mod cannot reach.
const keywords = (text: string): Set<string> =>
  new Set(
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .split(/[^a-z0-9_.\/-]+/)
      .filter(w => w.length > 2 && !STOP.has(w))
      .map(w => w.replace(/(s|x)$/, '')),
  )

// Levenshtein distance, abandoned as soon as it must exceed `max`.
const within = (a: string, b: string, max: number): boolean => {
  if (Math.abs(a.length - b.length) > max) return false
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let low = i
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      cur.push(v)
      if (v < low) low = v
    }
    if (low > max) return false
    prev = cur
  }
  return prev[b.length] <= max
}

// Typos: one edit from 5 letters up, two from 9, none for short words (too many false hits).
const similar = (w: string, set: Set<string>): boolean => {
  if (set.has(w)) return true
  const max = w.length >= 9 ? 2 : w.length >= 5 ? 1 : 0
  if (max === 0) return false
  for (const o of set) if (o[0] === w[0] && within(w, o, max)) return true
  return false
}

const overlap = (a: Set<string>, b: Set<string>): number => {
  if (a.size === 0 || b.size === 0) return 0
  let hits = 0
  for (const w of a) if (similar(w, b)) hits += 1
  return hits / Math.min(a.size, b.size)
}

const bar = (v: number): string => {
  const n = Math.round(Math.max(0, Math.min(1, v)) * 5)
  return '●'.repeat(n) + '○'.repeat(5 - n)
}

// Words of the goal plus words of prompts judged on-topic, so the topic can evolve
// slowly inside the goal's scope instead of being frozen to its first sentence.
let topic = new Set<string>()
let goalWords = new Set<string>()

async function setGoal($: EngineInterface, text: string) {
  goalWords = keywords(text)
  topic = new Set(goalWords)
  await update($, goal, () => text)
  await update($, focus, () => 1)
  await update($, offStreak, () => 0)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'anchor',
      description: 'Set, show or clear the session goal (/anchor <goal> | /anchor clear)',
    })
    return next(e)
  })

  on('command.run', { command: 'anchor' }, async ($, e) => {
    const arg = e.args.trim()
    if (arg === 'clear') {
      await update($, goal, () => null)
      return { text: 'goal cleared.' }
    }
    if (arg === '') {
      const g = await read($, goal)
      return { text: g === null ? 'no goal yet. /anchor <goal>' : `goal: ${g}` }
    }
    await setGoal($, arg)
    return { text: 'goal set. I will watch for drift.' }
  })

  on('prompt.submit', async ($, e, next) => {
    if (e.command || e.isMeta) return next(e)

    const g = await read($, goal)
    if (g === null) {
      // the first substantial prompt defines the session's goal; chit-chat before it is ignored
      if (keywords(e.text).size >= MIN_GOAL_WORDS) await setGoal($, e.text.slice(0, 300))
      return next(e)
    }

    const words = keywords(e.text)
    if (words.size < MIN_WORDS) return next(e) // "oui", "ok vas-y": neutral, no signal

    const score = Math.max(overlap(words, goalWords), overlap(words, topic))
    const prev = await read($, focus)
    const next_ = 0.6 * prev + 0.4 * Math.min(1, score * 1.5)
    await update($, focus, () => next_)

    if (score >= 0.3) {
      for (const w of words) topic.add(w)
      await update($, offStreak, () => 0)
    } else {
      const n = (await read($, offStreak)) + 1
      await update($, offStreak, () => n)
      if (next_ < DRIFT_BELOW && n >= 2) {
        $.ui.toast(`Dérive: ${n} prompts hors du but. /anchor pour redéfinir ou continuer.`)
      }
    }
    return next(e)
  })

  // Counterweight: the goal is restated in the system prompt, sharper once drift is flagged.
  on('prompt.compose', async ($, e, next) => {
    const res = await next(e)
    const g = await read($, goal)
    if (g === null) return res

    const drifting = (await read($, focus)) < DRIFT_BELOW
    const text = drifting
      ? `Session goal: "${g}". The conversation appears to have drifted from it. Before continuing, state briefly how the current request relates to the goal, or ask the user whether the goal has changed.`
      : `Session goal: "${g}". Keep work aligned with it; flag it if a request leaves its scope.`
    return { sections: [...res.sections, { id: 'task-anchor:goal', text, scope: 'session' as const }] }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const g = await read($, goal)
    if (e.props.hasSurvey || g === null || (await read($, isHidden))) return next(e)

    const f = await read($, focus)
    const { Box, Button, Text } = $.ui.resolve(e)
    return (
      <Box>
        <Text dimColor={f >= DRIFT_BELOW} color={f < DRIFT_BELOW ? 'yellow' : undefined}>
          But: {g.slice(0, 60)}
          {g.length > 60 ? '…' : ''} · focus {bar(f)}{' '}
        </Text>
        <Button key="hide" label="Hide" onPress={() => update($, isHidden, () => true)} />
      </Box>
    )
  })
}
