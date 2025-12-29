# Manual Testing Guide - Pause/Resume Feature

**Created:** 2025-12-21
**Test URL:** http://localhost:3000
**Test User:** husameldeenh@gmail.com
**Password:** Hossam1990@

---

## Prerequisites

- Development server running on http://localhost:3000
- Test user account created and verified
- Browser with clean state (clear cache if needed)

---

## Test Scenario 1: Exam Pause and Resume

### Objective
Verify that users can pause an exam mid-session and resume it later with timer continuity.

### Steps

**1. Start an Exam**
- [ ] Navigate to http://localhost:3000
- [ ] Login with test credentials
- [ ] Click "ابدأ اختبار قدرات" (Start Qudurat Exam)
- [ ] Select track (scientific or literary)
- [ ] Click start button
- [ ] **Expected:** Exam page loads with timer and questions

**2. Pause the Exam**
- [ ] Note the current timer value (e.g., "1:56:30")
- [ ] Click the yellow "إيقاف مؤقت" (Pause) button
- [ ] **Expected:** Confirmation dialog appears showing:
  - Current progress (e.g., "0 من 96 سؤال")
  - Remaining time
  - Warning message
- [ ] Click "إيقاف الاختبار" (Pause Exam)
- [ ] **Expected:** Redirected to dashboard

**3. Verify Dashboard Display**
- [ ] Locate "جلساتي النشطة" (My Active Sessions) section
- [ ] **Expected:** Shows paused exam with:
  - Title: "اختبار قدرات"
  - Status badge: "متوقف" (yellow)
  - Progress bar showing completion
  - "استئناف" (Resume) button
  - Time paused indicator

**4. Check Navigation Widget**
- [ ] Look at top navigation bar
- [ ] **Expected:** Badge shows "1" active session
- [ ] Click on the badge/icon
- [ ] **Expected:** Dropdown shows paused exam with resume option

**5. Resume from Dashboard**
- [ ] Click "استئناف" button in dashboard card
- [ ] **Expected:** Redirected to exam page
- [ ] **Expected:** Timer shows exactly where it was paused
- [ ] **Expected:** Same questions visible
- [ ] **Expected:** Answers preserved if any were selected

**6. Test Pause Limit**
- [ ] Pause the current exam again
- [ ] Try to start a new exam
- [ ] Attempt to pause the new exam
- [ ] **Expected:** Error message: "لديك اختبار متوقف بالفعل"
- [ ] **Expected:** Cannot pause second exam

---

## Test Scenario 2: Practice Pause and Resume

### Objective
Verify practice sessions can be paused independently of exam sessions.

### Steps

**1. Start a Practice Session**
- [ ] Navigate to "تمرين" (Practice) page
- [ ] Select section (verbal/quantitative)
- [ ] Select categories
- [ ] Select difficulty
- [ ] Click start
- [ ] **Expected:** Practice page loads with questions

**2. Pause the Practice**
- [ ] Answer 1-2 questions (optional)
- [ ] Click yellow "إيقاف مؤقت" button
- [ ] **Expected:** Confirmation dialog appears
- [ ] Confirm pause
- [ ] **Expected:** Redirected to dashboard

**3. Verify Both Sessions Can Be Paused**
- [ ] Check dashboard "جلساتي النشطة" section
- [ ] **Expected:** Shows both:
  - 1 paused exam
  - 1 paused practice
- [ ] Navigation badge should show "2"
- [ ] **Expected:** Both are paused simultaneously (separate limits)

**4. Resume Practice**
- [ ] Click "استئناف" on practice card
- [ ] **Expected:** Returns to practice page
- [ ] **Expected:** Same questions
- [ ] **Expected:** Answers preserved
- [ ] **Expected:** No timer (practice has no timer)

**5. Test Practice Pause Limit**
- [ ] Pause the current practice
- [ ] Start a new practice session
- [ ] Try to pause the new practice
- [ ] **Expected:** Error: "لديك تمرين متوقف بالفعل"

