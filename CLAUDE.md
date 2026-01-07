# TafawqoqWeb Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-11

## Active Technologies
- TypeScript 5.x with Next.js 14+ (App Router) + Next.js, React 18+, @anthropic-ai/sdk, shadcn/ui, Supabase JS Client (main)
- Supabase PostgreSQL (exam_sessions, practice_sessions tables) (main)
- TypeScript 5.x with Next.js 14+ (App Router) + Next.js 14+, React 18+, Supabase JS Client (@supabase/ssr, @supabase/supabase-js), shadcn/ui, Tailwind CSS, Stripe JS, lucide-react (002-forum-exam-sharing)
- Supabase PostgreSQL with RLS policies (002-forum-exam-sharing)
- TypeScript 5.6.0 with Next.js 14.2.0 (App Router) + React 18.3.0, @supabase/supabase-js 2.49.0, @supabase/ssr 0.5.2, Stripe 17.4.0, shadcn/ui, Tailwind CSS 3.4.14, @anthropic-ai/sdk 0.71.2 (003-platform-upgrade-v2)
- Supabase PostgreSQL with RLS policies, existing tables: exam_sessions, practice_sessions, user_subscriptions, user_credits, forum_posts, notifications (003-platform-upgrade-v2)

- TypeScript 5.x with Next.js 14+ (App Router) + Next.js, React 18+, shadcn/ui, Supabase JS Client, Stripe JS, Chart.js, Google Generative AI SDK (001-tafawoq-exam-platform)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5.x with Next.js 14+ (App Router): Follow standard conventions

## Recent Changes
- 1-gat-exam-v3: Added TypeScript 5.6.0 with Next.js 14.2.0 (App Router)
- 003-platform-upgrade-v2: Added TypeScript 5.6.0 with Next.js 14.2.0 (App Router) + React 18.3.0, @supabase/supabase-js 2.49.0, @supabase/ssr 0.5.2, Stripe 17.4.0, shadcn/ui, Tailwind CSS 3.4.14, @anthropic-ai/sdk 0.71.2
- 002-forum-exam-sharing: Added TypeScript 5.x with Next.js 14+ (App Router) + Next.js 14+, React 18+, Supabase JS Client (@supabase/ssr, @supabase/supabase-js), shadcn/ui, Tailwind CSS, Stripe JS, lucide-react


<!-- MANUAL ADDITIONS START -->
# CLAUDE.md - MCP-Driven Testing Configuration

> Place this file in your Next.js project root

---

## 🎯 Project Testing Mode

This project uses **MCP-driven autonomous testing** with Ralph Wiggum loops.

---

## 🔐 Test Accounts

```yaml
primary:
  email: hossamsharif1990@gmail.com
  password: Hossam1990@
  role: admin

backup_1:
  email: halabija@gmail.com
  password: Hossam1990@
  role: user

backup_2:
  email: husameldeenh@gmail.com
  password: Hossam1990@
  role: user
```

**If all accounts fail:** Create new account via Supabase MCP or Firebase CLI.

---

## 🛠️ Required MCP Tools

| Tool | Required | Fallback |
|------|----------|----------|
| chrome-devtools | ✅ Yes | None |
| supabase | If using Supabase | Supabase CLI |
| firebase | If using Firebase | Firebase CLI |

---

## 📋 Testing Commands

| Command | Description |
|---------|-------------|
| `/test` | Full workflow: generate plan → execute → report |
| `/test-plan` | Generate TEST-PLAN.md only |
| `/test-execute` | Execute existing TEST-PLAN.md |

---

## 🔄 Autonomous Execution Rules

### ALWAYS DO ✅
- Find correct running app (check ports 3000-3005)
- Verify it's the correct project before testing
- Read specs from `specs/[branch]/` directory
- Use Chrome MCP for all UI interactions
- Use Supabase/Firebase MCP for DB verification
- Fix issues immediately and commit
- Continue on console errors (log them)
- Test both desktop and mobile viewports
- Follow RTL requirements for Arabic
- Output `<promise>ALL_TESTS_COMPLETE</promise>` when done

### NEVER DO ❌
- Ask for human confirmation mid-test
- Stop on non-critical console errors
- Skip HARD STOP verifications
- Leave tests unmarked
- Forget to commit fixes
- Re-read specs during execution (trust TEST-PLAN.md)

---

## 📁 Spec Directory Structure

```
specs/
└── [feature-branch]/
    ├── spec.md           # Feature specification (input)
    ├── tasks.md          # Implementation tasks (input)
    ├── TEST-PLAN.md      # Generated test plan
    ├── TEST-REPORT.md    # Generated report
    └── screenshots/      # Test evidence
```

---
## 📱 Viewport Testing

| Device | Width | Height |
|--------|-------|--------|
| Desktop | 1920 | 1080 |
| Mobile | 375 | 812 |

Both viewports required for all pages.

---

## 🚨 Error Handling

| Scenario | Action |
|----------|--------|
| App not running | Start with `npm run dev` |
| Wrong app on port | Alert, do not proceed |
| MCP tool unavailable | Use CLI fallback |
| Auth fails | Try backup accounts, then create |
| Test fails | Fix → Commit → Re-test (3x max) |
| Fix fails 3x | Mark BLOCKED, continue |
| Console error | Log to report, continue |

---

## ⚙️ MCP Permissions

Add to `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(git *)",
      "Bash(supabase *)",
      "Bash(firebase *)",
      "Bash(curl *)",
      "mcp__chrome-devtools__*",
      "mcp__supabase__*"
    ]
  }
}
```

---

## 🔄 Ralph Wiggum Integration

All test execution uses Ralph Wiggum loops:

```bash
/ralph-loop "[prompt]" --max-iterations 50 --completion-promise "ALL_TESTS_COMPLETE"
```

### Completion Signals
- `<promise>ALL_TESTS_COMPLETE</promise>` - All tests passed
- `<promise>BLOCKED</promise>` - >50% tests failed after retries

### HARD STOP Markers
- Pause at these checkpoints
- Verify all previous tests pass
- Do not proceed until section complete

---

## 📊 Success Criteria

Test execution is complete when:

- [ ] All test cases marked [x]
- [ ] All HARD STOPs verified
- [ ] All fixes committed
- [ ] TEST-REPORT.md generated
- [ ] Screenshots saved for failures
- [ ] `<promise>ALL_TESTS_COMPLETE</promise>` output



<!-- MANUAL ADDITIONS END -->
