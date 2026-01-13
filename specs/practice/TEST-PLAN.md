# TEST-PLAN: Practice Feature (Custom Practice Sessions)

Generated: 2026-01-12
Spec Source: specs/practice/ (derived from codebase analysis)
Database: Supabase
App URL: http://localhost:3002

---

## Feature Overview

The Practice feature allows users to create customized practice sessions with:
- Section selection (Quantitative/Verbal)
- Category selection
- Difficulty selection (Easy/Medium/Hard)
- Question count selection
- AI-generated questions
- Immediate feedback with explanations
- Progress tracking
- Session pause/resume
- Results with analytics
- Forum sharing

---

## Pre-Test: Authentication

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| AUTH-1 | Login to app | 1. Navigate to /login 2. Enter credentials (hossamsharif1990@gmail.com / Hossam1990@) 3. Submit | Dashboard loads | Chrome | [ ] |
| AUTH-2 | Verify logged in state | Check for user avatar/dashboard access | User menu visible | Chrome | [ ] |

### **HARD STOP** - Auth Checkpoint
- [ ] Logged in successfully
- [ ] Dashboard is accessible

---

## Page: /practice (Practice List Page)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PRAC-LIST-UI-1 | Page loads | Navigate to /practice | Page renders with header | Chrome | [ ] |
| PRAC-LIST-UI-2 | Stats cards visible | Check for 3 stats cards | Total, Completed, In Progress cards | Chrome | [ ] |
| PRAC-LIST-UI-3 | New practice button | Check "New Practice" button exists | Button visible with Plus icon | Chrome | [ ] |
| PRAC-LIST-UI-4 | Empty state | Check empty state when no history | Shows "No completed sessions" message | Chrome | [ ] |

### i18n Tests (RTL/Arabic)
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PRAC-LIST-i18n-1 | Arabic text | Scan page for Arabic content | All labels in Arabic | Chrome | [ ] |
| PRAC-LIST-i18n-2 | RTL layout | Check page direction | dir="rtl" on page | Chrome | [ ] |
| PRAC-LIST-i18n-3 | No raw keys | Check for untranslated keys | No "practice.", "common." prefixes | Chrome | [ ] |

### **HARD STOP** - Practice List Page Complete
- [ ] All UI tests pass
- [ ] All i18n tests pass

---

## Page: /practice/new (New Practice Wizard)

### UI Tests - Step 1: Section Selection
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PRAC-NEW-UI-1 | Wizard loads | Navigate to /practice/new | Step 1 visible with section options | Chrome | [ ] |
| PRAC-NEW-UI-2 | Progress indicator | Check step indicators (5 steps) | Shows 1/5 active | Chrome | [ ] |
| PRAC-NEW-UI-3 | Section options | Check for Quantitative/Verbal options | Both options visible | Chrome | [ ] |
| PRAC-NEW-UI-4 | Select section | Click on Quantitative | Option selected, Next enabled | Chrome | [ ] |
| PRAC-NEW-UI-5 | Next button | Click Next | Moves to Step 2 (Categories) | Chrome | [ ] |

### UI Tests - Step 2: Category Selection
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PRAC-NEW-UI-6 | Categories load | View Step 2 | Category options visible | Chrome | [ ] |
| PRAC-NEW-UI-7 | Select categories | Select 1-2 categories | Categories marked selected | Chrome | [ ] |
| PRAC-NEW-UI-8 | Category limit (free) | Try selecting >2 categories (free user) | Limited to 2 categories | Chrome | [ ] |
| PRAC-NEW-UI-9 | Next to difficulty | Click Next | Moves to Step 3 | Chrome | [ ] |

### UI Tests - Step 3: Difficulty Selection
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PRAC-NEW-UI-10 | Difficulty options | View Step 3 | Easy/Medium/Hard visible | Chrome | [ ] |
| PRAC-NEW-UI-11 | Select difficulty | Click Medium | Medium selected | Chrome | [ ] |
| PRAC-NEW-UI-12 | Next to count | Click Next | Moves to Step 4 | Chrome | [ ] |

