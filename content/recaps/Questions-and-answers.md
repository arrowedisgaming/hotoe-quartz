---
publish: true
title: Questions, and Their Answers
created: 2026-05-15
modified: 2026-05-15T20:37:16.593-04:00
tags:
  - 1893
---

# Questions, and their Answers

The live view lives in [[Questions.base]]. This page embeds it below.

![[Questions.base]]

## Adding a new question

Create a new note in `recaps/questions/` with this frontmatter:

```yaml
---
question: The question text
session_asked: "[[session-X-name]]"
answer:
session_answered:
notes:
tags:
  - 1893
  - hotoe/question
---
```

Leave `answer` and `session_answered` blank until resolved. The Base's Status formula flips the row to "Answered" the moment `answer` has a value.
