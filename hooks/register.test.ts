import { describe, expect, test } from 'claude-code/testing'

const GOAL = 'refactor the billing invoice export module'
const OFF = [
  'what is a good recipe for chocolate cake tonight',
  'recommend hiking trails near mountains this weekend',
  'explain quantum entanglement experiments simply',
]

// A test has no `$.state`; it reads the mod through what the mod shows: the band and the prompt.
const setup = ($: any, on: any) => {
  const toasts: string[] = []
  on('prompt.submit', (_$: any, e: any) => ({ text: e.text }))
  on('prompt.compose', () => ({ sections: [] }))
  on('ui.toast', (_$: any, e: any) => {
    toasts.push(JSON.stringify(e))
    return { value: undefined }
  })
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['(engine default)'] }))
  const submit = (text: string) =>
    $.prompt.submit({ text, wait: false, origin: { kind: 'composer' } })
  const band = async (): Promise<string> => {
    const ui = await $.ui.mount({
      plugin: 'task-anchor',
      surface: 'terminal',
      component: 'AbovePrompt',
      props: { hasSurvey: false, isWorking: false },
    })
    return JSON.stringify(await ui.drawn())
  }
  const dots = async () => ((await band()).match(/●/g) ?? []).length
  const goalSection = async () => {
    const r = await $.prompt.compose({ model: 'm', promptModel: 'm', outputStyle: null, tools: [], surfaces: [], traits: [] })
    return r.sections.find((s: any) => s.id === 'task-anchor:goal')
  }
  return { toasts, submit, band, dots, goalSection }
}

describe('task-anchor', () => {
  test('shows nothing before any goal exists', async ($, on) => {
    const t = setup($, on)
    const shown = await t.band()
    expect(shown).toContain('engine default')
    expect(shown).not.toContain('But:')
  })

  test('the first prompt becomes the goal, at full focus', async ($, on) => {
    const t = setup($, on)
    await t.submit(GOAL)
    expect(await t.band()).toContain(GOAL)
    expect(await t.dots()).toEqual(5)
  })

  test('a casual line is not taken as the goal', async ($, on) => {
    const t = setup($, on)
    await t.submit('on est bon')
    expect(await t.band()).not.toContain('But:')
    await t.submit(GOAL)
    expect(await t.band()).toContain(GOAL)
  })

  test('on-topic prompts keep focus full', async ($, on) => {
    const t = setup($, on)
    await t.submit(GOAL)
    await t.submit('add tests for the invoice export module')
    expect(await t.dots()).toEqual(5)
  })

  test('short acknowledgements are neutral', async ($, on) => {
    const t = setup($, on)
    await t.submit(GOAL)
    await t.submit('ok oui')
    expect(await t.dots()).toEqual(5)
  })

  test('accents and plurals still match the goal', async ($, on) => {
    const t = setup($, on)
    await t.submit('améliorer les performances de la facturation')
    await t.submit('mesurer la performance de facturation avant optimisation')
    expect(await t.dots()).toEqual(5)
  })

  test('typos still match the goal', async ($, on) => {
    const t = setup($, on)
    await t.submit('améliorer les performances de la facturation du module export')
    await t.submit('mesurer la performence de la factruation avant optimisaton du modul export')
    expect(await t.dots()).toEqual(5)
  })

  test('short words are not fuzzed into false matches', async ($, on) => {
    const t = setup($, on)
    await t.submit('fix the cart bug in checkout flow')
    await t.submit('what about the cat food recipes tonight please')
    expect(await t.dots()).toBeLessThan(5)
  })

  test('off-topic prompts erode focus step by step', async ($, on) => {
    const t = setup($, on)
    await t.submit(GOAL)
    await t.submit(OFF[0])
    expect(await t.dots()).toEqual(3)
    await t.submit(OFF[1])
    expect(await t.dots()).toEqual(2)
    await t.submit(OFF[2])
    expect(await t.dots()).toEqual(1)
  })

  test('a drift toast fires only after repeated off-topic prompts', async ($, on) => {
    const t = setup($, on)
    await t.submit(GOAL)
    await t.submit(OFF[0])
    await t.submit(OFF[1])
    expect(t.toasts.length).toEqual(0)
    await t.submit(OFF[2])
    expect(t.toasts.length).toEqual(1)
  })

  test('an on-topic prompt after drift resets the streak', async ($, on) => {
    const t = setup($, on)
    await t.submit(GOAL)
    await t.submit(OFF[0])
    await t.submit(OFF[1])
    await t.submit('back to the invoice export module refactor')
    await t.submit(OFF[2])
    expect(t.toasts.length).toEqual(0)
  })

  test('the system prompt restates the goal, sharper once drifting', async ($, on) => {
    const t = setup($, on)
    expect(await t.goalSection()).toEqual(undefined)
    await t.submit(GOAL)
    const calm = await t.goalSection()
    expect(calm.text).toContain(GOAL)
    expect(calm.text).not.toContain('drifted')
    for (const p of OFF) await t.submit(p)
    expect((await t.goalSection()).text).toContain('drifted')
  })
})