### UI Tests - Step 4: Question Count
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PRAC-NEW-UI-13 | Count selector | View Step 4 | Question count slider/input visible | Chrome | [ ] |
| PRAC-NEW-UI-14 | Count limits | Check min/max | Min 5 questions | Chrome | [ ] |
| PRAC-NEW-UI-15 | Next to confirm | Click Next | Moves to Step 5 | Chrome | [ ] |

### UI Tests - Step 5: Confirmation
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PRAC-NEW-UI-16 | Summary visible | View Step 5 | All selections displayed | Chrome | [ ] |
| PRAC-NEW-UI-17 | Estimated time | Check time estimate | Shows ~X minutes | Chrome | [ ] |
| PRAC-NEW-UI-18 | Start button | Check start button | "Start Practice" button visible | Chrome | [ ] |

### Functional Tests - Create Practice Session
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PRAC-NEW-FUNC-1 | Create session | Click "Start Practice" | Loading state, then redirect | Chrome | [ ] |
| PRAC-NEW-FUNC-2 | API creates session | Check network request | POST /api/practice succeeds | Chrome | [ ] |
| PRAC-NEW-FUNC-3 | Redirect to session | After creation | Navigates to /practice/[id] | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PRAC-NEW-i18n-1 | Step labels Arabic | Check step indicators | All in Arabic | Chrome | [ ] |
| PRAC-NEW-i18n-2 | Section names Arabic | Check options | Arabic section names | Chrome | [ ] |
| PRAC-NEW-i18n-3 | Buttons Arabic | Check navigation buttons | Previous/Next/Cancel in Arabic | Chrome | [ ] |

### **HARD STOP** - Practice New Page Complete
- [ ] All wizard steps work
- [ ] Session creation succeeds
- [ ] All i18n tests pass

---

## Page: /practice/[id] (Practice Session Page)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PRAC-SESSION-UI-1 | Session loads | Navigate to active session | Question card visible | Chrome | [ ] |
| PRAC-SESSION-UI-2 | Header info | Check header | Session title, question count visible | Chrome | [ ] |
| PRAC-SESSION-UI-3 | Timer running | Check elapsed time | Timer incrementing | Chrome | [ ] |
| PRAC-SESSION-UI-4 | Progress indicator | Check question navigator | Question grid visible | Chrome | [ ] |
| PRAC-SESSION-UI-5 | Question card | View question | Stem, passage (if any), choices visible | Chrome | [ ] |
| PRAC-SESSION-UI-6 | Answer options | Check choice buttons | 4 answer options | Chrome | [ ] |
| PRAC-SESSION-UI-7 | Full screen mode | Check fullscreen toggle | Toggle button works | Chrome | [ ] |

### Functional Tests - Answering Questions
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PRAC-SESSION-FUNC-1 | Select answer | Click on choice A | Choice highlighted | Chrome | [ ] |
| PRAC-SESSION-FUNC-2 | Submit answer | Click "Confirm Answer" | Loading then feedback | Chrome | [ ] |
| PRAC-SESSION-FUNC-3 | Correct feedback | Submit correct answer | Green feedback, explanation | Chrome | [ ] |
| PRAC-SESSION-FUNC-4 | Incorrect feedback | Submit wrong answer | Red feedback, correct shown | Chrome | [ ] |
| PRAC-SESSION-FUNC-5 | Explanation visible | After answering | Explanation text visible | Chrome | [ ] |
| PRAC-SESSION-FUNC-6 | Next enabled | After answering | Next button enabled | Chrome | [ ] |
| PRAC-SESSION-FUNC-7 | Navigate next | Click Next | Moves to question 2 | Chrome | [ ] |
| PRAC-SESSION-FUNC-8 | Navigate back | Click Previous | Returns to question 1 | Chrome | [ ] |
| PRAC-SESSION-FUNC-9 | Question grid nav | Click question 3 in grid | Jumps to question 3 | Chrome | [ ] |
| PRAC-SESSION-FUNC-10 | Answer persisted | Navigate away and back | Previous answer shown | Chrome | [ ] |

