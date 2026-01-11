# Quickstart Guide: GAT Exam Platform v3.0

**Feature**: 1-gat-exam-v3
**Target Audience**: Developers setting up the GAT Exam Platform v3.0 for the first time
**Estimated Setup Time**: 30 minutes

---

## Prerequisites

Before starting, ensure you have:

- **Node.js**: 18+ installed
- **npm**: 9+ or **pnpm**: 8+ (preferred)
- **Git**: For version control
- **Supabase Account**: Free tier sufficient for development
- **Anthropic API Key**: For Claude API access (get from https://console.anthropic.com)
- **Code Editor**: VS Code recommended (with TypeScript support)

---

## Step 1: Environment Setup

### 1.1 Clone Repository (if not already done)

```bash
git clone https://github.com/your-org/TafawqoqWeb.git
cd TafawqoqWeb
git checkout 1-gat-exam-v3
```

### 1.2 Install Dependencies

```bash
# Install all dependencies including new v3.0 packages
npm install

# Or using pnpm (faster)
pnpm install
```

**New v3.0 Dependencies** (automatically installed):
- `jsxgraph@^1.11.0` - For overlapping shapes diagrams
- `chart.js@^4.4.0` - For statistical charts
- `react-chartjs-2@^5.2.0` - React wrapper for Chart.js
- `@anthropic-ai/sdk@^0.71.2` - Claude API client (upgraded)
- `zod@^3.23.0` - Schema validation

### 1.3 Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Copy example environment file
cp .env.example .env.local
```

Edit `.env.local` and add the following required variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic API Configuration (NEW v3.0)
ANTHROPIC_API_KEY=sk-ant-api03-...your-key...

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Optional: For production deployment
# ENABLE_PROMPT_CACHING=true  # Default: true (for 75% cost reduction)
```

**Security Note**: Never commit `.env.local` to version control. It's already in `.gitignore`.

---

## Step 2: Database Setup

### 2.1 Run Database Migrations

The v3.0 feature requires new database tables and schema extensions.

**Using Supabase CLI** (recommended):

```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref your-project-ref

# Run migrations
npx supabase db push
```

**Using Supabase Dashboard** (alternative):

1. Go to https://app.supabase.com
2. Navigate to your project → SQL Editor
3. Run the following migration files in order:
   - `supabase/migrations/001_extend_questions_table.sql`
   - `supabase/migrations/002_create_question_errors_table.sql`
   - `supabase/migrations/003_create_review_queue_table.sql`
   - `supabase/migrations/004_create_exam_configs_table.sql`

### 2.2 Verify Database Setup

```bash
# Check that new tables exist
npx supabase db diff

# Expected output should show:
# - questions table with new columns (shape_type, pattern_id, diagram_config, etc.)
# - question_errors table
# - review_queue table
# - exam_configs table
```

### 2.3 Seed Sample Data (Optional)

For development and testing:

```bash
# Run seed script to create sample exam config and questions
npm run db:seed

# Or manually via Supabase SQL Editor:
# Run: supabase/seed.sql
```

---

## Step 3: Skills Modules Setup

The v3.0 AI generation system uses Skills modules. These are already included in the `src/skills/` directory, but you should verify they're present.

### 3.1 Verify Skills Files

```bash
# Check that all 5 Skills modules exist
ls -la src/skills/

# Expected structure:
# src/skills/
# ├── qudurat-quant/
# │   ├── SKILL.md
# │   └── references/
# ├── qudurat-verbal/
# │   ├── SKILL.md
# │   └── references/
# ├── qudurat-diagrams/
# │   ├── SKILL.md
# │   └── references/
# ├── qudurat-schema/
# │   ├── SKILL.md
# │   └── references/
# └── qudurat-quality/
#     └── SKILL.md
```

### 3.2 Test Skill Loading

```bash
# Run skill loader test
npm run test -- skills/SkillLoader.test.ts

# Expected: All 5 skills load successfully, total ~15,000 tokens
```

---

## Step 4: Development Server

### 4.1 Start Development Server

```bash
npm run dev

# Or with pnpm
pnpm dev
```

The application will start at: http://localhost:3000

### 4.2 Verify Core Functionality

**Check 1: Homepage loads**
- Navigate to http://localhost:3000
- You should see the main dashboard

**Check 2: Generate test question**
- Navigate to http://localhost:3000/admin/generate (admin panel)
- Click "Generate Sample Question"
- Verify question appears with Arabic text

**Check 3: Test diagram rendering**
- Navigate to http://localhost:3000/practice/quantitative
- Find a geometry question with diagram
- Verify diagram renders (SVG for simple shapes, JSXGraph for overlapping)
- Check browser console for no errors

---

## Step 5: Testing

### 5.1 Run Unit Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- skills
npm test -- diagrams
npm test -- generation
```

### 5.2 Run Integration Tests

```bash
# Run integration tests (requires database connection)
npm run test:integration

# Key tests to verify:
# - Diagram rendering (all 35 types)
# - AI generation with prompt caching
# - Error reporting workflow
# - Review queue functionality
```

### 5.3 Visual Regression Testing

```bash
# Generate baseline screenshots for diagrams
npm run test:visual:baseline

# Run visual regression tests
npm run test:visual

# Review differences (if any)
npm run test:visual:report
```

---

## Step 6: Generate Your First Exam

### 6.1 Architecture Overview

**Important**: Question generation happens **server-side** using Claude API from Anthropic:

```
Admin UI (React Client)
    ↓
Next.js Server Action
    ↓
QuduratGenerator Service
    ↓
Claude API (@anthropic-ai/sdk)
    ↓
Generated Questions → Database
```

**No public REST API** - All generation uses Next.js Server Actions for security.

### 6.2 Using the Admin Interface

1. Navigate to http://localhost:3000/admin/generate
2. Select exam parameters:
   - **Track**: Scientific or Literary
   - **Section**: Quantitative, Verbal, or Both
   - **Total Questions**: 20 (for testing) or 120 (full exam)
   - **Difficulty**: Mixed (30% easy, 50% medium, 20% hard)
3. Click "Generate Exam"
4. Wait for generation (~30 seconds for 20 questions, ~3 minutes for 120)
5. Review generated questions in admin panel

### 6.3 Verify Generation Metrics

After generation, check:
- **Topic Distribution**: Should match FR-001 (quantitative) or FR-002 (verbal)
- **Difficulty Distribution**: Should be ~30% easy, 50% medium, 20% hard
- **Diagram Count**: Should match requested count
- **Cost**: Should show ~75% reduction for batches 2+ (prompt caching)
- **Quality Flags**: Check if any questions were flagged for review

---

## Step 7: Common Tasks

### 7.1 View Review Queue

For questions flagged by quality validation:

1. **Navigate to admin panel**: http://localhost:3000/admin/review-queue
2. **Filter by flag type**: Grammar, Quality, Cultural
3. **Review flagged questions**: Approve or reject with notes
4. **Track queue metrics**: Total pending, average review time

**Server Action Used**: `getReviewQueueAction()` (see `contracts/server-actions.ts`)

### 7.2 Report a Question Error

Students/teachers can report errors via the UI:

1. **Navigate to question**: http://localhost:3000/practice/quantitative
2. **Click "Report Error" button** on any question
3. **Select error type**: Mathematical, Grammatical, Diagram, Other
4. **Provide description**: Explain the error
5. **Submit report**: Enters admin review queue

**Server Action Used**: `reportQuestionErrorAction()` (see `contracts/server-actions.ts`)

### 7.3 Monitor Prompt Cache Performance

Check prompt caching effectiveness:

1. **View generation logs**:
   ```bash
   tail -f logs/generation.log | grep "cache_hit"
   # Expected: First batch cache_hit=false, batches 2+ cache_hit=true
   ```

2. **Admin metrics dashboard**:
   - Navigate to http://localhost:3000/admin/metrics
   - View cache hit rate: Should be ~83% (5 of 6 batches cached)
   - View cost savings: Should show ~75% reduction
   - View total API costs by day/week/month

3. **Database query** (for debugging):
   ```sql
   SELECT
     generation_metadata->>'cacheHit' as cache_hit,
     COUNT(*) as question_count,
     AVG((generation_metadata->>'cost')::numeric) as avg_cost
   FROM questions
   WHERE created_at > NOW() - INTERVAL '1 day'
   GROUP BY cache_hit;
   ```

---

## Troubleshooting

### Issue 1: "ANTHROPIC_API_KEY not found"

**Solution**: Ensure `.env.local` file exists and contains valid API key.

```bash
# Verify environment variable is loaded
npm run env:check

# Or manually check
echo $ANTHROPIC_API_KEY
```

### Issue 2: Diagram Not Rendering

**Symptoms**: Blank space where diagram should appear, console error about library loading.

**Solution**:
1. Check browser console for errors
2. Verify JSXGraph/Chart.js installed: `npm list jsxgraph chart.js`
3. Clear Next.js cache: `rm -rf .next && npm run dev`
4. Check `renderHint` field in diagram config is correct

### Issue 3: Arabic Text Displaying as Boxes

**Solution**: Ensure Arabic font is loaded.

```bash
# Check public/fonts/ directory contains Arabic fonts
ls -la public/fonts/

# Add to app/layout.tsx if missing:
import { Cairo } from 'next/font/google'
const arabic = Cairo({ subsets: ['arabic'] })
```

### Issue 4: Generation Failing with 429 Rate Limit

**Solution**: Claude API rate limits exceeded.

```bash
# Check retry logic is enabled (default: exponential backoff)
# Wait 1-2 minutes and retry

# For persistent issues, contact Anthropic support to increase rate limits
```

### Issue 5: Skills Not Loading

**Symptoms**: Error: "Cannot find module 'src/skills/qudurat-quant/SKILL.md'"

**Solution**:
```bash
# Verify Skills files exist
ls -la src/skills/*/SKILL.md

# If missing, copy from specs/1-gat-exam-v3/skills/ directory
# (These will be created during implementation phase)
```

---

## Performance Benchmarks

After setup, verify performance meets targets:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Diagram rendering | <500ms | Chrome DevTools Performance tab |
| Batch generation (20q) | ~30 seconds | Check generation API response time |
| Full exam (120q) | <3 minutes | Check full exam generation endpoint |
| Cost reduction (batch 2+) | ~75% | Compare `cost` field in generation metadata |
| Topic distribution | Within ±5% | Analyze generated exam question distribution |

---

## Next Steps

After completing quickstart setup:

1. **Explore Skills Modules**: Review `src/skills/*/SKILL.md` to understand AI generation rules
2. **Test Diagram Types**: Generate questions for each of 35 diagram types (8 overlapping + 18 simple + 9 charts)
3. **Review Quality Metrics**: Check review queue for flagged questions
4. **Read Full Documentation**: See `specs/1-gat-exam-v3/` for detailed specifications
5. **Run Tasks**: When ready for implementation, run `/speckit.tasks` to generate task breakdown

---

## Support & Resources

- **Feature Specification**: `specs/1-gat-exam-v3/spec.md`
- **Implementation Plan**: `specs/1-gat-exam-v3/plan.md`
- **Data Model**: `specs/1-gat-exam-v3/data-model.md`
- **API Contracts**: `specs/1-gat-exam-v3/contracts/`
- **Research Notes**: `specs/1-gat-exam-v3/research.md`

- **Claude API Docs**: https://docs.anthropic.com
- **JSXGraph Docs**: https://jsxgraph.org/docs/
- **Chart.js Docs**: https://www.chartjs.org/docs/
- **Supabase Docs**: https://supabase.com/docs

---

## Environment Variables Reference

Complete list of environment variables for GAT Exam Platform v3.0:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-api03-...

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
ENABLE_PROMPT_CACHING=true
MAX_RETRIES=3
RETRY_BACKOFF_BASE=1000

# Feature Flags (Optional)
ENABLE_GRAMMAR_VALIDATION=true
ENABLE_REVIEW_QUEUE=true
ENABLE_ERROR_REPORTING=true

# Development Only
DEBUG_GENERATION=false
SKIP_QUALITY_CHECKS=false
MOCK_CLAUDE_API=false
```

---

**Setup Complete!** 🎉

You're now ready to develop and test GAT Exam Platform v3.0. For implementation tasks, run `/speckit.tasks` to generate the detailed task breakdown.
