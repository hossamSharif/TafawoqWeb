# Command: /test-plan

> Generates a comprehensive TEST-PLAN.md from specs for autonomous execution

---

## Usage

```bash
/test-plan [feature-branch]

# Examples:
/test-plan                    # Uses current branch
/test-plan expenses           # Uses specs/expenses/
/test-plan 1-gat-exam-v3      # Uses specs/1-gat-exam-v3/
```

---

## Execution Prompt

```
You are a QA Test Architect. Generate a comprehensive TEST-PLAN.md for autonomous MCP-driven testing.

## PHASE 1: ENVIRONMENT DETECTION

1. **Detect Database Type**
   - Check for `supabase/config.toml` or `firebase.json`
   - Check package.json dependencies
   - Check .env files for SUPABASE_URL or FIREBASE_*
   - Store: DATABASE_TYPE = "supabase" | "firebase"

2. **Find Running App**
   - Check ports: 3000, 3001, 3002, 3003, 3004, 3005
   - Verify correct app by checking:
     - Page title
     - Known route exists
     - Package.json name matches
   - If no app: Run `npm run dev`
   - Store: APP_URL

3. **Identify Spec Directory**
   - Use provided branch name OR current git branch
   - Path: `specs/[branch]/`
   - Required: spec.md, tasks.md

## PHASE 2: SPEC ANALYSIS

Read and parse:
- `specs/[branch]/spec.md` → Feature requirements
- `specs/[branch]/tasks.md` → Implementation details
- Any other .md files → Additional context

Extract:
- All pages/routes mentioned
- All components mentioned
- All API endpoints
- Database tables/collections
- Form fields and validations
- User roles and permissions
- i18n requirements

## PHASE 3: TEST CASE GENERATION

For EACH page/route, generate test cases covering:

### UI Tests
- [ ] Page loads without error
- [ ] All elements render correctly
- [ ] Loading states display
- [ ] Empty states display
- [ ] Error states display

 

### CRUD Tests (if applicable)
- [ ] Create: Form submit creates DB record
- [ ] Read: Data loads from DB correctly
- [ ] Update: Edit saves to DB
- [ ] Delete: Remove deletes from DB
- [ ] List: Pagination works
- [ ] Search: Filter works

### Validation Tests
- [ ] Required fields enforced
- [ ] Format validation (email, phone, etc.)
- [ ] Error messages display

### Auth Tests (if applicable)
- [ ] Protected route redirects
- [ ] Role-based access works
- [ ] Session persists

### Mobile Tests
- [ ] Responsive layout (375px width)
- [ ] Touch interactions work
- [ ] RTL on mobile

## PHASE 4: GENERATE TEST-PLAN.md

Output to: `specs/[branch]/TEST-PLAN.md`

Use this EXACT structure:

```markdown
# TEST-PLAN: [Feature Name]

Generated: [YYYY-MM-DD HH:mm]
Spec Source: specs/[branch]/spec.md
Executed By: Claude Code + Ralph Wiggum

---

## 🔧 Environment

| Setting | Value |
|---------|-------|
| App URL | http://localhost:[port] |
| Database | [supabase/firebase] |
| Auth Account | hossamsharif1990@gmail.com |
| Viewports | Desktop (1920x1080), Mobile (375x812) |

---

## 🔐 Pre-Test: Authentication

| ID | Test | Steps | Expected | Tool |
|----|------|-------|----------|------|
| AUTH-1 | Login | Navigate to /login → Enter credentials → Submit | Redirect to dashboard | Chrome MCP |
| AUTH-2 | Session | Refresh page | Stay logged in | Chrome MCP |

### **HARD STOP** - Authentication Checkpoint
- [ ] Logged in successfully
- [ ] Correct user role
- [ ] Session persisted

---

## 📄 Page: [/route-name]

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| [PAGE]-UI-1 | Page Load | Navigate to [route] | Page renders, no errors | Chrome | [ ] |
| [PAGE]-UI-2 | Elements | Check all elements | All visible | Chrome | [ ] |


### CRUD Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| [PAGE]-CRUD-1 | Create | Fill form → Submit | New record in DB | Chrome + DB | [ ] |
| [PAGE]-CRUD-2 | Read | Load page | Data matches DB | Chrome + DB | [ ] |
| [PAGE]-CRUD-3 | Update | Edit → Save | DB record updated | Chrome + DB | [ ] |
| [PAGE]-CRUD-4 | Delete | Click delete → Confirm | Record removed from DB | Chrome + DB | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| [PAGE]-MOB-1 | Layout | Set viewport 375x812 | Responsive layout | Chrome | [ ] |

### **HARD STOP** - [Page Name] Complete
- [ ] All UI tests pass
- [ ] All i18n resolved
- [ ] All CRUD verified in DB
- [ ] Mobile tested

---

[REPEAT FOR EACH PAGE]

---

## 🚨 Blocked Protocol

If unable to proceed after 3 attempts on any test:

1. Mark test as BLOCKED
2. Document in this section:
   - Issue description
   - Error messages
   - Attempted solutions
3. Continue to next test
4. If >50% tests blocked: Output `<promise>BLOCKED</promise>`

---

## ✅ Success Criteria

All must be true to output `<promise>ALL_TESTS_COMPLETE</promise>`:

- [ ] All test cases marked [x]
- [ ] All HARD STOPs passed
- [ ] All fixes committed to git
- [ ] TEST-REPORT.md generated
- [ ] Screenshots saved for failures

---

## 🔄 Ralph Wiggum Execution

Run this plan with:

\`\`\`bash
/ralph-loop "Execute specs/[branch]/TEST-PLAN.md autonomously.

RULES:
1. Read each test case in order
2. Execute using specified MCP tool
3. Mark [x] when passed
4. Fix failures immediately, commit with: git commit -m 'fix([scope]): [desc]'
5. Re-test after fix
6. Pause at HARD STOP markers for verification
7. Log console errors to report (don't stop)
8. Take screenshots on failure
9. After 3 failed fix attempts: mark BLOCKED, continue

OUTPUT:
- <promise>BLOCKED</promise> if >50% tests blocked
- <promise>ALL_TESTS_COMPLETE</promise> when all pass
" --max-iterations 50 --completion-promise "ALL_TESTS_COMPLETE"
\`\`\`
```

## PHASE 5: CONFIRMATION

After generating TEST-PLAN.md:
1. Display summary: X pages, Y total tests
2. Show file path
3. Ask: "Run /test-execute to begin autonomous testing?"

---

## DO NOT:
- Ask for confirmation during generation
- Skip any page mentioned in specs
- Generate incomplete test cases
- Forget HARD STOP markers
- Omit the Ralph Wiggum execution command
```

---

## Output

```
specs/[branch]/TEST-PLAN.md
```

---

## Next Step

After `/test-plan` completes, run:

```bash
/test-execute
```