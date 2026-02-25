# .claude/ — AI Assistant Configuration

This directory contains skills and configuration for Claude Code to work effectively in this project.

---

## Directory Structure

```
.claude/
├── skills/
│   ├── core/           — Stack fundamentals (always apply)
│   ├── features/       — Feature-specific patterns (apply when relevant)
│   └── practices/      — Cross-cutting practices (always apply)
└── README.md           — This file
```

---

## Skills Reference

### core/ — Apply to every task

| File | When to use |
|------|-------------|
| `nextjs-skill.md` | Any Next.js route, component, or data fetching |
| `tailwind-skill.md` | Any UI styling work |
| `typescript-skill.md` | Any TypeScript types, interfaces, or React props |
| `supabase-skill.md` | Any database query or schema change |

### features/ — Apply when implementing that feature

| File | When to use |
|------|-------------|
| `auth-skill.md` | Implementing login, session, route protection |
| `api-skill.md` | Creating or modifying API routes |

### practices/ — Apply to every task

| File | When to use |
|------|-------------|
| `documentation-skill.md` | Writing any function or component |
| `error-handling-skill.md` | Any async operation, API call, or user action |
| `security-skill.md` | Any input handling, auth check, or DB query |

---

## How Skills Work

### Automatic (always active)
Claude reads these implicitly when working in this project:
- `core/typescript-skill.md` — strict types on everything
- `practices/documentation-skill.md` — JSDoc on every function
- `practices/error-handling-skill.md` — try/catch + rollback pattern
- `practices/security-skill.md` — validate input, scope by user

### Explicit (reference in prompts)
Mention a skill to get focused help:

```
"Add a filter dropdown following the tailwind-skill patterns"
"Create a /api/users route following the api-skill and security-skill"
"Set up NextAuth following the auth-skill"
```

---

## Example Prompts

```
"Implement task filtering (all / active / completed) following nextjs-skill and tailwind-skill"

"Add a due date field to tasks — follow supabase-skill for the schema change and typescript-skill for the types"

"Protect /api/tasks routes following auth-skill and security-skill"

"Create a reusable Button component following tailwind-skill and typescript-skill"
```

---

## Adding New Skills

1. Choose the right category: `core/`, `features/`, or `practices/`
2. Use the existing files as format reference
3. Include: rules, code examples, testing checklist
4. Add Context7 note if the skill covers an external library
5. Register it in this README
