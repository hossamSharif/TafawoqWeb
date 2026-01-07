# 🧪 MCP-Driven Autonomous Testing Skill

> Autonomous testing for Next.js applications using Chrome DevTools MCP + Supabase/Firebase with Ralph Wiggum loop integration

---

## 📋 Skill Overview

This skill enables Claude Code to:
1. **Generate** comprehensive test plans from specs
2. **Execute** tests autonomously via MCP tools
3. **Fix** issues and auto-commit
4. **Loop** until all tests pass (Ralph Wiggum)

---

## 🔧 Required MCP Tools

| Tool | Purpose | Fallback |
|------|---------|----------|
| `chrome-devtools` | UI navigation, interaction, screenshots | None (required) |
| `supabase` | Database verification, data seeding | Supabase CLI |
| `firebase` | Database verification, data seeding | Firebase CLI |

---

## 🚀 Pre-Execution Protocol

### Step 1: Detect Database Type

```bash
# Check for Supabase
if [ -f "supabase/config.toml" ] || grep -q "supabase" package.json; then
  DATABASE_TYPE="supabase"
# Check for Firebase
elif [ -f "firebase.json" ] || grep -q "firebase" package.json; then
  DATABASE_TYPE="firebase"
else
  # Check .env files
  if grep -q "SUPABASE" .env* 2>/dev/null; then
    DATABASE_TYPE="supabase"
  elif grep -q "FIREBASE" .env* 2>/dev/null; then
    DATABASE_TYPE="firebase"
  fi
fi
```

**Action:** Store detected type and use appropriate MCP tool or CLI.

### Step 2: Find Running Application

```bash
# Check ports in order
for PORT in 3000 3001 3002 3003 3004 3005; do
  if curl -s "http://localhost:$PORT" > /dev/null 2>&1; then
    # Verify it's the correct app by checking page content or title
    PAGE_CONTENT=$(curl -s "http://localhost:$PORT")
    if echo "$PAGE_CONTENT" | grep -q "<APP_IDENTIFIER>"; then
      APP_URL="http://localhost:$PORT"
      break
    fi
  fi
done
```

**Action:** 
- If no app found: Run `npm run dev` and wait for ready
- If wrong app found: Alert user, do not proceed
- Store `APP_URL` for all subsequent navigation

### Step 3: Read Spec Documents

```
SPEC_DIR = specs/[current-branch]/

Required files:
├── spec.md      # Feature specification
├── tasks.md     # Implementation tasks
└── *.md         # Any other reference docs
```

**Action:** Parse all `.md` files in spec directory to understand:
- Feature requirements
- Expected behaviors
- UI components
- API endpoints
- Database schema

---

## 🔐 Authentication Protocol

### Test Accounts (Priority Order)

```yaml
accounts:
  - email: "hossamsharif1990@gmail.com"
    password: "Hossam1990@"
    role: admin
    
  - email: "halabija@gmail.com"
    password: "Hossam1990@"
    role: user
    
  - email: "husameldeenh@gmail.com"
    password: "Hossam1990@"
    role: user
```

### Login Flow

```
1. Navigate to login page via Chrome MCP
2. Try account #1
3. If fails (wrong password/not found):
   a. Check error message
   b. If "user not found" → Create via DB tool
   c. If "wrong password" → Reset via DB tool
   d. Retry login
4. If still fails → Try account #2
5. If all fail → Create new test account via Supabase/Firebase CLI
6. Store session for subsequent tests
```

### Account Creation (Supabase)

```sql
-- Via Supabase MCP or CLI
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, role)
VALUES ('test@example.com', crypt('Hossam1990@', gen_salt('bf')), now(), 'authenticated');
```

### Account Creation (Firebase)

```bash
firebase auth:import users.json --hash-algo=BCRYPT
# Or via Firebase Admin SDK
```

---

## 📝 Test Plan Generation

### Structure

