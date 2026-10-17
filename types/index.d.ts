export type Focus = number

declare module 'claude-code' {
  interface PluginState {
    'task-anchor': {
      goal: string | null
      focus: Focus
      offStreak: number
      isHidden: boolean
    }
  }
}
