# Changelog

🇬🇧 English · [🇫🇷 Français](CHANGELOG.fr.md)

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-10-17

First release.

### Added
- Session goal captured from the first substantial prompt (at least 4 meaningful words), or set with `/anchor <goal>`.
- `/anchor` to show the goal and `/anchor clear` to clear it.
- Drift score based on keyword overlap with the goal and the accepted topics, smoothed over prompts, with accent, plural and typo tolerance.
- Band above the prompt with the goal, a 5-dot focus gauge and a **Hide** button.
- Toast after repeated off-topic prompts with low focus.
- System prompt reminder of the goal, firmer once drift is flagged.
- Test suite covering goal capture, scoring, typos, toast and system prompt behavior.
- Marketplace file so the mod installs with `/plugin install task-anchor --marketplace pquattro/task-anchor`.

### Fixed
- A casual first message ("on est bon") no longer becomes the session goal.
