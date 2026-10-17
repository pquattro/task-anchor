# task-anchor

🇬🇧 English · [🇫🇷 Français](README.fr.md)

**Keep long Claude Code sessions on track.** `task-anchor` is a mod that remembers what the session is for, notices when the conversation drifts away from it, and nudges both you and the model back.

## Why

In a long session, each request pulls the context a little further from where you started. Nothing breaks suddenly: the work just slowly stops serving the original goal. `task-anchor` makes that drift visible early and applies a counterweight.

The idea is inspired by Johnson & Huo, *Competition for attention predicts good-to-bad tipping in AI* (Patterns, 2026): accumulated context steers what comes next, and injecting the right content in the context delays the tipping. A mod cannot see a model's hidden states, so this is **not** an implementation of their formula, only the same intuition applied with text signals.

## What it does

- **Remembers the goal.** The first substantial prompt of the session (at least 4 meaningful words) becomes the goal. Casual lines such as "ok" or "on est bon" are ignored. Set or change it any time with `/anchor <goal>`.
- **Scores drift.** Each prompt is compared to the goal and to the topics already accepted as on-topic, by keyword overlap. Accents, plurals and typos are tolerated. Very short replies ("ok", "oui, vas-y") are neutral. The score is smoothed, so one stray question does not trigger an alarm.
- **Shows it.** A band above the prompt displays the goal and a 5-dot focus gauge, in yellow when focus is low. A **Hide** button dismisses it.
- **Warns.** After repeated off-topic prompts with low focus, a toast reminds you to redefine the goal or carry on.
- **Re-anchors the model.** The goal is added to the system prompt. Once drift is flagged, the model is asked to say how the current request relates to the goal, or to check whether the goal has changed.

## Install

In a terminal Claude Code session:

```
/plugin install task-anchor --marketplace pquattro/task-anchor
```

Answer `y` to add the marketplace, then pick a scope.

To try it from a local copy instead:

```
claude --plugin-dir /path/to/task-anchor
```

## Usage

| Command | Effect |
| --- | --- |
| `/anchor <goal>` | Set the goal and reset focus |
| `/anchor` | Show the current goal |
| `/anchor clear` | Clear the goal (the next substantial prompt becomes the new one) |

Drift is normal when you change topic on purpose. Run `/anchor <new goal>` and tracking restarts.

## Limits

- The score is a **lexical proxy**, not a semantic one. A relevant prompt worded with entirely different vocabulary can look like drift, and a change of topic that reuses the goal's words goes unnoticed.
- Typo tolerance needs the same first letter and, for words under 5 letters, an exact match.
- The system prompt addition is not applied where an organization manages Claude Code and restricts `prompt.compose` hooks for installed plugins.
- State is kept per session, not across sessions.

## Development

```
claude plugin validate .
claude plugin test .
```

The tests live in `hooks/register.test.ts`. The mod is a single hooks module, `hooks/register.tsx`.

## License

[MIT](LICENSE)