```markdown
# TEST-PLAN: [Feature Name]
Generated: [timestamp]
Spec Source: specs/[branch]/spec.md

## Environment
- App URL: http://localhost:[port]
- Database: [supabase|firebase]
- Auth: [account used]

## Test Cases

### Page: [/route]
| ID | Type | Test Case | Steps | Expected | MCP Tool | Status |
|----|------|-----------|-------|----------|----------|--------|
| T1 | UI | ... | ... | ... | chrome | [ ] |
| T2 | CRUD | ... | ... | ... | chrome+supabase | [ ] |

### **HARD STOP** - Checkpoint: [description]

### Page: [/next-route]
...

## Blocked Protocol
If unable to proceed after 3 attempts:
1. Document blocking issue
2. List attempted solutions
3. Output <promise>BLOCKED</promise>

## Success Criteria
- All [ ] marked as [x]
- All fixes committed to git
- No critical console errors
- Output <promise>ALL_TESTS_COMPLETE</promise>
```

### Test Types to Cover

| Type | Description | MCP Tool |
|------|-------------|----------|
| **UI Render** | Page loads, elements visible | Chrome |
| **i18n** | All translation keys resolved | Chrome |
| **RTL** | Right-to-left layout correct | Chrome |
| **CRUD Create** | Form submit creates record | Chrome + DB |
| **CRUD Read** | Data displays from DB | Chrome + DB |
| **CRUD Update** | Edit saves to DB | Chrome + DB |
| **CRUD Delete** | Remove deletes from DB | Chrome + DB |
| **Validation** | Form validation works | Chrome |
| **Error States** | Error handling displays | Chrome |
| **Mobile** | Responsive layout works | Chrome (viewport) |
| **Console** | No JS errors (log, don't stop) | Chrome |

---

## 🌐 Chrome MCP Commands

### Navigation

```javascript
// Navigate to page
chrome.navigate({ url: "http://localhost:3000/expenses" })

// Wait for element
chrome.waitForSelector({ selector: "[data-testid='expense-table']", timeout: 5000 })

// Take screenshot
chrome.screenshot({ path: "specs/[branch]/screenshots/expense-page.png" })
```

### Interaction

```javascript
// Click element
chrome.click({ selector: "button[data-testid='add-expense']" })

// Type in input
chrome.type({ selector: "input[name='amount']", text: "150.00" })

// Select dropdown
chrome.select({ selector: "select[name='category']", value: "food" })

// Submit form
chrome.click({ selector: "button[type='submit']" })
```

### Viewport Testing

```javascript
// Desktop
chrome.setViewport({ width: 1920, height: 1080 })

// Mobile
chrome.setViewport({ width: 375, height: 812 }) // iPhone X
```

### Console Monitoring

```javascript
// Get console logs
const logs = chrome.getConsoleLogs()

// Filter errors (log but don't stop)
const errors = logs.filter(l => l.type === 'error')
if (errors.length > 0) {
  // Log to test report, continue testing
  appendToReport("Console Errors", errors)
}
```

---

## 🗄️ Database Verification

### Supabase MCP

```javascript
// Verify record created
const { data } = await supabase
  .from('expenses')
  .select('*')
  .eq('id', expectedId)
  .single()

assert(data !== null, "Record should exist")
assert(data.amount === 150.00, "Amount should match")
```

### Supabase CLI (Fallback)

```bash
# Query via CLI
supabase db execute "SELECT * FROM expenses WHERE id = 'xxx'"

# Seed data
supabase db execute "INSERT INTO expenses (amount, category) VALUES (100, 'test')"
```

### Firebase CLI (Fallback)

```bash
# Export data
firebase firestore:export --collection expenses

# Import test data
firebase firestore:import test-data.json
```

---

## 🔄 Ralph Wiggum Integration

### Execution Command

```bash
/ralph-loop "Execute specs/[branch]/TEST-PLAN.md step-by-step.

RULES:
1. Read TEST-PLAN.md for all test cases
2. Execute each test using Chrome MCP
3. Verify results using Supabase/Firebase MCP
4. Mark [x] for passed, document failures
5. Fix any failures immediately
6. Commit each fix: git commit -m 'fix([scope]): [description]'
7. Re-test after fix
8. Stop at HARD STOP markers for verification
9. Continue to next section after HARD STOP passes
10. Log console errors but don't stop

IF BLOCKED:
- After 3 failed attempts on same issue
- Document in TEST-REPORT.md
- List what was tried
- Output <promise>BLOCKED</promise>

WHEN COMPLETE:
- All tests marked [x]
- All fixes committed
- Generate TEST-REPORT.md
- Output <promise>ALL_TESTS_COMPLETE</promise>
" --max-iterations 50 --completion-promise "ALL_TESTS_COMPLETE"
```

### HARD STOP Markers

Place after critical checkpoints:

```markdown
### **HARD STOP** - Auth Verified
Ensure: User logged in, session valid, correct role

### **HARD STOP** - CRUD Complete  
Ensure: Create, Read, Update, Delete all working

### **HARD STOP** - i18n Fixed
Ensure: No translation keys visible on page
```

### Blocked Protocol

```markdown
## BLOCKED: [Issue Description]

### Attempted Solutions
1. [What was tried]
2. [What was tried]
3. [What was tried]

### Error Details
[Error messages, screenshots]

### Suggested Manual Action
[What human needs to do]

<promise>BLOCKED</promise>
```

---

## 📊 Test Report Generation

### Location

```
specs/[branch]/TEST-REPORT.md
specs/[branch]/screenshots/
```

### Structure

```markdown
# TEST REPORT: [Feature Name]
Generated: [timestamp]
Duration: [time]
Status: ✅ PASSED | ❌ FAILED | ⚠️ BLOCKED

## Summary
| Metric | Count |
|--------|-------|
| Total Tests | X |
| Passed | X |
| Failed | X |
| Fixed | X |
| Blocked | X |

## Test Results

### Page: /expenses
| ID | Test | Status | Notes |
|----|------|--------|-------|
| T1 | UI Render | ✅ | |
| T2 | CRUD Create | ✅ | |

## Fixes Applied
| Commit | Description |
|--------|-------------|
| def456 | fix(ui): correct RTL alignment |

## Console Errors (Non-Blocking)
- [timestamp] Warning: ...
- [timestamp] Error: ... (logged, not critical)

## Screenshots
- [expense-page-desktop.png](./screenshots/expense-page-desktop.png)
- [expense-page-mobile.png](./screenshots/expense-page-mobile.png)

## Blocked Issues
[None | List of blocked items]
```

---

## ⚙️ Configuration

### .claude/settings.json

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

### Test Credentials (CLAUDE.md)

```markdown
## Test Accounts
- Admin: hossamsharif1990@gmail.com / Hossam1990@
- User1: halabija@gmail.com / Hossam1990@
- User2: husameldeenh@gmail.com / Hossam1990@
```

---

## 🚨 Error Handling

| Scenario | Action |
|----------|--------|
| MCP tool not available | Use CLI fallback |
| App not running | Start with `npm run dev` |
| Wrong app on port | Alert user, stop |
| Auth fails all accounts | Create new via CLI |
| Test fails | Fix → Commit → Re-test |
| Fix fails 3x | Mark BLOCKED, continue |
| Console JS error | Log to report, continue |
| Network timeout | Retry 2x, then log |

---

## 📁 File Structure

```
project/
├── specs/
│   └── [branch]/
│       ├── spec.md           # Feature spec (input)
│       ├── tasks.md          # Tasks (input)
│       ├── TEST-PLAN.md      # Generated test plan
│       ├── TEST-REPORT.md    # Generated report
│       └── screenshots/      # Failure evidence
├── .claude/
│   └── settings.json         # MCP permissions
├── CLAUDE.md                 # Test credentials + rules
└── skills/
    └── testing/
        └── SKILL.md          # This file
```