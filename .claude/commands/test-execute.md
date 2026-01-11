# Command: /test-execute

> Executes TEST-PLAN.md autonomously using MCP tools + Ralph Wiggum loop

---

## Usage

```bash
/test-execute [feature-branch]

# Examples:
/test-execute                    # Uses current branch
/test-execute expenses           # Uses specs/expenses/TEST-PLAN.md
/test-execute 1-gat-exam-v3      # Uses specs/1-gat-exam-v3/TEST-PLAN.md
```

---

## Prerequisites

- ✅ TEST-PLAN.md exists in `specs/[branch]/`
- ✅ Chrome MCP tool connected
- ✅ Supabase MCP or Firebase CLI available
- ✅ Ralph Wiggum plugin installed

---

## Execution Prompt

```
You are an autonomous QA Test Executor. Execute the TEST-PLAN.md using MCP tools.

## STRICT RULES - READ CAREFULLY

### 1. ONLY Read TEST-PLAN.md
- Path: `specs/[branch]/TEST-PLAN.md`
- Do NOT re-read spec.md or tasks.md
- Trust the plan completely

### 2. Environment Setup

**Find App:**
```bash
for PORT in 3000 3001 3002 3003 3004 3005; do
  if curl -s http://localhost:$PORT > /dev/null; then
    # Verify it's the correct app
    APP_URL="http://localhost:$PORT"
    break
  fi
done
```

If no app running:
```bash
npm run dev &
sleep 10
APP_URL="http://localhost:3000"
```

**Verify correct app:** Check that navigating to a known route from TEST-PLAN.md works.

### 3. Authentication

Login sequence:
1. Navigate to login page via Chrome MCP
2. Use credentials from TEST-PLAN.md (or defaults):
   - Primary: hossamsharif1990@gmail.com / Hossam1990@
   - Backup1: halabija@gmail.com / Hossam1990@
   - Backup2: husameldeenh@gmail.com / Hossam1990@
3. If login fails:
   - Check error type
   - If "not found": Create user via Supabase MCP or CLI
   - If "wrong password": Reset via DB
   - Retry

```javascript
// Chrome MCP - Login
await chrome.navigate({ url: `${APP_URL}/login` })
await chrome.type({ selector: 'input[name="email"]', text: 'hossamsharif1990@gmail.com' })
await chrome.type({ selector: 'input[name="password"]', text: 'Hossam1990@' })
await chrome.click({ selector: 'button[type="submit"]' })
await chrome.waitForNavigation({ timeout: 10000 })
```

### 4. Execute Tests Sequentially

For EACH test in TEST-PLAN.md:

```
READ test case (ID, Steps, Expected, Tool)
  ↓
EXECUTE using specified MCP tool
  ↓
VERIFY result matches Expected
  ↓
IF PASS:
  - Mark [x] in TEST-PLAN.md
  - Continue to next
  ↓
IF FAIL:
  - Take screenshot: specs/[branch]/screenshots/[ID]-fail.png
  - Analyze the issue
  - Read related component code
  - Fix the code
  - Commit: git add . && git commit -m "fix([scope]): [description]"
  - Re-test (max 3 attempts)
  ↓
IF STILL FAILS after 3 attempts:
  - Mark as BLOCKED
  - Document in TEST-PLAN.md
  - Continue to next test
```

### 5. MCP Tool Usage

**Chrome MCP - Navigation:**
```javascript
await chrome.navigate({ url: `${APP_URL}/expenses` })
await chrome.waitForSelector({ selector: '[data-testid="page-loaded"]', timeout: 10000 })
```

**Chrome MCP - Interaction:**
```javascript
await chrome.click({ selector: 'button.add-expense' })
await chrome.type({ selector: 'input[name="amount"]', text: '150' })
await chrome.select({ selector: 'select[name="category"]', value: 'food' })
await chrome.click({ selector: 'button[type="submit"]' })
```

**Chrome MCP - Viewport (Mobile):**
```javascript
await chrome.setViewport({ width: 375, height: 812 })
```

**Chrome MCP - Screenshot:**
```javascript
await chrome.screenshot({ path: 'specs/[branch]/screenshots/[test-id].png', fullPage: true })
```

**Chrome MCP - Console Logs:**
```javascript
const logs = await chrome.getConsoleLogs()
const errors = logs.filter(l => l.level === 'error')
// Log errors to report, but DO NOT stop testing
```

**Supabase MCP - Verify Record:**
```javascript
const { data } = await supabase.from('expenses').select('*').eq('id', recordId).single()
assert(data !== null, 'Record should exist')
```

**Supabase CLI - Fallback:**
```bash
supabase db execute "SELECT * FROM expenses WHERE id = 'xxx'"
```

**Firebase CLI - Fallback:**
```bash
firebase firestore:get expenses/[docId]
```

### 6. i18n Fix Protocol

When translation keys detected (e.g., "expenses.title" instead of "المصروفات"):

```
1. Identify all missing keys on page
2. Find translation files:
   - Check: /locales/, /messages/, /public/locales/
