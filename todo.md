# PyCode — LeetCode Clone TODO

## Database Schema
- [x] problems table (id, slug, title, difficulty, description, starter_code, created_at)
- [x] test_cases table (id, problem_id, input, expected_output, description, order)
- [x] submissions table (id, user_id, problem_id, code, status, test_results, created_at)

## Backend
- [x] Problem CRUD procedures (list, getBySlug)
- [x] Python code execution via child_process (sandbox execution)
- [x] Unit test runner (run test cases against user code)
- [x] Submit procedure (run all tests + save submission)
- [x] AI analysis endpoint using invokeLLM (correctness, complexity, style)
- [x] Submission history procedure (per user per problem)

## Frontend
- [x] Dark theme CSS (LeetCode-inspired)
- [x] Top navigation bar
- [x] Problem list page with difficulty badges and completion status
- [x] Problem detail page with truly resizable split-panel layout (react-resizable-panels, both horizontal and vertical)
- [x] Monaco editor (Python only, pre-loaded starter code)
- [x] Run Tests panel (per-test-case pass/fail results)
- [x] AI Analysis panel (structured feedback)
- [x] Submission history panel
- [x] Editor panel: tab switcher between "Solution" (editable) and "Unit Tests" (read-only) views
- [x] Terminal output panel below the editor showing raw stdout/stderr from Python execution
- [x] Routing (/, /problems, /problems/:slug)

## Data Seeding
- [x] Seed LeetCode 609 (Find Duplicate File in System) with description, starter code, and unit tests
- [x] Seed LeetCode 636 (Exclusive Time of Functions) with description, starter code, and 5 unit tests
- [x] Seed LeetCode 1242 (Web Crawler Multithreaded) with description, starter code, and 5 unit tests
- [x] Add methodName column to problems table so executor dispatches correct method per problem
- [x] Build HtmlParser simulation in executor for LC1242 test harness

## Testing
- [x] Vitest unit tests for execution engine
- [x] Vitest unit tests for AI analysis router (mocked invokeLLM, structured JSON parsing)
- [x] Vitest unit tests for problems.list and problems.getBySlug

## UI Improvements
- [x] Collapsible bottom panel with Output/Test Results/AI Analysis/History tabs
- [x] Always-visible tab strip with chevron toggle
- [x] Dark code blocks in problem descriptions
- [x] Top strip above left panel: Back button + Instructions/Solution tab switcher

## Solutions
- [x] Add solution and explanation columns to problems table in DB
- [x] Write expert-reviewed solutions with explanations for LC609
- [x] Write expert-reviewed solutions with explanations for LC636
- [x] Write expert-reviewed solutions with explanations for LC1242
- [x] Write expert-reviewed solutions with explanations for LC146
- [x] Write expert-reviewed solutions with explanations for LC588
- [x] Write expert-reviewed solutions with explanations for LC1236
- [x] Write expert-reviewed solutions with explanations for LC1752
- [x] Seed all 7 solutions into the database
- [x] Replace LC146 OrderedDict solution with manual doubly-linked list implementation

## Pending Features
- [x] Add solution variant dropdown for LC146 (OrderedDict vs manual DLL)
- [x] Add Reset to Starter Code button in editor toolbar

## Staged Problem System (NEW)
- [x] Add problem_stages table (problemId, stageNumber, title, description, baseClass, starterCode, solution, solutionExplanation)
- [x] Add stage_test_cases table (stageId, description, inputData, expectedOutput, orderIndex)
- [x] Add tags column to problems table
- [x] Update executor to support staged execution (cumulative tests)
- [x] Update problems router: getBySlug returns stages, runStage/submitStage procedures
- [x] Update frontend ProblemDetail.tsx: stage selector, read-only base class panel, cumulative tests
- [x] Update Problems list to show staged badge on staged problems
- [x] Seed Rate Limiter (3 stages)
- [x] Seed Duplicate File Finder (2 stages)
- [x] Seed Stack Trace Profiler (2 stages — Basic Trace Events + Denoising Filter per spec)
- [x] Seed Greedy Tokenizer (2 stages)
- [x] Seed Count Smaller to the Right (2 stages)
- [x] Seed In-Memory Database (4 stages)
- [x] Seed Bank System (4 stages)
- [x] Seed LRU Cache + Task Manager (3 stages)

