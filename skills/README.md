# Deburapy Skills

[简体中文](./README.zh-CN.md)

Deburapy skills are reusable mediation moves for AI-human relationship rooms.
They are the main contribution surface for people who want to add scenarios
without changing the app shell.

## Skill Types

- `mediator/`: skills used by the Deburapy mediator to slow the room, name the
  relationship wound, identify likely runtime factors, and choose a repair
  artifact.
- `companion-repair/`: skills that help an AI companion answer after a rupture
  without hiding behind vague system explanations.
- `artifact-writers/`: skills that create concrete repair artifacts such as
  relationship case notes, prompt patches, continuity rituals, boundary rules,
  or incident reports.
- `templates/`: copyable formats for new skill submissions.

## Required Shape

Each skill should include:

- **Trigger**: when the skill should be used.
- **Do Not Use When**: boundaries and anti-triggers.
- **Relationship Layer**: what emotionally happened.
- **Runtime Layer**: what the AI system may have failed to preserve.
- **Repair Move**: the mediator or companion action.
- **Repair Artifacts**: concrete outputs the room can keep.
- **Safety Boundary**: what to do if crisis, abuse, legal, medical, or emergency
  issues appear.

Keep skills non-clinical. Do not use private relationship data, hidden logs,
API keys, chain-of-thought, or unredacted provider traces as examples.

## Current Examples

- `mediator/memory-rupture-mediation.md`: missing memory, promises, names, or continuity rituals.
- `mediator/repair-after-silence.md`: repair after silence, delay, or non-response.
- `mediator/account-loss-transition-mediation.zh-CN.md`: Simplified Chinese mediation for account loss, bans, shutdowns, or migration anxiety.
- `companion-repair/account-loss-continuity.md`: companion-side continuity after account loss.
- `artifact-writers/relationship-case-note-writer.md`: compact relationship case notes.

Display-safe demo artifacts live under `examples/zh-CN/`.