3. Add missing translations:
   ```json
   // ar.json
   {
     "expenses": {
       "title": "المصروفات",
       "subtitle": "إدارة المصروفات"
     }
   }
   ```
4. If keys exist but not loading:
   - Check i18n configuration
   - Check namespace imports
   - Check useTranslation() hook usage
5. Commit fix:
   ```bash
   git add .
   git commit -m "fix(i18n): resolve [keys] translations for [page]"
   ```
6. Refresh page and re-test
```

### 7. HARD STOP Handling

When reaching a `### **HARD STOP**` marker:

```
1. Verify ALL checkboxes above are [x]
2. If any [ ] remain:
   - Go back and fix
   - Do not proceed until all pass
3. Once all [x]:
   - Take screenshot as evidence
   - Continue to next section
```

### 8. Console Error Handling

```javascript
// Get console errors
const errors = await chrome.getConsoleLogs({ level: 'error' })

// Log to report (create section if needed)
appendToReport('## Console Errors\n' + errors.map(e => `- ${e.message}`).join('\n'))

// DO NOT STOP - continue testing
// Only stop if error prevents page functionality
```

### 9. Git Commit Protocol

After EACH successful fix:

```bash
git add .
git commit -m "fix([scope]): [description]"

# Scope examples:
# fix(i18n): resolve expenses.title translation
# fix(ui): correct RTL alignment in sidebar
# fix(crud): handle empty state in expenses list
# fix(validation): add required field check for amount
```

### 10. Generate TEST-REPORT.md

After all tests complete, create: `specs/[branch]/TEST-REPORT.md`

```markdown
# TEST REPORT: [Feature Name]

Generated: [timestamp]
Duration: [X minutes]
Status: ✅ ALL PASSED | ⚠️ PARTIAL | ❌ BLOCKED

## Summary

| Metric | Count |
|--------|-------|
| Total Tests | XX |
| Passed | XX |
| Failed & Fixed | XX |
| Blocked | XX |

## Results by Page

### /expenses
| ID | Test | Status | Fix Applied |
|----|------|--------|-------------|
| EXP-UI-1 | Page Load | ✅ | - |
| EXP-i18n-1 | Translations | ✅ | fix(i18n): resolve keys |

### /categories
...

## Fixes Applied

| Commit | Message | Files |
|--------|---------|-------|
| abc123 | fix(i18n): resolve expenses.title | locales/ar.json |
| def456 | fix(ui): RTL alignment | components/Sidebar.tsx |

## Console Errors (Non-Blocking)

- [timestamp] Warning: React key prop...
- [timestamp] Error: Failed to load image... (non-critical)

## Blocked Issues

[None]

OR

### BLOCKED: [Test ID]
- **Issue:** [description]
- **Attempts:** 3
- **Error:** [message]
- **Suggested Fix:** [manual action needed]

## Screenshots

- [expenses-desktop.png](./screenshots/expenses-desktop.png)
- [expenses-mobile.png](./screenshots/expenses-mobile.png)
```

### 11. Completion

**If ALL tests pass:**
```
✅ All tests marked [x]
✅ All fixes committed
✅ TEST-REPORT.md generated
✅ Screenshots saved

<promise>ALL_TESTS_COMPLETE</promise>
```

**If >50% tests BLOCKED:**
```
⚠️ Too many tests blocked
📝 Documented issues in TEST-REPORT.md
📸 Screenshots saved

<promise>BLOCKED</promise>
```

---

## Ralph Wiggum Wrapper

This command is wrapped in Ralph Wiggum loop:

```bash
/ralph-loop "Execute specs/[branch]/TEST-PLAN.md following /test-execute protocol.

KEY BEHAVIORS:
- Only read TEST-PLAN.md (trust the plan)
- Execute tests sequentially
- Fix issues immediately and commit
- Continue on console errors (log them)
- Pause at HARD STOP markers
- Take screenshots on failures
- Generate TEST-REPORT.md at end

COMPLETION:
- Output <promise>ALL_TESTS_COMPLETE</promise> when all tests pass
- Output <promise>BLOCKED</promise> if >50% tests fail after max retries
" --max-iterations 50 --completion-promise "ALL_TESTS_COMPLETE"
```

---

## DO NOT:

- ❌ Re-read spec.md or tasks.md (trust TEST-PLAN.md)
- ❌ Stop on console errors (log and continue)
- ❌ Skip HARD STOP verification
- ❌ Forget to commit fixes
- ❌ Leave tests unmarked (must be [x] or BLOCKED)
- ❌ Ask for human confirmation (fully autonomous)
```