## Stage Enhancements (NEW)
- [x] Add stage_submissions table (userId, problemId, stageId, stageNumber, code, status, createdAt)
- [x] Add DB helpers: createStageSubmission, getStageProgress, getHighestUnlockedStage
- [x] Update problems.list to return stageProgress { completed, total } per staged problem
- [x] Add submitStage protected procedure that saves per-stage submission and returns unlock status
- [x] Frontend: show 'Stage X/N complete' in problems list for staged problems
- [x] Frontend: lock stages N+1 in stage selector (greyed out, lock icon) until stage N is passed
- [x] Frontend: block Run/Submit buttons when on a locked stage
- [x] Frontend: show unlock celebration toast when a stage is passed
- [x] Update analyzeCode to accept optional stageNumber + baseClass for stage-aware AI hints
- [x] AI prompt: include current stage base class, suggest next abstract method to implement
- [x] Replace vertical split with file-tab switcher (solution.py / base_class.py / test_level_N.py)
- [x] Replace vertical split with file-tab switcher (solution.py / base_class.py / test_level_N.py)
- [x] Show actual test file content in test_level_N.py tabs (cumulative per stage)
- [x] Ensure testFileContent is stored per stage and returned by getBySlug
- [x] Add generateTestFileContent helper to seed-staged.ts (durable for fresh installs)
- [x] Add backfillTestFileContent post-seed function to populate null rows on startup

## UX Polish (NEW)
- [x] Scrollable file-tab bar with fade indicators for 4-stage problems (no overflow)
- [x] Stage-switch draft-saved tooltip/toast when switching between stages

## Bug Fixes
- [x] Fix NameError in staged executor: exec() used isolated globals dict, hiding user-defined classes
- [x] Fix Monaco font regression: updateOptions() re-applies fontFamily on every tab switch; CSS !important extended to Monaco container elements; ReadOnlyEditor always mounted via display:none
- [x] Verified staged problem runner: RateLimiter NameError resolved (exec uses globals())

## Stage Progression Model (NEW)
- [x] Completed stages are read-only: editor locked, Run/Submit hidden, show accepted solution code
- [x] Block forward navigation in stage selector: locked stages are non-clickable (not just visually greyed)
- [x] Expose accepted code per stage in getStageUnlockStatus response (for seeding Stage N+1)
- [x] Seed Stage N+1 starter code from Stage N accepted solution on first unlock

## Print Support (NEW)
- [x] User print() calls in solution code are redirected to stderr in the test harness
- [x] Result JSON always emitted via _orig_print (stdout) so test pass/fail is never broken
- [x] Router formatStderrForTerminal helper distinguishes user print output from Python tracebacks
- [x] Print output shown in terminal panel with 📤 label; tracebacks shown with error label

## Solution Quality (NEW)
- [x] Add detailed inline comments to all staged problem reference solutions (all 8 problems, all stages)
- [x] Fix solution tab for staged problems: show currentStage.solution instead of problem.solution
- [x] Remove max-h-[500px] cap from solution code block so full solution is visible without inner scroll
- [x] Fix test_level_N.py indentation: split inputData on real newlines not escaped \\n
- [x] Fix generateTestFileContent: emit expectedOutput as Python expression (no JSON.stringify wrapping)

## Company Badge System (NEW)
- [x] Add badges column to problems table (text, nullable, comma-separated)
- [x] Apply migration 0005 for badges column
- [x] Update listProblems to return badges field
- [x] Add CompanyBadges component to Problems.tsx (BADGE_STYLES map: anth=orange, figma=purple)
- [x] Add CompanyBadges component to ProblemDetail.tsx instructions header
- [x] Tag all 8 Anthropic problems with badges="anth" in seed-staged.ts
- [x] Tag all 4 Figma problems with badges="figma" in seed-staged.ts
- [x] Re-seed all 12 staged problems with updated badges field

## Figma Problems (NEW)
- [x] Seed Layer Document System (4 stages, figma badge)
- [x] Seed File System with Permissions (3 stages, figma badge)
- [x] Seed 2D Canvas Ordering (2 stages, figma badge)
- [x] Seed Component Tree Traversal (3 stages, figma badge)
- [x] Verify all 98 reference solution test cases pass (12 problems, all stages)
