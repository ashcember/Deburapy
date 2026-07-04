# Session 架构

[English](./session-architecture.md)

Deburapy 应该建模重复发生的协调员工作，但避免使用临床产品语言。核心术语是：

- `session`: 一次有边界的会面，通常为 60 或 90 分钟。
- `mediator_note`: session 结束后的结构化 note。
- `relationship_map`: 对重复模式的周期性综合。
- `course_outline`: 计划中的工作弧线，例如 12 次 session。
- `pattern_review`: 每 3 或 4 次 session 做一次回顾。
- `check_in_scale`: 轻量、非诊断性的评分模块。
- `module`: 场景特定 workflow。

避免使用 diagnosis、treatment plan、clinical note、patient 或 case conceptualization 等产品/API 术语。

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

建议未来 endpoint：

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

协调员 prompt 应该分层接收 context：

1. 当前 session transcript。
2. 上一次 `mediator_note`。
3. 未关闭的 agreements 和 next-session focus。
4. 如果 session number 是 4、8 或 12，则包含最新 `relationship_map`。
5. 活跃 module instructions 和 check-in scale results。

不要把完整 raw transcript 当作长期记忆依赖。它会变得太大，并让下次 session 的焦点变得模糊。
