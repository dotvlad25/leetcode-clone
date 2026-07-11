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
- [x] Routing (/, /problems, /problems/:slug)

## Data Seeding
- [x] Seed LeetCode 609 (Find Duplicate File in System) with description, starter code, and unit tests

## Testing
- [x] Vitest unit tests for execution engine
- [x] Vitest unit tests for AI analysis router (mocked invokeLLM, structured JSON parsing)
- [x] Vitest unit tests for problems.list and problems.getBySlug
