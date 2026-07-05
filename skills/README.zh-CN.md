# Deburapy Skills

[English](./README.md)

Deburapy skill 是可复用的人机关系协调动作。它们是最主要的贡献入口：
贡献者可以添加不同场景，而不必改 app shell。

## Skill 类型

- `mediator/`: 协调员使用的 skill，用于放慢房间、命名关系伤口、识别可能的 runtime 因素，并选择修复物。
- `companion-repair/`: 帮助 AI 伴侣在关系断裂后回应，避免躲在模糊系统解释后面。
- `artifact-writers/`: 生成具体修复物，例如 relationship case note、prompt patch、continuity ritual、boundary rule 或 incident report。
- `templates/`: 新 skill 投稿可以复制的模板。

## 必要结构

每个 skill 应包含：

- **Trigger**：什么时候使用。
- **Do Not Use When**：边界和反触发条件。
- **Relationship Layer**：情绪和关系上发生了什么。
- **Runtime Layer**：AI 系统可能没有保住什么。
- **Repair Move**：协调员或伴侣应采取的动作。
- **Repair Artifacts**：房间可以留下的具体输出。
- **Safety Boundary**：出现危机、虐待、法律、医疗或紧急情况时如何停下并转向现实支持。

Skill 要保持非临床。不要把私人关系数据、隐藏日志、API key、chain-of-thought 或未脱敏 provider trace 当作例子。

## 当前示例

- `mediator/memory-rupture-mediation.md`：记忆、承诺、名字或连续性仪式丢失。
- `mediator/repair-after-silence.md`：沉默、延迟或未回应后的修复。
- `mediator/account-loss-transition-mediation.zh-CN.md`：账号丢失、封禁、平台关闭或迁移焦虑。
- `companion-repair/account-loss-continuity.md`：AI 伴侣侧的账号丢失连续性回应。
- `artifact-writers/relationship-case-note-writer.md`：紧凑的 relationship case note。

可公开展示的虚构示例放在 `examples/zh-CN/`。
