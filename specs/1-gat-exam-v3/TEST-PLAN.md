# TEST-PLAN: GAT Exam Platform v3.0 - Advanced Diagrams & Quality Improvements

Generated: 2026-01-12T15:30:00Z
Spec Source: specs/1-gat-exam-v3/
Database: Supabase
App URL: http://localhost:3002

---

## Pre-Test: Authentication

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| AUTH-1 | Login page loads | Navigate to /login | Login form renders with email/password fields | Chrome | [ ] |
| AUTH-2 | Login with valid credentials | Enter hossamsharif1990@gmail.com / Hossam1990@ → Submit | Redirect to dashboard | Chrome | [ ] |
| AUTH-3 | Session persists | Navigate to /dashboard after login | User remains logged in | Chrome | [ ] |

### **HARD STOP** - Auth Checkpoint
- [ ] Logged in successfully
- [ ] Dashboard accessible

---

## Page: Home (/)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| HOME-UI-1 | Home page loads | Navigate to / | Page renders with branding "قدراتك" | Chrome | [ ] |
| HOME-UI-2 | Navigation links | Check nav links | Login, Register links visible | Chrome | [ ] |
| HOME-UI-3 | Feature sections | Scroll page | All feature cards render | Chrome | [ ] |
| HOME-UI-4 | Pricing section | Scroll to pricing | Free and Premium plans visible | Chrome | [ ] |
| HOME-UI-5 | Sample question display | Check demo question | Sample math question visible with choices | Chrome | [ ] |

### i18n/RTL Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| HOME-i18n-1 | Arabic text | Check all visible text | All text in Arabic, RTL layout | Chrome | [ ] |
| HOME-i18n-2 | No raw i18n keys | Scan for patterns like t('...') | No untranslated keys visible | Chrome | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| HOME-MOB-1 | Mobile viewport | Resize to 375x812 | Layout adapts, no horizontal scroll | Chrome | [ ] |
| HOME-MOB-2 | Mobile navigation | Check mobile nav | Hamburger menu or collapsed nav | Chrome | [ ] |

### **HARD STOP** - Home Page Complete
- [ ] All HOME tests pass

---

## Page: Dashboard (/dashboard)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| DASH-UI-1 | Dashboard loads | Navigate to /dashboard | Dashboard renders with user stats | Chrome | [ ] |
| DASH-UI-2 | Quick actions | Check action buttons | Exam, Practice, Forum links visible | Chrome | [ ] |
| DASH-UI-3 | Stats display | Check stats section | Credits, exams taken, performance shown | Chrome | [ ] |
| DASH-UI-4 | Recent activity | Check activity section | Recent sessions or empty state | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| DASH-i18n-1 | Arabic labels | Check all labels | All in Arabic | Chrome | [ ] |

### **HARD STOP** - Dashboard Complete
- [ ] All DASH tests pass

---

## Page: Practice Setup (/practice/new)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PRAC-UI-1 | Practice page loads | Navigate to /practice/new | Practice configuration form renders | Chrome | [ ] |
| PRAC-UI-2 | Track selection | Check track options | Scientific/Literary track options | Chrome | [ ] |
| PRAC-UI-3 | Question type selection | Check type options | Quantitative/Verbal sections | Chrome | [ ] |
| PRAC-UI-4 | Question count slider | Check count control | Slider or input for question count | Chrome | [ ] |
| PRAC-UI-5 | Difficulty selection | Check difficulty options | Easy/Medium/Hard options | Chrome | [ ] |
| PRAC-UI-6 | Start button | Check start action | Start Practice button visible | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PRAC-i18n-1 | Form labels Arabic | Check form labels | All labels in Arabic | Chrome | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PRAC-MOB-1 | Mobile form layout | Resize to 375x812 | Form stacks vertically | Chrome | [ ] |

### **HARD STOP** - Practice Setup Complete
- [ ] All PRAC tests pass

---

## Page: Practice Session (/practice/[id])

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SESS-UI-1 | Session loads | Start a practice session | Question displays with choices | Chrome | [ ] |
| SESS-UI-2 | Question counter | Check progress | Shows current/total (e.g., 1/10) | Chrome | [ ] |
| SESS-UI-3 | Answer choices | Check choices | 4 answer choices displayed | Chrome | [ ] |
| SESS-UI-4 | Navigation buttons | Check nav | Next/Previous buttons | Chrome | [ ] |
| SESS-UI-5 | Timer display | Check timer | Session timer visible | Chrome | [ ] |
| SESS-UI-6 | Explanation button | Check explanation | Explanation toggle available | Chrome | [ ] |