---

## Test Scenario 3: Navigation Widget Functionality

### Objective
Verify the navigation widget provides easy access to paused sessions.

### Steps

**1. Desktop View (> 768px width)**
- [ ] Resize browser to desktop width
- [ ] **Expected:** Widget shows as full button with text
- [ ] **Expected:** Badge shows total count of active sessions
- [ ] Click widget
- [ ] **Expected:** Popover opens showing session list

**2. Mobile View (< 768px width)**
- [ ] Resize browser to mobile width (e.g., 375px)
- [ ] **Expected:** Widget shows as compact icon only
- [ ] **Expected:** Badge still visible with count
- [ ] Tap widget
- [ ] **Expected:** Popover opens with session list

**3. Quick Resume from Widget**
- [ ] Open navigation widget
- [ ] Find paused session in list
- [ ] Click "استئناف" button
- [ ] **Expected:** Navigates directly to session
- [ ] **Expected:** Session resumes correctly

---

## Test Scenario 4: Timer Precision

### Objective
Verify timer resumes at exact pause point.

### Steps

**1. Precise Timer Test**
- [ ] Start exam
- [ ] Wait for timer to reach specific value (e.g., 1:55:37)
- [ ] Immediately click pause
- [ ] Note exact seconds value
- [ ] Resume exam immediately
- [ ] **Expected:** Timer shows same value ±1 second
- [ ] Wait 10 seconds
- [ ] Pause again
- [ ] Resume after 5 minutes wait
- [ ] **Expected:** Timer continues from pause point (not from start)

**2. Long Pause Test**
- [ ] Pause exam
- [ ] Wait 2-3 minutes
- [ ] Check dashboard - note "متوقف منذ" (paused since) indicator
- [ ] Resume exam
- [ ] **Expected:** Timer hasn't progressed during pause
- [ ] **Expected:** Remaining time is preserved

---

## Test Scenario 5: Session Persistence

### Objective
Verify paused sessions survive page refresh and logout.

### Steps

**1. Refresh Test**
- [ ] Pause exam and practice
- [ ] Refresh browser (F5)
- [ ] **Expected:** Redirected to login/dashboard
- [ ] **Expected:** Both paused sessions still visible

**2. Logout/Login Test**
- [ ] With paused sessions active, logout
- [ ] Login again
- [ ] **Expected:** Dashboard shows paused sessions
- [ ] **Expected:** Can resume both successfully

**3. Multiple Days Test** (if time allows)
- [ ] Pause sessions
- [ ] Close browser completely
- [ ] Return next day
- [ ] Login
- [ ] **Expected:** Paused sessions still available
- [ ] **Expected:** No expiration message

---

## Test Scenario 6: Edge Cases

### Objective
Test error handling and edge cases.

### Steps

**1. Network Interruption Simulation**
- [ ] Start exam
- [ ] Open DevTools > Network tab
- [ ] Set to "Offline" mode
- [ ] Try to pause
- [ ] **Expected:** Shows error message gracefully
- [ ] Set back to "Online"
- [ ] Retry pause
- [ ] **Expected:** Works correctly

**2. Concurrent Pause Attempts**
- [ ] Start exam
- [ ] Open same app in two browser tabs
- [ ] Pause in first tab
- [ ] Try to access same session in second tab
- [ ] **Expected:** Shows appropriate status
- [ ] **Expected:** No data corruption

**3. Question Generation on Resume**
- [ ] Start exam (partial generation mode)
- [ ] Wait for first batch to load
- [ ] Pause before all questions generated
- [ ] Resume
- [ ] **Expected:** Remaining questions generate
- [ ] **Expected:** No duplicate questions
- [ ] **Expected:** Smooth continuation

---

## Expected UI/UX Elements

