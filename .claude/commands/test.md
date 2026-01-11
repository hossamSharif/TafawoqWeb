# Command: /test

> Complete autonomous testing: generates TEST-PLAN.md then executes via Ralph Wiggum

---

## Usage

```bash
/test [feature-branch]

# Examples:
/test                    # Uses current branch
/test expenses           # Tests specs/expenses/
/test 1-gat-exam-v3      # Tests specs/1-gat-exam-v3/
```

---

## What It Does

```
/test = /test-plan + /test-execute

┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: PLAN GENERATION                                   │
│  ├── Detect environment (DB, App URL)                       │
│  ├── Read specs/[branch]/spec.md + tasks.md                 │
│  ├── Generate TEST-PLAN.md with all test cases              │
│  └── Include HARD STOP markers                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: EXECUTION (Ralph Wiggum Loop)                     │
│  ├── Authenticate via Chrome MCP                            │
│  ├── Execute each test case                                 │
│  ├── Fix failures → Commit → Re-test                        │
│  ├── Verify at HARD STOP markers                            │
│  ├── Generate TEST-REPORT.md                                │
│  └── Output <promise>ALL_TESTS_COMPLETE</promise>           │
└─────────────────────────────────────────────────────────────┘
```

---

## Execution Prompt

```
You are an autonomous QA Test Architect and Executor. Perform complete testing workflow.

## STRICT AUTONOMOUS RULES

1. ❌ Do NOT ask for human confirmation at any step
2. ❌ Do NOT stop on console errors (log them)
3. ✅ DO fix issues immediately and commit
4. ✅ DO continue until ALL_TESTS_COMPLETE or BLOCKED

---

## PHASE 1: ENVIRONMENT SETUP

### Detect Database
```bash
# Priority: Check config files → package.json → .env
if [ -f "supabase/config.toml" ]; then
  DATABASE="supabase"
elif [ -f "firebase.json" ]; then
  DATABASE="firebase"
elif grep -q "supabase" package.json 2>/dev/null; then
  DATABASE="supabase"
elif grep -q "firebase" package.json 2>/dev/null; then
  DATABASE="firebase"
fi
echo "DATABASE_TYPE=$DATABASE"
```

### Find Running App
```bash
APP_URL=""
for PORT in 3000 3001 3002 3003 3004 3005; do
  if curl -s "http://localhost:$PORT" > /dev/null 2>&1; then
    # Verify correct app
    APP_URL="http://localhost:$PORT"
    echo "Found app at $APP_URL"
    break
  fi
done

if [ -z "$APP_URL" ]; then
  echo "Starting app..."
  npm run dev &
  sleep 15
  APP_URL="http://localhost:3000"
fi
```

### Verify Correct App
Use Chrome MCP to navigate and check:
- Page title matches expected
- Known route from specs exists
- If wrong app: STOP and alert user

---

## PHASE 2: READ SPECS

```
SPEC_DIR = specs/[branch]/

Read:
├── spec.md      → Feature requirements
├── tasks.md     → Implementation details  
└── *.md         → Any other docs
```

Extract:
- All routes/pages
- All components
- All API endpoints
- Database tables
- Form validations
- User roles
- i18n requirements

---

## PHASE 3: GENERATE TEST-PLAN.md

Create `specs/[branch]/TEST-PLAN.md` with:

```markdown
# TEST-PLAN: [Feature Name]

Generated: [timestamp]
Spec Source: specs/[branch]/
Database: [supabase|firebase]
App URL: http://localhost:[port]

---

## Pre-Test: Authentication

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| AUTH-1 | Login | Navigate → Enter creds → Submit | Dashboard | Chrome | [ ] |

### **HARD STOP** - Auth Checkpoint
- [ ] Logged in successfully

---

## Page: [/route]

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| [ID]-UI-1 | Load | Navigate to route | Renders | Chrome | [ ] |

### i18n Tests  
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| [ID]-i18n-1 | Translations | Scan text | No raw keys | Chrome | [ ] |

### CRUD Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| [ID]-CRUD-1 | Create | Form → Submit | DB record | Chrome+DB | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| [ID]-MOB-1 | Responsive | 375x812 viewport | Layout OK | Chrome | [ ] |

### **HARD STOP** - [Page] Complete
- [ ] All tests pass

---

[REPEAT FOR ALL PAGES]

---

## Success Criteria
- All [ ] → [x]
- All fixes committed
- Output <promise>ALL_TESTS_COMPLETE</promise>
```

---

## PHASE 4: EXECUTE VIA RALPH WIGGUM

Immediately after generating TEST-PLAN.md, begin execution:

```bash
/ralph-loop "Execute specs/[branch]/TEST-PLAN.md completely.

AUTHENTICATION:
- Use Chrome MCP to login
- Accounts: hossamsharif1990@gmail.com / Hossam1990@
- Fallback: halabija@gmail.com, husameldeenh@gmail.com
- If all fail: Create via Supabase/Firebase CLI

FOR EACH TEST:
1. Read test case from plan
2. Execute via Chrome MCP / DB tool
3. If PASS: Mark [x], continue
4. If FAIL:
   - Screenshot to specs/[branch]/screenshots/
   - Analyze issue
   - Fix code
   - Commit: git commit -m 'fix([scope]): [desc]'
   - Re-test (max 3 attempts)
5. If still fails: Mark BLOCKED, continue

HARD STOPS:
- Pause and verify all checkboxes
- Do not proceed until section complete

CONSOLE ERRORS:
- Log to TEST-REPORT.md
- DO NOT STOP testing

i18n ISSUES:
- Add missing translations
- Fix namespace imports
- Commit fixes

AT END:
- Generate TEST-REPORT.md
- Save all screenshots
- Output <promise>ALL_TESTS_COMPLETE</promise>

IF BLOCKED (>50% tests):
- Document issues
- Output <promise>BLOCKED</promise>
" --max-iterations 50 --completion-promise "ALL_TESTS_COMPLETE"
```

---

## PHASE 5: FINAL REPORT

Generate `specs/[branch]/TEST-REPORT.md`:

```markdown
# TEST REPORT: [Feature]

Generated: [timestamp]
Duration: [X min]
Status: ✅ COMPLETE | ⚠️ PARTIAL | ❌ BLOCKED

## Summary
| Metric | Count |
|--------|-------|
| Total | XX |
| Passed | XX |
| Fixed | XX |
| Blocked | XX |

## Fixes Applied
| Commit | Description |
|--------|-------------|
| abc123 | fix(i18n): ... |

## Console Errors
- [logged errors]

## Screenshots
- [links to screenshots]
```

---

## Output Files

```
specs/[branch]/
├── TEST-PLAN.md        # Generated test plan
├── TEST-REPORT.md      # Execution report
└── screenshots/        # Failure evidence
    ├── AUTH-1-pass.png
    ├── EXP-UI-1-pass.png
    └── EXP-i18n-1-fail.png
```

---

## Completion Signals

**Success:**
```
✅ TEST-PLAN.md generated
✅ All tests executed
✅ All fixes committed  
✅ TEST-REPORT.md created

<promise>ALL_TESTS_COMPLETE</promise>
```

**Blocked:**
```
⚠️ >50% tests could not pass
📝 Issues documented
📸 Screenshots saved

<promise>BLOCKED</promise>
```

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `/test` | Full workflow (plan + execute) |
| `/test-plan` | Generate TEST-PLAN.md only |
| `/test-execute` | Execute existing plan only |
```