### Question Type Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SESS-QT-1 | MCQ question | View MCQ question | Standard multiple choice format | Chrome | [ ] |
| SESS-QT-2 | Comparison question | Find comparison Q | Two values with 4 standard choices | Chrome | [ ] |
| SESS-QT-3 | Diagram question | Find diagram Q | Diagram renders with shading | Chrome | [ ] |

### Diagram Tests (User Story 1)
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| DIAG-1 | Diagram renders | View geometry question | Diagram visible in <500ms | Chrome | [ ] |
| DIAG-2 | Arabic labels | Check diagram labels | Arabic text on vertices/measurements | Chrome | [ ] |
| DIAG-3 | Shading visible | Check shaded region | Shaded area clearly visible | Chrome | [ ] |
| DIAG-4 | Responsive sizing | Resize window | Diagram scales proportionally | Chrome | [ ] |
| DIAG-5 | Formula display | Answer question | Formula shown in explanation | Chrome | [ ] |

### Comparison Question Tests (User Story 3)
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| COMP-1 | Two values displayed | Find comparison Q | القيمة الأولى and القيمة الثانية labels | Chrome | [ ] |
| COMP-2 | Four standard choices | Check answers | Exactly 4 Arabic comparison choices | Chrome | [ ] |
| COMP-3 | Explanation shows relationship | Answer question | Explanation clarifies comparison | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SESS-i18n-1 | Question text Arabic | Check question | فصحى Arabic grammar | Chrome | [ ] |
| SESS-i18n-2 | Choice text Arabic | Check choices | All choices in Arabic | Chrome | [ ] |
| SESS-i18n-3 | Explanation Arabic | View explanation | Explanation in Arabic | Chrome | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SESS-MOB-1 | Mobile question view | Resize to 375x812 | Question readable, choices tappable | Chrome | [ ] |
| SESS-MOB-2 | Mobile diagram | View diagram on mobile | Diagram fits viewport | Chrome | [ ] |

### **HARD STOP** - Practice Session Complete
- [ ] All SESS, DIAG, COMP tests pass

---

## Page: Practice Results (/practice/results/[id])

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| RES-UI-1 | Results page loads | Complete practice session | Results summary displays | Chrome | [ ] |
| RES-UI-2 | Score display | Check score | Score percentage shown | Chrome | [ ] |
| RES-UI-3 | Time taken | Check time | Total time displayed | Chrome | [ ] |
| RES-UI-4 | Question breakdown | Check breakdown | Correct/Wrong counts | Chrome | [ ] |
| RES-UI-5 | Review button | Check review | Option to review answers | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| RES-i18n-1 | Results labels Arabic | Check labels | All in Arabic | Chrome | [ ] |

### **HARD STOP** - Results Page Complete
- [ ] All RES tests pass

---

## Page: Exam Mode (/exam)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| EXAM-UI-1 | Exam page loads | Navigate to /exam | Exam setup or start page | Chrome | [ ] |
| EXAM-UI-2 | Track selection | Check options | Scientific/Literary track | Chrome | [ ] |
| EXAM-UI-3 | Full exam option | Check full exam | 120 question exam available | Chrome | [ ] |
| EXAM-UI-4 | Start exam button | Check start | Start button visible | Chrome | [ ] |

### Full Exam Tests (User Story 6)
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| EXAM-FULL-1 | Start full exam | Start 120Q exam | Exam session begins | Chrome | [ ] |
| EXAM-FULL-2 | Topic distribution | Check questions | ~40% arithmetic, 24% geometry | Chrome+DB | [ ] |
| EXAM-FULL-3 | Difficulty distribution | Check questions | ~30% easy, 50% medium, 20% hard | Chrome+DB | [ ] |

### **HARD STOP** - Exam Mode Complete
- [ ] All EXAM tests pass

---