### Functional Tests - Session Controls
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PRAC-SESSION-FUNC-11 | Pause dialog | Click Pause button | Confirmation dialog | Chrome | [ ] |
| PRAC-SESSION-FUNC-12 | Pause session | Confirm pause | Redirects to dashboard | Chrome | [ ] |
| PRAC-SESSION-FUNC-13 | Resume session | From /practice, click resume | Session continues | Chrome | [ ] |
| PRAC-SESSION-FUNC-14 | Abandon dialog | Click Abandon button | Confirmation prompt | Chrome | [ ] |
| PRAC-SESSION-FUNC-15 | Complete session | Answer all, click Complete | Redirects to results | Chrome | [ ] |

### Stats Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PRAC-SESSION-STATS-1 | Answered count | After answering 3 questions | Shows "3 answered" | Chrome | [ ] |
| PRAC-SESSION-STATS-2 | Correct count | After 2 correct | Shows "2 correct" | Chrome | [ ] |
| PRAC-SESSION-STATS-3 | Incorrect count | After 1 incorrect | Shows "1 incorrect" | Chrome | [ ] |
| PRAC-SESSION-STATS-4 | Remaining count | With 5 total, 3 answered | Shows "2 remaining" | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PRAC-SESSION-i18n-1 | Question text Arabic | View question | Arabic stem visible | Chrome | [ ] |
| PRAC-SESSION-i18n-2 | Button labels | Check all buttons | Arabic labels | Chrome | [ ] |
| PRAC-SESSION-i18n-3 | Feedback Arabic | After answer | Arabic feedback messages | Chrome | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PRAC-SESSION-MOB-1 | Responsive layout | Set viewport 375x812 | Stacked layout | Chrome | [ ] |
| PRAC-SESSION-MOB-2 | Question readable | Mobile viewport | Full question visible | Chrome | [ ] |
| PRAC-SESSION-MOB-3 | Touch targets | Mobile viewport | Buttons 44px minimum | Chrome | [ ] |
| PRAC-SESSION-MOB-4 | Navigation usable | Mobile viewport | Can navigate questions | Chrome | [ ] |

### **HARD STOP** - Practice Session Page Complete
- [ ] All question answering works
- [ ] All controls functional
- [ ] Mobile responsive
- [ ] All i18n tests pass

---

## Page: /practice/results/[id] (Results Page)

### UI Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PRAC-RESULTS-UI-1 | Results load | Navigate after completion | Results page renders | Chrome | [ ] |
| PRAC-RESULTS-UI-2 | Score card | Check main score | Large percentage visible | Chrome | [ ] |
| PRAC-RESULTS-UI-3 | Score color | Check score styling | Color reflects performance | Chrome | [ ] |
| PRAC-RESULTS-UI-4 | Session details | Check details card | Section, difficulty, categories shown | Chrome | [ ] |
| PRAC-RESULTS-UI-5 | Category breakdown | Check breakdown section | Performance by category | Chrome | [ ] |
| PRAC-RESULTS-UI-6 | Strengths card | Check strengths | Green card with strong categories | Chrome | [ ] |
| PRAC-RESULTS-UI-7 | Weaknesses card | Check weaknesses | Orange card with weak categories | Chrome | [ ] |
| PRAC-RESULTS-UI-8 | Time spent | Check time display | Formatted time shown | Chrome | [ ] |
| PRAC-RESULTS-UI-9 | Action buttons | Check buttons | New practice, Review, Share visible | Chrome | [ ] |

