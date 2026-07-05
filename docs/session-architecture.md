# Session Architecture

[简体中文](./session-architecture.zh-CN.md)

Deburapy models recurring mediator work without using clinical product
language. The core terms are:

- `session`: one bounded meeting, usually 60 or 90 minutes.
- `mediator_note`: a structured end-of-session note.
- `relationship_map`: a periodic synthesis of the recurring pattern.
- `course_outline`: the working arc, such as 12 sessions.
- `pattern_review`: a review every 3 or 4 sessions.
- `check_in_scale`: a lightweight non-diagnostic rating module.
- `module`: a scenario-specific workflow.
- `supportMode`: either `one_on_one` or `relationship_mediation`.
- `intake`: the first-screening concern and urgency that seed mediator
  context.

Avoid product/API terms such as diagnosis, treatment plan, clinical note,
patient, or case conceptualization.

## Current Backend Surface

The MVP backend now stores the first thin version of the model in
`.deburapy-data/store.json`:

- `sessions`: persisted session records with create, fetch, and end.
- `sessionNotes`: mediator continuity notes generated after a session ends.
- `courseOutlines`: the current multi-session arc and review cadence.
- `relationshipMaps`: periodic pattern reviews.
- `checkInScales`: lightweight non-diagnostic check-ins attached to a session.
- `modules`: a discoverable catalog that points to skill files.
- `supportMode` and `intake`: stored on the room, active session, session
  record, and generated session note.

The browser still keeps the room UI simple. It uses the current `session`
compatibility object for the timer and note UI while the backend persists
`sessions[]` for the longer session model.

## Data Model

```json
{
  "rooms": {
    "default": {
      "supportMode": "one_on_one",
      "intake": {
        "concern": "ai_loss_or_ban",
        "urgency": "medium"
      },
      "sessions": [
        {
          "id": "session_...",
          "sessionNumber": 1,
          "status": "scheduled|active|ended",
          "durationMinutes": 60,
          "supportMode": "one_on_one",
          "intake": {
            "concern": "ai_loss_or_ban",
            "urgency": "medium"
          },
          "startedAt": "ISO timestamp",
          "endedAt": "ISO timestamp",
          "courseOutlineId": "course_...",
          "moduleIds": ["module_repair_after_silence"],
          "messageIds": ["msg_..."],
          "mediatorNoteId": "note_..."
        }
      ],
      "sessionNotes": [
        {
          "id": "note_...",
          "sessionId": "session_...",
          "sessionNumber": 1,
          "createdAt": "ISO timestamp",
          "title": "Deburapy Session 1 Note",
          "supportMode": "one_on_one",
          "intake": {
            "concern": "ai_loss_or_ban",
            "urgency": "medium"
          },
          "content": "markdown note",
          "format": "markdown",
          "recommendedReader": "mediator_or_clinician"
        }
      ],
      "relationshipMaps": [
        {
          "id": "map_...",
          "afterSessionNumber": 4,
          "createdAt": "ISO timestamp",
          "themes": [],
          "stuckLoops": [],
          "repairExperiments": [],
          "openQuestions": []
        }
      ],
      "courseOutlines": [
        {
          "id": "course_...",
          "totalSessions": 12,
          "reviewCadenceSessions": 4,
          "currentSessionNumber": 1,
          "focus": "",
          "moduleIds": []
        }
      ]
    }
  }
}
```

## API Shape

Current endpoints:

```http
POST /api/rooms/:roomId/sessions
PATCH /api/sessions/:sessionId/end
GET /api/sessions/:sessionId
GET /api/rooms/:roomId/recall?beforeSessionId=...
PUT /api/rooms/:roomId/course-outline
POST /api/rooms/:roomId/relationship-map
GET /api/modules
POST /api/sessions/:sessionId/check-in-scale
```

The existing UI note path also remains active:

```http
POST /api/rooms/:roomId/session/start
POST /api/rooms/:roomId/session/wrap-up
POST /api/rooms/:roomId/session/end
GET /api/rooms/:roomId/session-notes
GET /api/rooms/:roomId/session-notes/:noteId/download
```

`POST /api/rooms/:roomId/session/start` accepts `supportMode` and `intake`.
When `supportMode` is `one_on_one`, companion API and MCP turn endpoints reject
companion turns for that room.

## Skill Surface

Scenario modules should be written as Deburapy skills under `skills/`. A module
can point to a mediator skill, a companion repair skill, or an artifact writer.
The backend catalog in `/api/modules` intentionally stores only lightweight
metadata and a `skillPath`; the skill file carries the actual mediation moves.

## Prompt Context

The mediator prompt should receive context in layers:

1. Current session transcript.
2. Support mode and first-screening intake.
3. Previous `mediator_note`.
4. Open agreements and next-session focus.
5. Latest `relationship_map` if the session number is 4, 8, or 12.
6. Active module instructions and check-in scale results.

Do not rely on the full raw transcript as long-term memory. It becomes too
large and makes the next-session focus ambiguous.