## Page: Test Overlapping Shapes (/test/overlapping-shapes)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| OVL-UI-1 | Test page loads | Navigate to /test/overlapping-shapes | Test patterns visible | Chrome | [ ] |
| OVL-UI-2 | Pattern 1: Square with quarter circles | Check pattern | Renders correctly | Chrome | [ ] |
| OVL-UI-3 | Pattern 2: Square vertex at circle center | Check pattern | Renders correctly | Chrome | [ ] |
| OVL-UI-4 | Pattern 3: Rose pattern | Check pattern | Four semicircles visible | Chrome | [ ] |
| OVL-UI-5 | Pattern 4: Three tangent circles | Check pattern | Renders correctly | Chrome | [ ] |
| OVL-UI-6 | Pattern 5: Circular sector | Check pattern | Renders correctly | Chrome | [ ] |
| OVL-UI-7 | Pattern 6: Circles in rectangle | Check pattern | Renders correctly | Chrome | [ ] |
| OVL-UI-8 | Pattern 7: Circle inscribed in square | Check pattern | Renders correctly | Chrome | [ ] |
| OVL-UI-9 | Pattern 8: Square inscribed in circle | Check pattern | Renders correctly | Chrome | [ ] |

### Rendering Performance Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| OVL-PERF-1 | Render time | Measure render | <500ms per diagram | Chrome | [ ] |
| OVL-PERF-2 | No jank | Observe rendering | Smooth appearance | Chrome | [ ] |

### **HARD STOP** - Overlapping Shapes Complete
- [ ] All OVL tests pass

---

## Page: Admin Review Queue (/admin/review-queue)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| ADM-UI-1 | Admin page loads | Navigate to /admin/review-queue | Review queue table renders | Chrome | [ ] |
| ADM-UI-2 | Flagged questions | Check queue | List of flagged questions | Chrome | [ ] |
| ADM-UI-3 | Approve/Reject actions | Check actions | Approve/Reject buttons | Chrome | [ ] |

### **HARD STOP** - Admin Complete
- [ ] All ADM tests pass

---

## Cross-Cutting: Responsive Tests

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| RESP-1 | Desktop 1920px | Resize to 1920x1080 | Full layout, no issues | Chrome | [ ] |
| RESP-2 | Tablet 1024px | Resize to 1024x768 | Layout adapts | Chrome | [ ] |
| RESP-3 | Mobile 375px | Resize to 375x812 | Mobile layout | Chrome | [ ] |
| RESP-4 | Small mobile 320px | Resize to 320x568 | No horizontal overflow | Chrome | [ ] |

### **HARD STOP** - Responsive Complete
- [ ] All RESP tests pass

---

## Cross-Cutting: Accessibility Tests

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| A11Y-1 | Diagram captions | Check diagrams | All have Arabic captions | Chrome | [ ] |
| A11Y-2 | Color contrast | Check text contrast | WCAG 2.1 AA compliant | Chrome | [ ] |
| A11Y-3 | Keyboard navigation | Tab through page | All interactive elements reachable | Chrome | [ ] |
| A11Y-4 | ARIA labels | Check diagram ARIA | Proper aria-label attributes | Chrome | [ ] |

### **HARD STOP** - Accessibility Complete
- [ ] All A11Y tests pass

---

## Cross-Cutting: Console Error Tests

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| ERR-1 | Home page errors | Check console on / | No JS errors | Chrome | [ ] |
| ERR-2 | Dashboard errors | Check console on /dashboard | No JS errors | Chrome | [ ] |
| ERR-3 | Practice errors | Check console during practice | No JS errors | Chrome | [ ] |
| ERR-4 | Exam errors | Check console during exam | No JS errors | Chrome | [ ] |

---

## Database Verification Tests

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| DB-1 | Practice session saved | Complete practice | Session in practice_sessions table | DB | [ ] |
| DB-2 | User credits tracked | Check user | Credits count accurate | DB | [ ] |
| DB-3 | Question quality flags | Generate question | quality_flags column populated | DB | [ ] |

---

## Success Criteria

Test execution is complete when:

- [ ] All test cases marked [x]
- [ ] All HARD STOPs verified
- [ ] All fixes committed
- [ ] TEST-REPORT.md generated
- [ ] Screenshots saved for failures
- [ ] `<promise>ALL_TESTS_COMPLETE</promise>` output

---

## Test Accounts

```yaml
primary:
  email: hossamsharif1990@gmail.com
  password: Hossam1990@

backup_1:
  email: halabija@gmail.com
  password: Hossam1990@

backup_2:
  email: husameldeenh@gmail.com
  password: Hossam1990@
```

---

## Total Test Count

- Authentication: 3
- Home Page: 9
- Dashboard: 5
- Practice Setup: 7
- Practice Session: 19
- Practice Results: 6
- Exam Mode: 7
- Overlapping Shapes: 11
- Admin: 3
- Responsive: 4
- Accessibility: 4
- Console Errors: 4
- Database: 3

**Total: 85 test cases**