### Functional Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PRAC-RESULTS-FUNC-1 | Review questions | Click "Review Questions" | Scrolls to review section | Chrome | [ ] |
| PRAC-RESULTS-FUNC-2 | Question review | Check review component | All questions with answers shown | Chrome | [ ] |
| PRAC-RESULTS-FUNC-3 | Share modal | Click "Share to Forum" | Share dialog opens | Chrome | [ ] |
| PRAC-RESULTS-FUNC-4 | New practice | Click "New Practice" | Navigates to /practice/new | Chrome | [ ] |
| PRAC-RESULTS-FUNC-5 | Practice weak areas | Click "Practice Weaknesses" | New practice with categories preset | Chrome | [ ] |
| PRAC-RESULTS-FUNC-6 | Return dashboard | Click "Return to Dashboard" | Navigates to /dashboard | Chrome | [ ] |

### i18n Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PRAC-RESULTS-i18n-1 | Score Arabic | Check score text | Arabic labels | Chrome | [ ] |
| PRAC-RESULTS-i18n-2 | Section labels | Check detail labels | Arabic section names | Chrome | [ ] |
| PRAC-RESULTS-i18n-3 | Button labels | Check buttons | Arabic button text | Chrome | [ ] |

### Mobile Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PRAC-RESULTS-MOB-1 | Responsive layout | Set viewport 375x812 | Stacked cards | Chrome | [ ] |
| PRAC-RESULTS-MOB-2 | Score readable | Mobile viewport | Score clearly visible | Chrome | [ ] |
| PRAC-RESULTS-MOB-3 | Charts fit | Mobile viewport | Category bars fit screen | Chrome | [ ] |

### **HARD STOP** - Results Page Complete
- [ ] All results display correctly
- [ ] All actions work
- [ ] Mobile responsive
- [ ] All i18n tests pass

---

## End-to-End Flow Test

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| E2E-1 | Complete practice flow | 1. Login 2. Go to /practice/new 3. Complete wizard 4. Answer 5 questions 5. Complete session 6. View results | All steps successful | Chrome | [ ] |
| E2E-2 | Pause and resume | 1. Start practice 2. Answer 2 questions 3. Pause 4. Resume 5. Complete | Session continues from pause | Chrome | [ ] |
| E2E-3 | Share to forum | 1. Complete practice 2. Share to forum | Post created successfully | Chrome | [ ] |

### **HARD STOP** - E2E Flow Complete
- [ ] Complete flow works
- [ ] Pause/resume works
- [ ] Sharing works

---

## Database Verification Tests

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| DB-1 | Session created | After starting practice | Record in practice_sessions | Supabase | [ ] |
| DB-2 | Answers saved | After submitting answers | Answers stored in session | Supabase | [ ] |
| DB-3 | Session completed | After completion | Status = 'completed' | Supabase | [ ] |
| DB-4 | Session paused | After pause | Status = 'paused' | Supabase | [ ] |

---

## Error Handling Tests

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| ERR-1 | Invalid session ID | Navigate to /practice/invalid-uuid | Error message shown | Chrome | [ ] |
| ERR-2 | Network error | Disconnect network, submit answer | Error message, retry option | Chrome | [ ] |
| ERR-3 | Session expired | Access old paused session | Appropriate error handling | Chrome | [ ] |

---

## Success Criteria

- All [ ] marked as [x]
- All HARD STOPs verified
- All fixes committed
- TEST-REPORT.md generated
- Screenshots saved for failures
- Output `<promise>ALL_TESTS_COMPLETE</promise>`

---

## Test Execution Notes

- Use test account: hossamsharif1990@gmail.com / Hossam1990@
- Fallback accounts: halabija@gmail.com, husameldeenh@gmail.com
- Database: Supabase (use MCP tools for verification)
- App running on: http://localhost:3000 (verify before testing)
- RTL language: Arabic
- All text should be in Arabic unless explicitly English (e.g., code/technical terms)
