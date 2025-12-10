<!--
===============================================================================
SYNC IMPACT REPORT
===============================================================================
Version Change: 1.1.0 → 1.2.0
Modified Principles: N/A
Added Sections:
  - VII. Chrome MCP Manual Testing Mandate (new principle for browser-based testing)
Removed Sections: N/A

Templates Status:
  ✅ .specify/templates/plan-template.md - Validated (Constitution Check present)
  ✅ .specify/templates/spec-template.md - Validated (Requirements align)
  ✅ .specify/templates/tasks-template.md - Validated (Task structure supports constitution)
  ⚠  CLAUDE.md - Constitutional Governance section already references constitution
  ℹ  No command files found in .specify/templates/commands/ - no updates needed

Follow-up TODOs:
  - Ensure Chrome MCP server is properly configured and accessible to all agents
  - Document Chrome MCP tool usage patterns in project onboarding materials
  - Consider adding screenshot archiving for test evidence retention

Version Bump Rationale:
  MINOR (1.1.0 → 1.2.0) - New principle added (Chrome MCP Manual Testing Mandate)
  with materially expanded governance guidance for browser-based testing workflow.
  This adds new requirements without breaking existing principles.

===============================================================================
-->

# Tafawoq Constitution

## Core Principles

### I. MCP Tooling Mandate (Documentation & Reference)

**For any tasks involving reading, searching, or summarizing documentation (project code, SDKs, APIs, frameworks, or libraries), the use of Ref MCP tools is mandatory and strictly enforced:**

- Always use `mcp__Ref__ref_search_documentation` first with target language (TypeScript/react), framework, and library names to locate the most relevant sources (public and private)
- Use `mcp__Ref__ref_read_url` to retrieve full details from specific URLs or results discovered in the search
- Never use arbitrary web search or access private docs outside of MCP mediation

**Rationale**: Centralized documentation access through MCP tools ensures consistency, reduces hallucination, guarantees access to private project resources, and maintains a single source of truth for all technical reference material.

### II. MCP Tooling Mandate (Database & Backend)

**For all database operations—schema listing, migrations, codegen, executions, branching, extensions, logs, and API URL discovery—agents MUST use the suite of Supabase MCP tools exclusively:**

- For DB schema, migrations, and table info, use: `mcp__supabase__list_tables`, `mcp__supabase__apply_migration`, `mcp__supabase__list_migrations`, and other task-appropriate tools only
- For running or generating TypeScript types, always use `mcp__supabase__generate_typescript_types`
- For logs, auth, storage, and advisor access, use only their respective Supabase MCP commands
- For any branching or edge function deployment, use the supplied set of Supabase MCP branch/edge function tools
- All raw SQL and database structure changes MUST use MCP tools

**Rationale**: MCP-mediated database access provides transaction safety, audit trails, migration versioning, and prevents direct database manipulation that could bypass security policies or corrupt schema integrity.

### III. MCP Tooling Mandate (Payments)

**For all payment, subscription, and billing operations (including Stripe setup, invoice retrieval, and customer management), agents MUST always use the Stripe MCP suite:**

- Use Stripe MCP tools for all customer creation, subscription management, invoice generation, payment processing, and refund operations
- Consult the project-attached tool manifest and Supabase MCP for payment integrations wherever applicable
- Never implement custom payment processing logic that bypasses MCP tools

**Rationale**: Payment operations require strict compliance with PCI-DSS standards, secure token handling, and audit logging. MCP tools ensure all payment operations are compliant, traceable, and secure without exposing sensitive financial data.

### IV. Security & Configuration

**Security-sensitive data and configuration MUST be handled according to strict standards:**

- Never hard-code keys, secrets, or sensitive environment values anywhere in the codebase
- Require or document all such values as environment variables with clear naming conventions
- Ensure setup scripts or manifests clearly indicate what environment variables are required, their purpose, and validation rules
- All authentication tokens (JWT, API keys) MUST be stored using platform-specific secure storage ( encrypted environment variables for backend)
- Logging systems MUST exclude sensitive personal information: passwords, raw tokens, full payment card numbers, and email content

**Rationale**: Security vulnerabilities and data breaches have catastrophic consequences. Explicit security requirements prevent accidental exposure, ensure compliance with privacy regulations, and maintain user trust.

### V. Technology Stack Alignment

**All implementation decisions MUST align with the approved technology stack and architectural decisions:**

