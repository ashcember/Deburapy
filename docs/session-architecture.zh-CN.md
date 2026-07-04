# Session 架构

[English](./session-architecture.md)

Deburapy 会建模重复发生的协调员工作，但避免使用临床产品语言。核心术语是：

- `session`: 一次有边界的会面，通常为 60 或 90 分钟。
- `mediator_note`: session 结束后的结构化 note。
- `relationship_map`: 对重复模式的周期性综合。
- `course_outline`: 当前工作弧线，例如 12 次 session。
- `pattern_review`: 每 3 或 4 次 session 做一次回顾。
- `check_in_scale`: 轻量、非诊断性的评分模块。
- `module`: 场景特定 workflow。

避免使用 diagnosis、treatment plan、clinical note、patient 或 case conceptualization 等产品/API 术语。

## 当前 Backend Surface

MVP backend 现在已经把第一层轻量模型存进 `.deburapy-data/store.json`：

- `sessions`: 可创建、读取、结束的持久化 session record。
- `sessionNotes`: session 结束后生成的协调员连续性 note。
- `courseOutlines`: 当前多 session 工作弧线和 review cadence。
- `relationshipMaps`: 周期性 pattern review。
- `checkInScales`: 绑定到 session 的轻量、非诊断 check-in。
- `modules`: 指向 skill 文件的可发现 module catalog。

浏览器 UI 仍保持房间简洁。它继续用当前 `session` 兼容对象驱动计时和 note UI，同时 backend 用 `sessions[]` 支撑更长线的 session model。

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
      "sessionNotes": [
        {
          "id": "note_...",
          "sessionId": "session_...",
          "sessionNumber": 1,
          "createdAt": "ISO timestamp",
          "title": "Deburapy Session 1 Note",
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

当前 endpoint：

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

现有 UI note 路径也继续保留：

```http
POST /api/rooms/:roomId/session/start
POST /api/rooms/:roomId/session/wrap-up
POST /api/rooms/:roomId/session/end
GET /api/rooms/:roomId/session-notes
GET /api/rooms/:roomId/session-notes/:noteId/download
```

## Skill Surface

场景 module 应写成 `skills/` 下的 Deburapy skill。一个 module 可以指向协调员 skill、伴侣修复 skill 或修复物 writer。`/api/modules` 的 backend catalog 只保存轻量 metadata 和 `skillPath`；真正的协调动作写在 skill 文件里。

## Prompt Context

协调员 prompt 应该分层接收 context：

1. 当前 session transcript。
2. 上一次 `mediator_note`。
3. 未关闭的 agreements 和 next-session focus。
4. 如果 session number 是 4、8 或 12，则包含最新 `relationship_map`。
5. 活跃 module instructions 和 check-in scale results。

不要把完整 raw transcript 当作长期记忆依赖。它会变得太大，并让下次 session 的焦点变得模糊。
