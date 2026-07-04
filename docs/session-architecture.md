# Session Architecture

Deburapy should model recurring mediator work without using clinical product
language. The core terms are:

- `session`: one bounded meeting, usually 60 or 90 minutes.
- `mediator_note`: a structured end-of-session note.
- `relationship_map`: a periodic synthesis of the recurring pattern.
- `course_outline`: the planned arc, such as 12 sessions.
- `pattern_review`: a review every 3 or 4 sessions.
- `check_in_scale`: a lightweight non-diagnostic rating module.
- `module`: a scenario-specific workflow.

Avoid product/API terms such as diagnosis, treatment plan, clinical note,
patient, or case conceptualization.

## Data Model

```json
{
  "rooms": {
    "default": {
      "sessions": [
        {
          "id": "session_...",
          "sessionNumber": 1,
          "status": "scheduled|active|ended",
          "durationMinutes": 60,
          "startedAt": "ISO timestamp",
          "endedAt": "ISO timestamp",
          "courseOutlineId": "course_...",
          "moduleIds": ["module_repair_after_silence"],
          "messageIds": ["msg_..."],
          "mediatorNoteId": "note_..."
        }
      ],
      "mediatorNotes": [
        {
          "id": "note_...",
          "sessionId": "session_...",
          "createdAt": "ISO timestamp",
          "sections": {
            "interactionPattern": "",
            "runtimeFactors": "",
            "repairAttempted": "",
            "agreements": "",
            "nextSessionFocus": "",
            "riskFlags": ""
          }
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

Suggested future endpoints:

```http
POST /api/rooms/:roomId/sessions
PATCH /api/sessions/:sessionId/end
GET /api/sessions/:sessionId
POST /api/sessions/:sessionId/mediator-note
GET /api/rooms/:roomId/recall?beforeSessionId=...
POST /api/rooms/:roomId/relationship-map
GET /api/modules
POST /api/sessions/:sessionId/check-in-scale
```

## Prompt Context

The mediator prompt should receive context in layers:

1. Current session transcript.
2. Previous `mediator_note`.
3. Open agreements and next-session focus.
4. Latest `relationship_map` if the session number is 4, 8, or 12.
5. Active module instructions and check-in scale results.

Do not rely on the full raw transcript as long-term memory. It becomes too
large and makes the next-session focus ambiguous.
