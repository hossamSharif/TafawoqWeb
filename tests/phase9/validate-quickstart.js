#!/usr/bin/env node
/**
 * Quickstart Validation Script (T094)
 * Automated validation of quickstart.md setup steps
 *
 * Usage:
 *   node tests/phase9/validate-quickstart.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function check(condition, testName) {
  if (condition) {
    log(`✅ ${testName}`, 'green');
    return true;
  } else {
    log(`❌ ${testName}`, 'red');
    return false;
  }
}

async function validateQuickstart() {
  log('\n🔍 Starting Quickstart Validation...', 'blue');
  log('=' .repeat(60), 'blue');

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  // Test 1: Package.json exists
  log('\n📦 Step 1: Environment Setup', 'yellow');
  const packageJsonExists = fs.existsSync('package.json');
  results.tests.push({
    name: 'package.json exists',
    passed: check(packageJsonExists, 'package.json exists'),
  });
  if (packageJsonExists) results.passed++;
  else results.failed++;

  // Test 2: Dependencies installed
  const nodeModulesExists = fs.existsSync('node_modules');
  results.tests.push({
    name: 'node_modules exists',
    passed: check(nodeModulesExists, 'node_modules installed'),
  });
  if (nodeModulesExists) results.passed++;
  else results.failed++;

  // Test 3: Required dependencies
  if (packageJsonExists) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const requiredDeps = [
      '@anthropic-ai/sdk',
      'jsxgraph',
      'chart.js',
      'react-chartjs-2',
      'zod',
      '@supabase/supabase-js',
      '@supabase/ssr',
    ];

    requiredDeps.forEach(dep => {
      const hasInDeps = packageJson.dependencies?.[dep];
      const hasInDevDeps = packageJson.devDependencies?.[dep];
      const exists = hasInDeps || hasInDevDeps;

      results.tests.push({
        name: `Dependency: ${dep}`,
        passed: check(exists, `Dependency: ${dep}`),
      });
      if (exists) results.passed++;
      else results.failed++;
    });
  }

  // Test 4: Environment variables
  log('\n🔐 Step 2: Environment Variables', 'yellow');
  const envExampleExists = fs.existsSync('.env.example');
  results.tests.push({
    name: '.env.example exists',
    passed: check(envExampleExists, '.env.example exists'),
  });
  if (envExampleExists) results.passed++;
  else results.failed++;

  const envLocalExists = fs.existsSync('.env.local') || fs.existsSync('.env');
  results.tests.push({
    name: '.env.local or .env exists',
    passed: check(envLocalExists, '.env.local or .env exists'),
  });
  if (envLocalExists) results.passed++;
  else results.failed++;

  // Test 5: Skills modules
  log('\n📚 Step 3: Skills Modules', 'yellow');
  const skillsDirs = [
    'src/skills/qudurat-quant',
    'src/skills/qudurat-verbal',
    'src/skills/qudurat-diagrams',
    'src/skills/qudurat-schema',
    'src/skills/qudurat-quality',
  ];

  skillsDirs.forEach(dir => {
    const exists = fs.existsSync(dir);
    const hasSkillMd = exists && fs.existsSync(path.join(dir, 'SKILL.md'));

    results.tests.push({
      name: `${path.basename(dir)} exists with SKILL.md`,
      passed: check(hasSkillMd, `${path.basename(dir)} exists with SKILL.md`),
    });
    if (hasSkillMd) results.passed++;
    else results.failed++;
  });

  // Test 6: Reference files
  const referenceFiles = [
    'src/skills/qudurat-quant/references/topics.md',
    'src/skills/qudurat-quant/references/examples.md',
    'src/skills/qudurat-verbal/references/topics.md',
    'src/skills/qudurat-verbal/references/analogy-relations.md',
    'src/skills/qudurat-diagrams/references/overlapping-shapes.md',
    'src/skills/qudurat-diagrams/references/simple-shapes.md',
    'src/skills/qudurat-schema/references/full-schema.md',
  ];

  referenceFiles.forEach(file => {
    const exists = fs.existsSync(file);
    const filename = path.basename(file);

    results.tests.push({
      name: `Reference: ${filename}`,
      passed: check(exists, `Reference: ${filename}`),
    });
    if (exists) results.passed++;
    else results.failed++;
  });

  // Test 7: Project structure
  log('\n🏗️  Step 4: Project Structure', 'yellow');
  const requiredDirs = [
    'src/services/generation',
    'src/services/skills',
    'src/services/diagrams',
    'src/services/cache',
    'src/app/admin',
    'src/components/diagrams',
  ];

  requiredDirs.forEach(dir => {
    const exists = fs.existsSync(dir);

    results.tests.push({
      name: `Directory: ${dir}`,
      passed: check(exists, `Directory: ${dir}`),
    });
    if (exists) results.passed++;
    else results.failed++;
  });

  // Test 8: Core service files
  log('\n⚙️  Step 5: Core Services', 'yellow');
  const coreFiles = [
    'src/services/generation/QuduratGenerator.ts',
    'src/services/generation/PromptBuilder.ts',
    'src/services/generation/ResponseParser.ts',
    'src/services/generation/QuestionValidator.ts',
    'src/services/skills/SkillLoader.ts',
    'src/services/skills/SkillValidator.ts',
    'src/services/diagrams/DiagramRenderer.tsx',
    'src/services/diagrams/SVGRenderer.tsx',
    'src/services/diagrams/JSXGraphRenderer.tsx',
    'src/services/diagrams/ChartRenderer.tsx',
  ];

  coreFiles.forEach(file => {
    const exists = fs.existsSync(file);
    const filename = path.basename(file);

    results.tests.push({
      name: `Service: ${filename}`,
      passed: check(exists, `Service: ${filename}`),
    });
    if (exists) results.passed++;
    else results.failed++;
  });

  // Test 9: Documentation files
  log('\n📖 Step 6: Documentation', 'yellow');
  const docFiles = [
    'src/skills/README.md',
    'src/services/diagrams/README.md',
    'specs/1-gat-exam-v3/quickstart.md',
    'specs/1-gat-exam-v3/tasks.md',
    'specs/1-gat-exam-v3/plan.md',
  ];

  docFiles.forEach(file => {
    const exists = fs.existsSync(file);
    const filename = path.basename(file);

    results.tests.push({
      name: `Doc: ${filename}`,
      passed: check(exists, `Doc: ${filename}`),
    });
    if (exists) results.passed++;
    else results.failed++;
  });

  // Test 10: Admin pages
  log('\n👨‍💼 Step 7: Admin Pages', 'yellow');
  const adminPages = [
    'src/app/admin/metrics/page.tsx',
    'src/app/admin/errors/page.tsx',
    'src/app/admin/review-queue/page.tsx',
  ];

  adminPages.forEach(file => {
    const exists = fs.existsSync(file);
    const filename = path.basename(path.dirname(file));

    results.tests.push({
      name: `Admin page: ${filename}`,
      passed: check(exists, `Admin page: ${filename}`),
    });
    if (exists) results.passed++;
    else results.failed++;
  });

  // Test 11: TypeScript configuration
  log('\n⚙️  Step 8: TypeScript Configuration', 'yellow');
  const tsconfigExists = fs.existsSync('tsconfig.json');
  if (tsconfigExists) {
    const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf-8'));
    const targetIsES2018 = tsconfig.compilerOptions?.target === 'ES2018';

    results.tests.push({
      name: 'tsconfig.json exists',
      passed: check(true, 'tsconfig.json exists'),
    });
    results.passed++;

    results.tests.push({
      name: 'TypeScript target is ES2018',
      passed: check(targetIsES2018, 'TypeScript target is ES2018'),
    });
    if (targetIsES2018) results.passed++;
    else results.failed++;
  } else {
    results.tests.push({
      name: 'tsconfig.json exists',
      passed: check(false, 'tsconfig.json exists'),
    });
    results.failed++;
  }

  // Final Report
  log('\n' + '='.repeat(60), 'blue');
  log('📊 Validation Summary', 'blue');
  log('='.repeat(60), 'blue');

  const totalTests = results.passed + results.failed;
  const passRate = ((results.passed / totalTests) * 100).toFixed(1);

  log(`\nTotal Tests: ${totalTests}`);
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed === 0 ? 'green' : 'red');
  log(`Pass Rate: ${passRate}%`, passRate >= 95 ? 'green' : 'yellow');

  if (results.failed === 0) {
    log('\n✅ All quickstart validation checks passed!', 'green');
    log('The environment is correctly set up according to quickstart.md', 'green');
  } else {
    log('\n⚠️  Some checks failed', 'yellow');
    log('Please review the failed items above and fix them', 'yellow');
  }

  // Return exit code
  return results.failed === 0 ? 0 : 1;
}

// Run validation
validateQuickstart()
  .then(exitCode => process.exit(exitCode))
  .catch(err => {
    log(`\n❌ Error during validation: ${err.message}`, 'red');
    console.error(err);
    process.exit(1);
  });
