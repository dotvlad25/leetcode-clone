import { seedStagedProblemIfNotExists } from "./db";
// ─────────────────────────────────────────────────────────────────────────────
// Batch 8: 5 New Figma staged problems (from prachub scrape)
// Figma: 20010 – Async Job Scheduler
//        20011 – Validate IPv4 Address
//        20012 – Document Layer with Undo/Redo
//        20013 – Trending Files Service
//        20014 – Real-Time Collaborative Comments
// ─────────────────────────────────────────────────────────────────────────────

export async function seedBatch8Problems(): Promise<void> {

  // ── Problem 1: Async Job Scheduler ─────────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 20010,
      slug: "async-job-scheduler",
      title: "Async Job Scheduler",
      difficulty: "Medium",
      badges: "figma",
      tags: "design,queue,heap",
      frequency: 199,
      description: `Design an **asynchronous job scheduler** that supports two job types:

1. **Immediate jobs:** run as soon as possible (FIFO order).
2. **Priority jobs:** run before immediate jobs, ordered by priority (higher = sooner).

- **Stage 1:** Basic FIFO job queue — submit jobs and run them one at a time.
- **Stage 2:** Priority queue — higher-priority jobs run first; same priority uses FIFO order.`,
      starterCode: `from collections import deque

class JobScheduler:
    def submit(self, job_id: str, fn) -> None:
        pass

    def run_next(self) -> str | None:
        pass

    def get_result(self, job_id: str):
        pass`,
      methodName: "JobScheduler",
    },
    [
      {
        stageNumber: 1,
        title: "FIFO Job Queue",
        description: `Implement \`JobScheduler\` with:
- \`submit(job_id, fn)\` — enqueue a job.
- \`run_next()\` — execute the next job, store its return value, return \`job_id\`. Return \`None\` if empty.
- \`get_result(job_id)\` — return the stored result for a completed job.

\`\`\`python
s = JobScheduler()
s.submit("j1", lambda: 42)
s.submit("j2", lambda: "hello")
s.run_next()          # → "j1"
s.get_result("j1")    # → 42
s.run_next()          # → "j2"
s.run_next()          # → None
\`\`\``,
        baseClass: `from collections import deque

class JobScheduler:
    def submit(self, job_id: str, fn) -> None:
        pass

    def run_next(self) -> str | None:
        pass

    def get_result(self, job_id: str):
        pass`,
        starterCode: `from collections import deque

class JobScheduler:
    def __init__(self):
        self.queue = deque()
        self.results = {}

    def submit(self, job_id: str, fn) -> None:
        self.queue.append((job_id, fn))

    def run_next(self) -> str | None:
        if not self.queue:
            return None
        job_id, fn = self.queue.popleft()
        # Execute fn(), store result, return job_id
        pass

    def get_result(self, job_id: str):
        return self.results.get(job_id)`,
        solution: `from collections import deque

class JobScheduler:
    def __init__(self):
        self.queue = deque()
        self.results = {}

    def submit(self, job_id: str, fn) -> None:
        self.queue.append((job_id, fn))

    def run_next(self) -> str | None:
        if not self.queue:
            return None
        job_id, fn = self.queue.popleft()
        self.results[job_id] = fn()
        return job_id

    def get_result(self, job_id: str):
        return self.results.get(job_id)`,
        solutionExplanation: `A \`deque\` gives O(1) append and popleft — perfect for a FIFO queue. Results are stored in a dict keyed by job_id for O(1) retrieval.

This is the foundation of task queues used in systems like Celery, BullMQ, and Sidekiq.`,
        testCases: [
          { description: "run j1 first", inputData: "from collections import deque\ns = JobScheduler()\ns.submit(\"j1\", lambda: 42)\ns.submit(\"j2\", lambda: \"hello\")\nresult = s.run_next()", expectedOutput: "'j1'", orderIndex: 0 },
          { description: "result j1", inputData: "from collections import deque\ns = JobScheduler()\ns.submit(\"j1\", lambda: 42)\ns.run_next()\nresult = s.get_result(\"j1\")", expectedOutput: "42", orderIndex: 1 },
          { description: "empty queue", inputData: "from collections import deque\ns = JobScheduler()\nresult = s.run_next()", expectedOutput: "None", orderIndex: 2 },
          { description: "fifo order", inputData: "from collections import deque\ns = JobScheduler()\ns.submit(\"a\", lambda: 1); s.submit(\"b\", lambda: 2)\ns.run_next(); s.run_next()\nresult = (s.get_result(\"a\"), s.get_result(\"b\"))", expectedOutput: "(1, 2)", orderIndex: 3 },
        ],
      },
      {
        stageNumber: 2,
        title: "Priority Queue",
        description: `Upgrade to \`PriorityJobScheduler\` — jobs with higher \`priority\` run first. Jobs with equal priority run in FIFO order.

\`\`\`python
s = PriorityJobScheduler()
s.submit("low",  lambda: "low",  priority=1)
s.submit("high", lambda: "high", priority=10)
s.submit("mid",  lambda: "mid",  priority=5)
s.run_next()   # → "high"
s.run_next()   # → "mid"
s.run_next()   # → "low"
\`\`\``,
        baseClass: `from collections import deque

class JobScheduler:
    def __init__(self):
        self.queue = deque()
        self.results = {}

    def submit(self, job_id: str, fn) -> None:
        self.queue.append((job_id, fn))

    def run_next(self) -> str | None:
        if not self.queue:
            return None
        job_id, fn = self.queue.popleft()
        self.results[job_id] = fn()
        return job_id

    def get_result(self, job_id: str):
        return self.results.get(job_id)`,
        starterCode: `import heapq
from collections import deque

class JobScheduler:
    def __init__(self):
        self.queue = deque()
        self.results = {}

    def submit(self, job_id: str, fn) -> None:
        self.queue.append((job_id, fn))

    def run_next(self) -> str | None:
        if not self.queue:
            return None
        job_id, fn = self.queue.popleft()
        self.results[job_id] = fn()
        return job_id

    def get_result(self, job_id: str):
        return self.results.get(job_id)

class PriorityJobScheduler(JobScheduler):
    def __init__(self):
        super().__init__()
        self._heap = []
        self._counter = 0  # tiebreak for FIFO among equal-priority jobs

    def submit(self, job_id: str, fn, priority: int = 0) -> None:
        # Push to heap with (-priority, counter, job_id, fn)
        pass

    def run_next(self) -> str | None:
        pass`,
        solution: `import heapq
from collections import deque

class JobScheduler:
    def __init__(self):
        self.queue = deque()
        self.results = {}

    def submit(self, job_id: str, fn) -> None:
        self.queue.append((job_id, fn))

    def run_next(self) -> str | None:
        if not self.queue:
            return None
        job_id, fn = self.queue.popleft()
        self.results[job_id] = fn()
        return job_id

    def get_result(self, job_id: str):
        return self.results.get(job_id)

class PriorityJobScheduler(JobScheduler):
    def __init__(self):
        super().__init__()
        self._heap = []
        self._counter = 0

    def submit(self, job_id: str, fn, priority: int = 0) -> None:
        # Negate priority so higher priority = smaller heap key
        heapq.heappush(self._heap, (-priority, self._counter, job_id, fn))
        self._counter += 1

    def run_next(self) -> str | None:
        if not self._heap:
            return None
        _, _, job_id, fn = heapq.heappop(self._heap)
        self.results[job_id] = fn()
        return job_id`,
        solutionExplanation: `Python's \`heapq\` is a min-heap, so we negate the priority to simulate a max-heap. The \`counter\` field breaks ties in FIFO order — earlier submissions have smaller counters and thus sort first among equal-priority jobs.

The tuple \`(-priority, counter, job_id, fn)\` ensures correct ordering without needing a custom comparator.`,
        testCases: [
          { description: "high priority first", inputData: "import heapq\nfrom collections import deque\ns = PriorityJobScheduler()\ns.submit(\"low\", lambda: \"low\", priority=1)\ns.submit(\"high\", lambda: \"high\", priority=10)\nresult = s.run_next()", expectedOutput: "'high'", orderIndex: 0 },
          { description: "fifo same priority", inputData: "import heapq\nfrom collections import deque\ns = PriorityJobScheduler()\ns.submit(\"a\", lambda: 1, priority=5)\ns.submit(\"b\", lambda: 2, priority=5)\nresult = s.run_next()", expectedOutput: "'a'", orderIndex: 1 },
          { description: "all three", inputData: "import heapq\nfrom collections import deque\ns = PriorityJobScheduler()\ns.submit(\"low\", lambda: 1, priority=1)\ns.submit(\"high\", lambda: 2, priority=10)\ns.submit(\"mid\", lambda: 3, priority=5)\norder = [s.run_next(), s.run_next(), s.run_next()]\nresult = order", expectedOutput: "['high', 'mid', 'low']", orderIndex: 2 },
          { description: "empty", inputData: "import heapq\nfrom collections import deque\ns = PriorityJobScheduler()\nresult = s.run_next()", expectedOutput: "None", orderIndex: 3 },
        ],
      },
    ]
  );

  // ── Problem 2: Validate IPv4 Address ───────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 20011,
      slug: "validate-ipv4-address",
      title: "Validate IPv4 Address",
      difficulty: "Easy",
      badges: "figma",
      tags: "string,parsing",
      frequency: 168,
      description: `Implement a validator for IPv4 addresses and CIDR notation.

- **Stage 1:** Validate a basic IPv4 address (4 octets, 0-255, no leading zeros).
- **Stage 2:** Validate CIDR notation (e.g. \`192.168.1.0/24\`).`,
      starterCode: `class IPv4Validator:
    def validate(self, s: str) -> bool:
        pass`,
      methodName: "IPv4Validator",
    },
    [
      {
        stageNumber: 1,
        title: "Basic IPv4 Validation",
        description: `Implement \`validate(s)\` returning \`True\` if \`s\` is a valid IPv4 address:
- Exactly 4 parts separated by dots.
- Each part is a decimal integer in [0, 255].
- No leading zeros (\`"01"\` is invalid; \`"0"\` is valid).

\`\`\`python
v = IPv4Validator()
v.validate("192.168.1.1")   # → True
v.validate("01.02.03.04")   # → False  (leading zeros)
v.validate("256.0.0.1")     # → False  (out of range)
v.validate("1.2.3")         # → False  (too few parts)
\`\`\``,
        baseClass: `class IPv4Validator:
    def validate(self, s: str) -> bool:
        pass`,
        starterCode: `class IPv4Validator:
    def validate(self, s: str) -> bool:
        parts = s.split('.')
        if len(parts) != 4:
            return False
        for p in parts:
            # Check: non-empty, no leading zeros, digits only, 0-255
            pass
        return True`,
        solution: `class IPv4Validator:
    def validate(self, s: str) -> bool:
        parts = s.split('.')
        if len(parts) != 4:
            return False
        for p in parts:
            if not p:
                return False
            if len(p) > 1 and p[0] == '0':
                return False   # leading zero
            if not p.isdigit():
                return False
            if not (0 <= int(p) <= 255):
                return False
        return True`,
        solutionExplanation: `Split on \`'.'\` and validate each octet:
1. Non-empty string.
2. No leading zeros (multi-digit strings starting with \`'0'\` are invalid).
3. All digits (\`isdigit()\` rejects signs and spaces).
4. Value in [0, 255].

**Time:** O(1) — IPv4 addresses have a fixed maximum length of 15 characters.`,
        testCases: [
          { description: "valid", inputData: "v = IPv4Validator()\nresult = v.validate(\"192.168.1.1\")", expectedOutput: "True", orderIndex: 0 },
          { description: "leading zero", inputData: "v = IPv4Validator()\nresult = v.validate(\"01.02.03.04\")", expectedOutput: "False", orderIndex: 1 },
          { description: "out of range", inputData: "v = IPv4Validator()\nresult = v.validate(\"256.0.0.1\")", expectedOutput: "False", orderIndex: 2 },
          { description: "too few parts", inputData: "v = IPv4Validator()\nresult = v.validate(\"1.2.3\")", expectedOutput: "False", orderIndex: 3 },
          { description: "all zeros", inputData: "v = IPv4Validator()\nresult = v.validate(\"0.0.0.0\")", expectedOutput: "True", orderIndex: 4 },
          { description: "max valid", inputData: "v = IPv4Validator()\nresult = v.validate(\"255.255.255.255\")", expectedOutput: "True", orderIndex: 5 },
        ],
      },
      {
        stageNumber: 2,
        title: "CIDR Notation Validation",
        description: `Add \`validate_cidr(s)\` that validates CIDR notation: \`<valid_ipv4>/<prefix>\` where prefix is an integer in [0, 32].

\`\`\`python
v = IPv4Validator()
v.validate_cidr("192.168.1.0/24")  # → True
v.validate_cidr("192.168.1.0/33")  # → False  (prefix > 32)
v.validate_cidr("192.168.1.0")     # → False  (no slash)
v.validate_cidr("0.0.0.0/0")       # → True
\`\`\``,
        baseClass: `class IPv4Validator:
    def validate(self, s: str) -> bool:
        parts = s.split('.')
        if len(parts) != 4:
            return False
        for p in parts:
            if not p:
                return False
            if len(p) > 1 and p[0] == '0':
                return False
            if not p.isdigit():
                return False
            if not (0 <= int(p) <= 255):
                return False
        return True`,
        starterCode: `class IPv4Validator:
    def validate(self, s: str) -> bool:
        parts = s.split('.')
        if len(parts) != 4:
            return False
        for p in parts:
            if not p:
                return False
            if len(p) > 1 and p[0] == '0':
                return False
            if not p.isdigit():
                return False
            if not (0 <= int(p) <= 255):
                return False
        return True

    def validate_cidr(self, s: str) -> bool:
        # Split on '/', validate IP and prefix separately
        pass`,
        solution: `class IPv4Validator:
    def validate(self, s: str) -> bool:
        parts = s.split('.')
        if len(parts) != 4:
            return False
        for p in parts:
            if not p:
                return False
            if len(p) > 1 and p[0] == '0':
                return False
            if not p.isdigit():
                return False
            if not (0 <= int(p) <= 255):
                return False
        return True

    def validate_cidr(self, s: str) -> bool:
        if '/' not in s:
            return False
        ip, prefix = s.rsplit('/', 1)
        if not prefix.isdigit():
            return False
        if not (0 <= int(prefix) <= 32):
            return False
        return self.validate(ip)`,
        solutionExplanation: `Split on \`'/'\` using \`rsplit\` (handles edge cases like multiple slashes). Validate the prefix is a digit string in [0, 32], then reuse \`validate()\` for the IP part.

CIDR notation is used in networking to specify IP ranges (e.g., \`192.168.0.0/16\` = all IPs from 192.168.0.0 to 192.168.255.255).`,
        testCases: [
          { description: "valid cidr", inputData: "v = IPv4Validator()\nresult = v.validate_cidr(\"192.168.1.0/24\")", expectedOutput: "True", orderIndex: 0 },
          { description: "prefix too large", inputData: "v = IPv4Validator()\nresult = v.validate_cidr(\"192.168.1.0/33\")", expectedOutput: "False", orderIndex: 1 },
          { description: "no slash", inputData: "v = IPv4Validator()\nresult = v.validate_cidr(\"192.168.1.0\")", expectedOutput: "False", orderIndex: 2 },
          { description: "zero prefix", inputData: "v = IPv4Validator()\nresult = v.validate_cidr(\"0.0.0.0/0\")", expectedOutput: "True", orderIndex: 3 },
          { description: "bad ip", inputData: "v = IPv4Validator()\nresult = v.validate_cidr(\"256.0.0.0/8\")", expectedOutput: "False", orderIndex: 4 },
        ],
      },
    ]
  );

  // ── Problem 3: Document Layer with Undo/Redo ────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 20012,
      slug: "document-layer-undo-redo",
      title: "Document Layer with Undo/Redo",
      difficulty: "Medium",
      badges: "figma",
      tags: "design,stack,string",
      frequency: 302,
      description: `Design a document layer that supports character-level edits with full undo/redo support — similar to Figma's text editing layer.

- **Stage 1:** Implement \`apply(op)\` and \`undo()\`.
- **Stage 2:** Add \`redo()\` support.`,
      starterCode: `class DocumentLayer:
    def __init__(self, text: str = ""):
        pass

    def apply(self, op: dict) -> None:
        pass

    def undo(self) -> bool:
        pass

    def get_text(self) -> str:
        pass`,
      methodName: "DocumentLayer",
    },
    [
      {
        stageNumber: 1,
        title: "Apply and Undo",
        description: `Implement \`DocumentLayer\` with:
- \`apply(op)\` — apply an operation. \`op\` is a dict with \`type\` (\`"insert"\` or \`"delete"\`), \`pos\` (index), and \`char\` (for insert).
- \`undo()\` — revert the last operation. Return \`True\` if successful, \`False\` if nothing to undo.
- \`get_text()\` — return current document text.

\`\`\`python
doc = DocumentLayer("hello")
doc.apply({"type": "insert", "pos": 5, "char": "!"})
doc.get_text()   # → "hello!"
doc.apply({"type": "delete", "pos": 0})
doc.get_text()   # → "ello!"
doc.undo()       # → True
doc.get_text()   # → "hello!"
\`\`\``,
        baseClass: `class DocumentLayer:
    def __init__(self, text: str = ""):
        pass

    def apply(self, op: dict) -> None:
        pass

    def undo(self) -> bool:
        pass

    def get_text(self) -> str:
        pass`,
        starterCode: `class DocumentLayer:
    def __init__(self, text: str = ""):
        self.text = text
        self._history = []   # stack of previous text states

    def apply(self, op: dict) -> None:
        self._history.append(self.text)
        if op['type'] == 'insert':
            pos = op['pos']
            self.text = self.text[:pos] + op['char'] + self.text[pos:]
        elif op['type'] == 'delete':
            pass  # remove character at op['pos']

    def undo(self) -> bool:
        if not self._history:
            return False
        self.text = self._history.pop()
        return True

    def get_text(self) -> str:
        return self.text`,
        solution: `class DocumentLayer:
    def __init__(self, text: str = ""):
        self.text = text
        self._history = []

    def apply(self, op: dict) -> None:
        self._history.append(self.text)
        if op['type'] == 'insert':
            pos = op['pos']
            self.text = self.text[:pos] + op['char'] + self.text[pos:]
        elif op['type'] == 'delete':
            pos = op['pos']
            self.text = self.text[:pos] + self.text[pos+1:]

    def undo(self) -> bool:
        if not self._history:
            return False
        self.text = self._history.pop()
        return True

    def get_text(self) -> str:
        return self.text`,
        solutionExplanation: `We use a **command history stack** — before each \`apply\`, we push the current text onto the stack. \`undo\` pops the last state and restores it.

This is the simplest correct approach. A more memory-efficient version would store the inverse operation (e.g., "delete at pos 5" instead of the full text), but storing full snapshots is clearer and sufficient for interview purposes.`,
        testCases: [
          { description: "insert", inputData: "doc = DocumentLayer(\"hello\")\ndoc.apply({\"type\": \"insert\", \"pos\": 5, \"char\": \"!\"})\nresult = doc.get_text()", expectedOutput: "'hello!'", orderIndex: 0 },
          { description: "delete", inputData: "doc = DocumentLayer(\"hello\")\ndoc.apply({\"type\": \"delete\", \"pos\": 0})\nresult = doc.get_text()", expectedOutput: "'ello'", orderIndex: 1 },
          { description: "undo insert", inputData: "doc = DocumentLayer(\"hello\")\ndoc.apply({\"type\": \"insert\", \"pos\": 5, \"char\": \"!\"})\ndoc.undo()\nresult = doc.get_text()", expectedOutput: "'hello'", orderIndex: 2 },
          { description: "undo empty", inputData: "doc = DocumentLayer(\"hello\")\nresult = doc.undo()", expectedOutput: "False", orderIndex: 3 },
          { description: "multiple ops", inputData: "doc = DocumentLayer(\"hi\")\ndoc.apply({\"type\": \"insert\", \"pos\": 2, \"char\": \"!\"})\ndoc.apply({\"type\": \"insert\", \"pos\": 3, \"char\": \"?\"})\ndoc.undo()\nresult = doc.get_text()", expectedOutput: "'hi!'", orderIndex: 4 },
        ],
      },
      {
        stageNumber: 2,
        title: "Add Redo Support",
        description: `Add \`redo()\` — reapply the most recently undone operation. Applying a new operation clears the redo stack.

\`\`\`python
doc = DocumentLayer("hello")
doc.apply({"type": "insert", "pos": 5, "char": "!"})
doc.undo()
doc.get_text()   # → "hello"
doc.redo()       # → True
doc.get_text()   # → "hello!"
doc.redo()       # → False  (nothing to redo)
\`\`\``,
        baseClass: `class DocumentLayer:
    def __init__(self, text: str = ""):
        self.text = text
        self._history = []

    def apply(self, op: dict) -> None:
        self._history.append(self.text)
        if op['type'] == 'insert':
            pos = op['pos']
            self.text = self.text[:pos] + op['char'] + self.text[pos:]
        elif op['type'] == 'delete':
            pos = op['pos']
            self.text = self.text[:pos] + self.text[pos+1:]

    def undo(self) -> bool:
        if not self._history:
            return False
        self.text = self._history.pop()
        return True

    def get_text(self) -> str:
        return self.text`,
        starterCode: `class DocumentLayer:
    def __init__(self, text: str = ""):
        self.text = text
        self._history = []
        self._redo_stack = []   # add redo stack

    def apply(self, op: dict) -> None:
        self._history.append(self.text)
        self._redo_stack.clear()   # new op clears redo history
        if op['type'] == 'insert':
            pos = op['pos']
            self.text = self.text[:pos] + op['char'] + self.text[pos:]
        elif op['type'] == 'delete':
            pos = op['pos']
            self.text = self.text[:pos] + self.text[pos+1:]

    def undo(self) -> bool:
        if not self._history:
            return False
        self._redo_stack.append(self.text)
        self.text = self._history.pop()
        return True

    def redo(self) -> bool:
        # Pop from redo stack, push to history, restore text
        pass

    def get_text(self) -> str:
        return self.text`,
        solution: `class DocumentLayer:
    def __init__(self, text: str = ""):
        self.text = text
        self._history = []
        self._redo_stack = []

    def apply(self, op: dict) -> None:
        self._history.append(self.text)
        self._redo_stack.clear()
        if op['type'] == 'insert':
            pos = op['pos']
            self.text = self.text[:pos] + op['char'] + self.text[pos:]
        elif op['type'] == 'delete':
            pos = op['pos']
            self.text = self.text[:pos] + self.text[pos+1:]

    def undo(self) -> bool:
        if not self._history:
            return False
        self._redo_stack.append(self.text)
        self.text = self._history.pop()
        return True

    def redo(self) -> bool:
        if not self._redo_stack:
            return False
        self._history.append(self.text)
        self.text = self._redo_stack.pop()
        return True

    def get_text(self) -> str:
        return self.text`,
        solutionExplanation: `Undo/Redo uses **two stacks** (history and redo). On \`undo\`, we move the current state to the redo stack and restore the previous state. On \`redo\`, we do the reverse. On \`apply\`, we clear the redo stack — this matches the behavior of every text editor (Ctrl+Z / Ctrl+Y).

This is the **Memento design pattern** — storing snapshots of state to enable time-travel.`,
        testCases: [
          { description: "redo after undo", inputData: "doc = DocumentLayer(\"hello\")\ndoc.apply({\"type\": \"insert\", \"pos\": 5, \"char\": \"!\"})\ndoc.undo()\ndoc.redo()\nresult = doc.get_text()", expectedOutput: "'hello!'", orderIndex: 0 },
          { description: "redo empty", inputData: "doc = DocumentLayer(\"hello\")\nresult = doc.redo()", expectedOutput: "False", orderIndex: 1 },
          { description: "apply clears redo", inputData: "doc = DocumentLayer(\"hello\")\ndoc.apply({\"type\": \"insert\", \"pos\": 5, \"char\": \"!\"})\ndoc.undo()\ndoc.apply({\"type\": \"insert\", \"pos\": 5, \"char\": \"?\"})\nresult = doc.redo()", expectedOutput: "False", orderIndex: 2 },
          { description: "undo undo redo", inputData: "doc = DocumentLayer(\"hi\")\ndoc.apply({\"type\": \"insert\", \"pos\": 2, \"char\": \"!\"})\ndoc.apply({\"type\": \"insert\", \"pos\": 3, \"char\": \"?\"})\ndoc.undo(); doc.undo(); doc.redo()\nresult = doc.get_text()", expectedOutput: "'hi!'", orderIndex: 3 },
        ],
      },
    ]
  );

  // ── Problem 4: Trending Files Service ──────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 20013,
      slug: "trending-files-service",
      title: "Trending Files Service",
      difficulty: "Medium",
      badges: "figma",
      tags: "design,hash-map,sliding-window",
      frequency: 19,
      description: `Design a service that tracks file views and returns the **top-k trending files**.

- **Stage 1:** Global top-k by total view count.
- **Stage 2:** Sliding window — only count views from the last N seconds.`,
      starterCode: `from collections import Counter

class TrendingFiles:
    def record_view(self, file_id: str) -> None:
        pass

    def top_k(self, k: int) -> list[str]:
        pass`,
      methodName: "TrendingFiles",
    },
    [
      {
        stageNumber: 1,
        title: "Global Top-K",
        description: `Implement \`TrendingFiles\` with:
- \`record_view(file_id)\` — record a view for a file.
- \`top_k(k)\` — return the \`k\` most-viewed file IDs (descending by count).

\`\`\`python
tf = TrendingFiles()
for fid in ["a","b","a","c","a","b"]:
    tf.record_view(fid)
tf.top_k(1)   # → ["a"]
tf.top_k(2)   # → ["a", "b"]
\`\`\``,
        baseClass: `from collections import Counter

class TrendingFiles:
    def record_view(self, file_id: str) -> None:
        pass

    def top_k(self, k: int) -> list[str]:
        pass`,
        starterCode: `from collections import Counter

class TrendingFiles:
    def __init__(self):
        self.views = Counter()

    def record_view(self, file_id: str) -> None:
        self.views[file_id] += 1

    def top_k(self, k: int) -> list[str]:
        # Return k most common file IDs
        pass`,
        solution: `from collections import Counter

class TrendingFiles:
    def __init__(self):
        self.views = Counter()

    def record_view(self, file_id: str) -> None:
        self.views[file_id] += 1

    def top_k(self, k: int) -> list[str]:
        return [fid for fid, _ in self.views.most_common(k)]`,
        solutionExplanation: `\`Counter.most_common(k)\` returns the k most frequent elements in O(n log k) time using a heap internally. This is the simplest correct implementation.

For very high-throughput systems, you'd use a **Count-Min Sketch** for approximate counts with O(1) updates, or a **sorted set** (like Redis ZSET) for real-time leaderboards.`,
        testCases: [
          { description: "top 1", inputData: "from collections import Counter\ntf = TrendingFiles()\nfor fid in [\"a\",\"b\",\"a\",\"c\",\"a\",\"b\"]: tf.record_view(fid)\nresult = tf.top_k(1)", expectedOutput: "['a']", orderIndex: 0 },
          { description: "top 2", inputData: "from collections import Counter\ntf = TrendingFiles()\nfor fid in [\"a\",\"b\",\"a\",\"c\",\"a\",\"b\"]: tf.record_view(fid)\nresult = tf.top_k(2)", expectedOutput: "['a', 'b']", orderIndex: 1 },
          { description: "top 3", inputData: "from collections import Counter\ntf = TrendingFiles()\nfor fid in [\"a\",\"b\",\"a\",\"c\",\"a\",\"b\"]: tf.record_view(fid)\nresult = tf.top_k(3)", expectedOutput: "['a', 'b', 'c']", orderIndex: 2 },
          { description: "empty", inputData: "from collections import Counter\ntf = TrendingFiles()\nresult = tf.top_k(3)", expectedOutput: "[]", orderIndex: 3 },
        ],
      },
      {
        stageNumber: 2,
        title: "Sliding Window Trending",
        description: `Upgrade to \`SlidingWindowTrending(window_seconds)\` — only count views from the last \`window_seconds\` seconds.

\`\`\`python
sw = SlidingWindowTrending(60)
sw.record_view("a", 100)
sw.record_view("b", 110)
sw.record_view("a", 120)
sw.top_k(2, current_time=160)   # → ["a", "b"]  (all in window)
sw.record_view("b", 200)
sw.record_view("b", 210)
sw.top_k(2, current_time=200)   # → ["b"]  (a's views at 100,120 expired)
\`\`\``,
        baseClass: `from collections import Counter

class TrendingFiles:
    def __init__(self):
        self.views = Counter()

    def record_view(self, file_id: str) -> None:
        self.views[file_id] += 1

    def top_k(self, k: int) -> list[str]:
        return [fid for fid, _ in self.views.most_common(k)]`,
        starterCode: `from collections import Counter

class TrendingFiles:
    def __init__(self):
        self.views = Counter()

    def record_view(self, file_id: str) -> None:
        self.views[file_id] += 1

    def top_k(self, k: int) -> list[str]:
        return [fid for fid, _ in self.views.most_common(k)]

class SlidingWindowTrending:
    def __init__(self, window_seconds: int):
        self.window = window_seconds
        self.events = []   # list of (timestamp, file_id)

    def record_view(self, file_id: str, timestamp: int) -> None:
        self.events.append((timestamp, file_id))

    def top_k(self, k: int, current_time: int) -> list[str]:
        # Count only events where timestamp > current_time - window
        pass`,
        solution: `from collections import Counter

class TrendingFiles:
    def __init__(self):
        self.views = Counter()

    def record_view(self, file_id: str) -> None:
        self.views[file_id] += 1

    def top_k(self, k: int) -> list[str]:
        return [fid for fid, _ in self.views.most_common(k)]

class SlidingWindowTrending:
    def __init__(self, window_seconds: int):
        self.window = window_seconds
        self.events = []

    def record_view(self, file_id: str, timestamp: int) -> None:
        self.events.append((timestamp, file_id))

    def top_k(self, k: int, current_time: int) -> list[str]:
        cutoff = current_time - self.window
        counts = Counter(fid for ts, fid in self.events if ts > cutoff)
        return [fid for fid, _ in counts.most_common(k)]`,
        solutionExplanation: `We store all events as \`(timestamp, file_id)\` pairs. On \`top_k\`, we filter to events strictly after \`current_time - window\` and count with a Counter.

**Time:** O(n) per query where n = total events. For production, you'd use a sorted structure (e.g., a sorted list + bisect, or a Redis sorted set) to evict old events in O(log n).

The sliding window pattern is fundamental to rate limiting, analytics dashboards, and real-time leaderboards.`,
        testCases: [
          { description: "all in window", inputData: "from collections import Counter\nsw = SlidingWindowTrending(60)\nsw.record_view(\"a\", 100); sw.record_view(\"b\", 110); sw.record_view(\"a\", 120)\nresult = sorted(sw.top_k(3, 160))", expectedOutput: "['a', 'b']", orderIndex: 0 },
          { description: "expired views", inputData: "from collections import Counter\nsw = SlidingWindowTrending(60)\nsw.record_view(\"a\", 100); sw.record_view(\"a\", 120)\nsw.record_view(\"b\", 200); sw.record_view(\"b\", 210)\nresult = sw.top_k(2, 200)", expectedOutput: "['b']", orderIndex: 1 },
          { description: "empty window", inputData: "from collections import Counter\nsw = SlidingWindowTrending(60)\nsw.record_view(\"a\", 100)\nresult = sw.top_k(2, 200)", expectedOutput: "[]", orderIndex: 2 },
        ],
      },
    ]
  );

  // ── Problem 5: Real-Time Collaborative Comments ─────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 20014,
      slug: "realtime-collaborative-comments",
      title: "Real-Time Collaborative Comments",
      difficulty: "Medium",
      badges: "figma",
      tags: "design,hash-map,threading",
      frequency: 28,
      description: `Design a **real-time commenting system** for a collaborative canvas (like Figma's comment layer). Users can add, delete, and reply to comments on canvas elements.

- **Stage 1:** Add, get, and delete comments on canvas elements.
- **Stage 2:** Add threading (replies) and comment resolution.`,
      starterCode: `class CommentSystem:
    def add_comment(self, element_id: str, text: str, author: str) -> int:
        pass

    def get_comments(self, element_id: str) -> list:
        pass

    def delete_comment(self, comment_id: int) -> bool:
        pass`,
      methodName: "CommentSystem",
    },
    [
      {
        stageNumber: 1,
        title: "Add, Get, and Delete Comments",
        description: `Implement \`CommentSystem\` with:
- \`add_comment(element_id, text, author)\` — add a comment to a canvas element, return its unique integer ID.
- \`get_comments(element_id)\` — return all active (non-deleted) comments for that element.
- \`delete_comment(comment_id)\` — delete a comment by ID. Return \`True\` if found, \`False\` otherwise.

\`\`\`python
cs = CommentSystem()
c1 = cs.add_comment("rect1", "Fix the color", "alice")
c2 = cs.add_comment("rect1", "Adjust padding", "bob")
len(cs.get_comments("rect1"))   # → 2
cs.delete_comment(c2)            # → True
len(cs.get_comments("rect1"))   # → 1
\`\`\``,
        baseClass: `class CommentSystem:
    def add_comment(self, element_id: str, text: str, author: str) -> int:
        pass

    def get_comments(self, element_id: str) -> list:
        pass

    def delete_comment(self, comment_id: int) -> bool:
        pass`,
        starterCode: `class CommentSystem:
    def __init__(self):
        self._comments = {}   # comment_id -> comment dict
        self._next_id = 1

    def add_comment(self, element_id: str, text: str, author: str) -> int:
        cid = self._next_id
        self._next_id += 1
        self._comments[cid] = {
            'id': cid, 'element_id': element_id,
            'text': text, 'author': author
        }
        return cid

    def get_comments(self, element_id: str) -> list:
        # Return all comments for element_id
        pass

    def delete_comment(self, comment_id: int) -> bool:
        # Remove comment, return True if existed
        pass`,
        solution: `class CommentSystem:
    def __init__(self):
        self._comments = {}
        self._next_id = 1

    def add_comment(self, element_id: str, text: str, author: str) -> int:
        cid = self._next_id
        self._next_id += 1
        self._comments[cid] = {
            'id': cid, 'element_id': element_id,
            'text': text, 'author': author
        }
        return cid

    def get_comments(self, element_id: str) -> list:
        return [c for c in self._comments.values()
                if c['element_id'] == element_id]

    def delete_comment(self, comment_id: int) -> bool:
        return self._comments.pop(comment_id, None) is not None`,
        solutionExplanation: `A dict keyed by comment ID gives O(1) add and delete. \`get_comments\` is O(n) — for large-scale systems you'd maintain a secondary index (dict mapping element_id → list of comment IDs) for O(k) retrieval where k = comments per element.

\`dict.pop(key, None)\` is idiomatic Python for "delete if exists, return None if not".`,
        testCases: [
          { description: "add and get", inputData: "cs = CommentSystem()\nc1 = cs.add_comment(\"rect1\", \"Fix color\", \"alice\")\nc2 = cs.add_comment(\"rect1\", \"Padding\", \"bob\")\nresult = len(cs.get_comments(\"rect1\"))", expectedOutput: "2", orderIndex: 0 },
          { description: "delete", inputData: "cs = CommentSystem()\nc1 = cs.add_comment(\"rect1\", \"Fix\", \"alice\")\nresult = cs.delete_comment(c1)", expectedOutput: "True", orderIndex: 1 },
          { description: "delete nonexistent", inputData: "cs = CommentSystem()\nresult = cs.delete_comment(999)", expectedOutput: "False", orderIndex: 2 },
          { description: "different elements", inputData: "cs = CommentSystem()\ncs.add_comment(\"rect1\", \"A\", \"alice\")\ncs.add_comment(\"circle1\", \"B\", \"bob\")\nresult = len(cs.get_comments(\"circle1\"))", expectedOutput: "1", orderIndex: 3 },
        ],
      },
      {
        stageNumber: 2,
        title: "Threading and Resolution",
        description: `Add:
- \`reply(parent_id, text, author)\` — add a reply to a comment. Return the reply count for that comment, or \`None\` if parent not found.
- \`resolve(comment_id)\` — mark a comment as resolved (hide from \`get_comments\`). Return \`True\` if found.

\`\`\`python
cs = CommentSystem()
c1 = cs.add_comment("rect1", "Fix color", "alice")
cs.reply(c1, "Done!", "charlie")   # → 1
cs.resolve(c1)                      # → True
len(cs.get_comments("rect1"))       # → 0  (resolved comments hidden)
\`\`\``,
        baseClass: `class CommentSystem:
    def __init__(self):
        self._comments = {}
        self._next_id = 1

    def add_comment(self, element_id: str, text: str, author: str) -> int:
        cid = self._next_id
        self._next_id += 1
        self._comments[cid] = {
            'id': cid, 'element_id': element_id,
            'text': text, 'author': author
        }
        return cid

    def get_comments(self, element_id: str) -> list:
        return [c for c in self._comments.values()
                if c['element_id'] == element_id]

    def delete_comment(self, comment_id: int) -> bool:
        return self._comments.pop(comment_id, None) is not None`,
        starterCode: `class CommentSystem:
    def __init__(self):
        self._comments = {}
        self._next_id = 1

    def add_comment(self, element_id: str, text: str, author: str) -> int:
        cid = self._next_id
        self._next_id += 1
        self._comments[cid] = {
            'id': cid, 'element_id': element_id,
            'text': text, 'author': author,
            'replies': [], 'resolved': False
        }
        return cid

    def get_comments(self, element_id: str) -> list:
        return [c for c in self._comments.values()
                if c['element_id'] == element_id and not c['resolved']]

    def delete_comment(self, comment_id: int) -> bool:
        return self._comments.pop(comment_id, None) is not None

    def reply(self, parent_id: int, text: str, author: str):
        # Add reply to parent comment, return reply count or None
        pass

    def resolve(self, comment_id: int) -> bool:
        # Mark as resolved, return True if found
        pass`,
        solution: `class CommentSystem:
    def __init__(self):
        self._comments = {}
        self._next_id = 1

    def add_comment(self, element_id: str, text: str, author: str) -> int:
        cid = self._next_id
        self._next_id += 1
        self._comments[cid] = {
            'id': cid, 'element_id': element_id,
            'text': text, 'author': author,
            'replies': [], 'resolved': False
        }
        return cid

    def get_comments(self, element_id: str) -> list:
        return [c for c in self._comments.values()
                if c['element_id'] == element_id and not c['resolved']]

    def delete_comment(self, comment_id: int) -> bool:
        return self._comments.pop(comment_id, None) is not None

    def reply(self, parent_id: int, text: str, author: str):
        if parent_id not in self._comments:
            return None
        reply = {'text': text, 'author': author}
        self._comments[parent_id]['replies'].append(reply)
        return len(self._comments[parent_id]['replies'])

    def resolve(self, comment_id: int) -> bool:
        if comment_id not in self._comments:
            return False
        self._comments[comment_id]['resolved'] = True
        return True`,
        solutionExplanation: `Replies are stored as a list within each comment dict — a simple embedded document pattern. \`get_comments\` now filters out resolved comments.

In a real collaborative system, you'd also need:
- **Optimistic concurrency control** (version numbers) to handle simultaneous edits.
- **WebSocket broadcasting** to push updates to all connected clients.
- **Soft delete** (keep resolved comments for audit trail) vs hard delete.`,
        testCases: [
          { description: "reply count", inputData: "cs = CommentSystem()\nc1 = cs.add_comment(\"rect1\", \"Fix\", \"alice\")\nresult = cs.reply(c1, \"Done!\", \"bob\")", expectedOutput: "1", orderIndex: 0 },
          { description: "reply to missing", inputData: "cs = CommentSystem()\nresult = cs.reply(999, \"Hi\", \"alice\")", expectedOutput: "None", orderIndex: 1 },
          { description: "resolve hides", inputData: "cs = CommentSystem()\nc1 = cs.add_comment(\"rect1\", \"Fix\", \"alice\")\ncs.resolve(c1)\nresult = len(cs.get_comments(\"rect1\"))", expectedOutput: "0", orderIndex: 2 },
          { description: "resolve nonexistent", inputData: "cs = CommentSystem()\nresult = cs.resolve(999)", expectedOutput: "False", orderIndex: 3 },
          { description: "unresolved still shown", inputData: "cs = CommentSystem()\nc1 = cs.add_comment(\"rect1\", \"A\", \"alice\")\nc2 = cs.add_comment(\"rect1\", \"B\", \"bob\")\ncs.resolve(c1)\nresult = len(cs.get_comments(\"rect1\"))", expectedOutput: "1", orderIndex: 4 },
        ],
      },
    ]
  );

  console.log("[Seed] Batch 8 (New Figma problems) seeded successfully.");
}