### Dashboard Session Card
```
┌─────────────────────────────────────┐
│ اختبار قدرات                       │
│ [متوقف] المسار العلمي - 96 سؤال    │
│ ▓▓▓▓▓░░░░░░░ 30%                    │
│ متوقف منذ 5 دقائق                   │
│ الوقت المتبقي: 1:56:42              │
│                        [استئناف]    │
└─────────────────────────────────────┘
```

### Navigation Widget (Desktop)
```
[🎯 2] ← Badge showing count
```

### Navigation Widget Popover
```
┌─────────────────────────────────────┐
│ الجلسات النشطة                      │
├─────────────────────────────────────┤
│ اختبار قدرات [متوقف]    [استئناف]  │
│ تمرين لفظي [متوقف]       [استئناف]  │
└─────────────────────────────────────┘
```

---

## Pass Criteria

### Functional Requirements
- ✅ Exam can be paused at any point
- ✅ Practice can be paused at any point
- ✅ Timer preserves exact value on pause/resume
- ✅ Maximum 1 paused exam at a time
- ✅ Maximum 1 paused practice at a time
- ✅ Both can be paused simultaneously
- ✅ Sessions accessible from dashboard
- ✅ Sessions accessible from navigation
- ✅ Paused sessions never expire
- ✅ Questions and answers preserved

### Performance Requirements
- Pause operation completes in < 1 second
- Resume operation completes in < 2 seconds
- Dashboard loads paused sessions in < 1 second
- Navigation widget responsive (< 300ms)

### UX Requirements
- Clear visual distinction of paused status (yellow badge)
- Confirmation dialogs prevent accidental pauses
- Informative error messages for limit violations
- Smooth navigation flow
- Arabic RTL text properly aligned

---

## Known Limitations

1. **Chrome DevTools MCP Conflict**: During testing, if another browser instance is using the MCP profile, you'll need to use a manual browser session.

2. **Test Data Cleanup**: Test sessions are automatically cleaned up by the test script, but manual testing may leave sessions in the database.

3. **Automated Tests Available**: Run `npx tsx scripts/test-pause-resume.ts` for automated verification.

---

## Troubleshooting

### Issue: Pause button not appearing
- **Check:** Session status must be 'in_progress'
- **Check:** Browser console for errors
- **Fix:** Refresh page and restart session

### Issue: Timer not preserving value
- **Check:** Network tab for API errors
- **Check:** Database `remaining_time_seconds` column
- **Fix:** Clear browser cache and retry

### Issue: Cannot pause (limit reached)
- **Check:** Dashboard for existing paused sessions
- **Fix:** Resume or abandon existing paused session

### Issue: Session not showing in dashboard
- **Check:** User is logged in
- **Check:** Session belongs to current user
- **Fix:** Check browser console and API responses

---

## Test Results Template

```markdown
## Test Session: [Date/Time]
**Tester:** [Name]
**Browser:** [Chrome/Firefox/Safari] [Version]
**Device:** [Desktop/Mobile]

### Scenario 1: Exam Pause/Resume
- Start exam: ✅/❌
- Pause exam: ✅/❌
- Dashboard display: ✅/❌
- Resume exam: ✅/❌
- Timer continuity: ✅/❌
- Notes: ___________

### Scenario 2: Practice Pause/Resume
- Start practice: ✅/❌
- Pause practice: ✅/❌
- Simultaneous pause: ✅/❌
- Resume practice: ✅/❌
- Notes: ___________

[Continue for all scenarios...]

### Overall Result: PASS/FAIL
### Critical Issues: [List any blockers]
### Minor Issues: [List any non-blocking issues]
```

---

## Contact & Support

For issues or questions about this testing guide:
- Check automated test results: `PAUSE_RESUME_TEST_RESULTS.md`
- Review implementation plan: `.claude/plans/vast-whistling-fountain.md`
- Run automated tests: `npx tsx scripts/test-pause-resume.ts`