- Primary development: JavaScript/TypeScript with React Native (Expo SDK 51+)
- Backend tooling: Node.js 18+ for scripts and utilities
- Project structure: `src/` for source code, `tests/` for test suites
- Code style: Follow standard JavaScript/TypeScript conventions for React Native projects
- Quality gates: `npm test` for testing, `npm run lint` for code quality validation

**Rationale**: Consistent technology choices reduce cognitive overhead, simplify onboarding, ensure dependency compatibility, and prevent architectural drift that fragments the codebase.

### VI. Git Commit Discipline

**All implementation agents MUST commit all code and asset changes to the active git branch immediately after successfully completing each `/speckit.implement` command:**

- Every commit MUST include a clear, descriptive commit message summarizing the implemented feature or change
- No code, configuration, or asset changes should remain uncommitted after a completed implementation task
- Work MUST be organized in project feature branches according to the plan/task structure
- If a commit cannot be made (e.g., due to merge conflicts or lack of git context), the agent MUST halt and raise an exception for human attention

**Rationale**: Immediate commits after task completion ensure version control hygiene, enable atomic rollbacks, provide clear audit trails, and prevent loss of work. Feature branch organization maintains clean history and enables parallel development. Halting on commit failures prevents silent failures that could lead to lost work or inconsistent repository state.

### VII. Chrome MCP Manual Testing Mandate

**For all manual testing, UI validation, and browser-based verification tasks, agents MUST use the Chrome MCP tool suite exclusively:**

- **`chrome_navigate`**: MUST be used to navigate to any URL for testing purposes
- **`chrome_screenshot`**: MUST be used to capture visual evidence of test states and results
- **`chrome_click`**: MUST be used to interact with clickable elements during test execution
- **`chrome_fill`**: MUST be used to populate form fields and input elements
- **`chrome_evaluate`**: MUST be used to execute JavaScript for DOM inspection or dynamic validation
- **`chrome_get_content`**: MUST be used to retrieve page content (HTML or text) for verification
- **`chrome_scroll`**: MUST be used to scroll pages for testing below-the-fold content
- **`chrome_select`**: MUST be used to interact with dropdown menus and select elements
- **`chrome_hover`**: MUST be used to trigger hover states for UI validation

**Mandatory Testing Workflow**:
1. Navigate to the target URL using `chrome_navigate`
2. Take a screenshot using `chrome_screenshot` to document initial state
3. Perform test actions using appropriate tools (`chrome_click`, `chrome_fill`, `chrome_select`, etc.)
4. Capture screenshots at key checkpoints to document test progression
5. Use `chrome_get_content` to verify expected content is present
6. Take a final screenshot to document the test result

**Rationale**: Chrome MCP tools provide reproducible, auditable browser interactions that can be reviewed and replayed. Direct browser manipulation ensures tests reflect actual user experience, captures visual evidence for debugging, and maintains consistency across test runs. This eliminates reliance on assumptions about UI behavior and provides concrete proof of functionality.

## Enforcement & Compliance

**Constitutional Supremacy**: This constitution supersedes all other development practices, coding guidelines, and architectural decisions. Any deviation requires explicit approval and amendment to this document.

**MCP Tool Primacy**: If an operation cannot be fulfilled using the prescribed MCP tools, agents MUST halt and request an update to the MCP tool suite or project instructions rather than implementing workarounds.

**Review & Validation**: All pull requests, code reviews, and feature implementations MUST verify compliance with these principles. Non-compliant code MUST be rejected with clear citation of the violated principle.

**Agent Alignment**: All project agents (human developers, AI assistants, automated systems) accessing project files MUST reference this constitution and ensure their work adheres to these foundational conventions.

**Reference Documentation**: Always refer to the full attached MCP tool manifest (project files: see latest stitch and README) to ensure agents select the precise tool for every operation.

## Governance

**Amendment Procedure**: Amendments to this constitution require:
1. Documented justification explaining the change rationale
2. Impact analysis on existing codebase and development workflows
3. Project owner approval
4. Migration plan for any breaking changes
5. Version increment following semantic versioning rules
6. Propagation of changes to all dependent templates and documentation

**Versioning Policy**:
- **MAJOR**: Backward incompatible governance/principle removals or redefinitions
- **MINOR**: New principle/section added or materially expanded guidance
- **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements

**Compliance Review**: Regular constitution compliance reviews MUST be conducted quarterly to ensure adherence, identify violations, and refine principles based on practical implementation experience.

---

**Version**: 1.2.0 | **Ratified**: 2025-12-03 | **Last Amended**: 2025-12-11
