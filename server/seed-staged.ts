import { seedStagedProblemIfNotExists } from "./db";
import { getDb } from "./db";
import { problemStages, problems } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: generate a human-readable cumulative Python unittest file for display
// in the test_level_N.py tab. Stages 1..N are all included (cumulative).
// ─────────────────────────────────────────────────────────────────────────────
type StageSeed = {
  stageNumber: number;
  title: string;
  testCases: Array<{ description: string; inputData: string; expectedOutput: string; orderIndex: number }>;
};

function generateTestFileContent(problemTitle: string, stage: StageSeed): string {
  const lines: string[] = [
    "import unittest",
    "import sys",
    "",
    `# Test file for: ${problemTitle}`,
    `# Stage ${stage.stageNumber}: ${stage.title}`,
    "# These are the NEW tests introduced in this stage.",
    "# When you submit, all previous stages' tests also run cumulatively.",
    "# Your solution.py code is injected before these tests at runtime.",
    "",
    "# ─── paste your solution here to run locally ───",
    "# from solution import *",
    "",
  ];
  let testNum = 1;
  lines.push(`# ${"─".repeat(60)}`);
  lines.push(`# Stage ${stage.stageNumber}: ${stage.title}`);
  lines.push(`# ${"─".repeat(60)}`);
  lines.push("");
  for (const tc of stage.testCases) {
    const desc = tc.description.replace(/\n/g, " ");
    lines.push(`class Test_Stage${stage.stageNumber}_Case${testNum}(unittest.TestCase):`);
    lines.push(`    """`);
    lines.push(`    ${desc}`);
    lines.push(`    Expected output:`);
    lines.push(`      ${JSON.stringify(tc.expectedOutput)}`);
    lines.push(`    """`);
    lines.push(`    def test(self):`);
    lines.push(`        ns = {**globals()}`);
    lines.push(`        exec(${JSON.stringify(tc.inputData)}, ns)`);
    lines.push(`        self.assertEqual(ns.get('_result'), ${JSON.stringify(tc.expectedOutput)})`);
    lines.push("");
    testNum++;
  }
  lines.push("");
  lines.push("if __name__ == '__main__':");
  lines.push("    unittest.main()");
  lines.push("");
  return lines.join("\n");
}

/**
 * Idempotent: updates testFileContent for all stages of a problem (by slug).
 * Called after seedStagedProblemIfNotExists so even existing rows get the content.
 */
async function ensureTestFileContent(
  slug: string,
  problemTitle: string,
  stages: StageSeed[]
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const [prob] = await db.select({ id: problems.id }).from(problems).where(eq(problems.slug, slug));
  if (!prob) return;
  for (let i = 0; i < stages.length; i++) {
    const content = generateTestFileContent(problemTitle, stages[i]);
    await db.update(problemStages)
      .set({ testFileContent: content })
      .where(and(
        eq(problemStages.problemId, prob.id),
        eq(problemStages.stageNumber, stages[i].stageNumber)
      ));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: each staged test case's inputData is a Python snippet that
// instantiates the class (already in scope via baseClass + userCode) and
// assigns the result to _result. expectedOutput is the actual Python value
// (not a string repr) that _result is compared against directly.
// ─────────────────────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════════════════════
// 3. RATE LIMITER
// ══════════════════════════════════════════════════════════════════════════════

const RATE_LIMITER_BASE_S1 = `\
from abc import ABC, abstractmethod

class RateLimiterBase(ABC):
    @abstractmethod
    def allow_request(self, user_id: str) -> bool:
        """Return True if the request is within the rate limit, False otherwise."""
        ...
`;

const RATE_LIMITER_BASE_S2 = `\
from abc import ABC, abstractmethod

class RateLimiterBase(ABC):
    @abstractmethod
    def allow_request(self, user_id: str) -> bool:
        """Return True if the request is within the rate limit, False otherwise."""
        ...

    @abstractmethod
    def cleanup(self) -> int:
        """Remove state for users with no recent requests. Return number removed."""
        ...
`;

const RATE_LIMITER_BASE_S3 = `\
from abc import ABC, abstractmethod
import threading

class RateLimiterBase(ABC):
    @abstractmethod
    def allow_request(self, user_id: str) -> bool:
        """Return True if the request is within the rate limit, False otherwise."""
        ...

    @abstractmethod
    def cleanup(self) -> int:
        """Remove state for users with no recent requests. Return number removed."""
        ...

    @abstractmethod
    def allow_request_thread_safe(self, user_id: str) -> bool:
        """Thread-safe version of allow_request using per-user locking."""
        ...
`;

const RATE_LIMITER_STARTER_S1 = `\
from collections import defaultdict, deque
import time

class RateLimiter(RateLimiterBase):
    def __init__(self, max_requests: int, window_seconds: float):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # TODO: initialize your data structures here

    def allow_request(self, user_id: str) -> bool:
        # TODO: implement sliding window rate limiter
        pass
`;

const RATE_LIMITER_STARTER_S2 = `\
from collections import defaultdict, deque
import time

class RateLimiter(RateLimiterBase):
    def __init__(self, max_requests: int, window_seconds: float):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(deque)

    def allow_request(self, user_id: str) -> bool:
        now = time.time()
        cutoff = now - self.window_seconds
        ts = self.requests[user_id]
        while ts and ts[0] <= cutoff:
            ts.popleft()
        if len(ts) < self.max_requests:
            ts.append(now)
            return True
        return False

    def cleanup(self) -> int:
        # TODO: remove users with no recent requests; return count removed
        pass
`;

const RATE_LIMITER_STARTER_S3 = `\
from collections import defaultdict, deque
import threading, time

class RateLimiter(RateLimiterBase):
    def __init__(self, max_requests: int, window_seconds: float):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(deque)
        self._global_lock = threading.Lock()
        self._user_locks: dict = {}

    def _get_user_lock(self, user_id: str) -> threading.Lock:
        if user_id not in self._user_locks:
            with self._global_lock:
                if user_id not in self._user_locks:
                    self._user_locks[user_id] = threading.Lock()
        return self._user_locks[user_id]

    def allow_request(self, user_id: str) -> bool:
        now = time.time()
        cutoff = now - self.window_seconds
        ts = self.requests[user_id]
        while ts and ts[0] <= cutoff:
            ts.popleft()
        if len(ts) < self.max_requests:
            ts.append(now)
            return True
        return False

    def cleanup(self) -> int:
        now = time.time()
        removed = 0
        for uid in list(self.requests.keys()):
            cutoff = now - self.window_seconds
            ts = self.requests[uid]
            while ts and ts[0] <= cutoff:
                ts.popleft()
            if not ts:
                del self.requests[uid]
                removed += 1
        return removed

    def allow_request_thread_safe(self, user_id: str) -> bool:
        # TODO: use per-user locking
        pass
`;

const RATE_LIMITER_SOL_S1 = `\
from collections import defaultdict, deque
import time

class RateLimiter(RateLimiterBase):
    def __init__(self, max_requests: int, window_seconds: float):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(deque)

    def allow_request(self, user_id: str) -> bool:
        now = time.time()
        cutoff = now - self.window_seconds
        ts = self.requests[user_id]
        while ts and ts[0] <= cutoff:
            ts.popleft()
        if len(ts) < self.max_requests:
            ts.append(now)
            return True
        return False
`;

const RATE_LIMITER_SOL_S2 = RATE_LIMITER_SOL_S1 + `
    def cleanup(self) -> int:
        now = time.time()
        removed = 0
        for uid in list(self.requests.keys()):
            cutoff = now - self.window_seconds
            ts = self.requests[uid]
            while ts and ts[0] <= cutoff:
                ts.popleft()
            if not ts:
                del self.requests[uid]
                removed += 1
        return removed
`;

const RATE_LIMITER_SOL_S3 = `\
from collections import defaultdict, deque
import threading, time

class RateLimiter(RateLimiterBase):
    def __init__(self, max_requests: int, window_seconds: float):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(deque)
        self._global_lock = threading.Lock()
        self._user_locks: dict = {}

    def _get_user_lock(self, user_id: str) -> threading.Lock:
        if user_id not in self._user_locks:
            with self._global_lock:
                if user_id not in self._user_locks:
                    self._user_locks[user_id] = threading.Lock()
        return self._user_locks[user_id]

    def allow_request(self, user_id: str) -> bool:
        now = time.time()
        cutoff = now - self.window_seconds
        ts = self.requests[user_id]
        while ts and ts[0] <= cutoff:
            ts.popleft()
        if len(ts) < self.max_requests:
            ts.append(now)
            return True
        return False

    def cleanup(self) -> int:
        now = time.time()
        removed = 0
        for uid in list(self.requests.keys()):
            cutoff = now - self.window_seconds
            ts = self.requests[uid]
            while ts and ts[0] <= cutoff:
                ts.popleft()
            if not ts:
                del self.requests[uid]
                removed += 1
        return removed

    def allow_request_thread_safe(self, user_id: str) -> bool:
        now = time.time()
        with self._get_user_lock(user_id):
            cutoff = now - self.window_seconds
            ts = self.requests[user_id]
            while ts and ts[0] <= cutoff:
                ts.popleft()
            if len(ts) < self.max_requests:
                ts.append(now)
                return True
            return False
`;

// ══════════════════════════════════════════════════════════════════════════════
// 4. DUPLICATE FILE FINDER
// ══════════════════════════════════════════════════════════════════════════════

const DUP_BASE_S1 = `\
from abc import ABC, abstractmethod
from typing import List

class DuplicateFinderBase(ABC):
    @abstractmethod
    def find_duplicates(self, root_dir: str) -> List[List[str]]:
        """Return groups of files with identical content. Each group has >= 2 files."""
        ...
`;

const DUP_BASE_S2 = `\
from abc import ABC, abstractmethod
from typing import List

class DuplicateFinderBase(ABC):
    @abstractmethod
    def find_duplicates(self, root_dir: str) -> List[List[str]]:
        """Return groups of files with identical content. Each group has >= 2 files."""
        ...

    @abstractmethod
    def find_duplicates_optimized(self, root_dir: str) -> List[List[str]]:
        """3-pass optimized version: size → partial hash → full hash."""
        ...
`;

const DUP_STARTER_S1 = `\
import os, hashlib
from collections import defaultdict
from typing import List

class DuplicateFinder(DuplicateFinderBase):
    def find_duplicates(self, root_dir: str) -> List[List[str]]:
        # TODO: walk root_dir, hash each file, group by hash
        # Return only groups with 2+ files
        pass
`;

const DUP_STARTER_S2 = `\
import os, hashlib
from collections import defaultdict
from typing import List

class DuplicateFinder(DuplicateFinderBase):
    def find_duplicates(self, root_dir: str) -> List[List[str]]:
        hash_to_paths = defaultdict(list)
        for dirpath, _, filenames in os.walk(root_dir):
            for fname in filenames:
                fpath = os.path.join(dirpath, fname)
                if not os.path.isfile(fpath):
                    continue
                try:
                    h = hashlib.md5()
                    with open(fpath, 'rb') as f:
                        while chunk := f.read(8192):
                            h.update(chunk)
                    hash_to_paths[h.hexdigest()].append(fpath)
                except (PermissionError, OSError):
                    continue
        return [g for g in hash_to_paths.values() if len(g) >= 2]

    def find_duplicates_optimized(self, root_dir: str) -> List[List[str]]:
        # TODO: implement 3-pass approach: size → partial hash → full hash
        pass
`;

const DUP_SOL_S1 = `\
import os, hashlib
from collections import defaultdict
from typing import List

class DuplicateFinder(DuplicateFinderBase):
    def find_duplicates(self, root_dir: str) -> List[List[str]]:
        hash_to_paths = defaultdict(list)
        for dirpath, _, filenames in os.walk(root_dir):
            for fname in filenames:
                fpath = os.path.join(dirpath, fname)
                if not os.path.isfile(fpath):
                    continue
                try:
                    h = hashlib.md5()
                    with open(fpath, 'rb') as f:
                        while chunk := f.read(8192):
                            h.update(chunk)
                    hash_to_paths[h.hexdigest()].append(fpath)
                except (PermissionError, OSError):
                    continue
        return [g for g in hash_to_paths.values() if len(g) >= 2]
`;

const DUP_SOL_S2 = DUP_SOL_S1 + `
    def find_duplicates_optimized(self, root_dir: str) -> List[List[str]]:
        size_to_paths = defaultdict(list)
        for dirpath, _, filenames in os.walk(root_dir):
            for fname in filenames:
                fpath = os.path.join(dirpath, fname)
                if not os.path.isfile(fpath):
                    continue
                try:
                    size_to_paths[os.path.getsize(fpath)].append(fpath)
                except (PermissionError, OSError):
                    continue
        candidates = {s: p for s, p in size_to_paths.items() if len(p) >= 2}
        partial_groups = defaultdict(list)
        for size, paths in candidates.items():
            for fpath in paths:
                try:
                    h = hashlib.md5()
                    with open(fpath, 'rb') as f:
                        h.update(f.read(4096))
                        if size > 4096 * 3:
                            f.seek(size // 2)
                            h.update(f.read(4096))
                            f.seek(-4096, 2)
                            h.update(f.read(4096))
                    partial_groups[(size, h.hexdigest())].append(fpath)
                except (PermissionError, OSError):
                    continue
        candidates2 = {k: p for k, p in partial_groups.items() if len(p) >= 2}
        full_groups = defaultdict(list)
        for _, paths in candidates2.items():
            for fpath in paths:
                try:
                    h = hashlib.md5()
                    with open(fpath, 'rb') as f:
                        while chunk := f.read(8192):
                            h.update(chunk)
                    full_groups[h.hexdigest()].append(fpath)
                except (PermissionError, OSError):
                    continue
        return [g for g in full_groups.values() if len(g) >= 2]
`;

// ══════════════════════════════════════════════════════════════════════════════
// 5. STACK TRACE PROFILER
// ══════════════════════════════════════════════════════════════════════════════

const PROFILER_BASE_S1 = `\
from abc import ABC, abstractmethod
from typing import List, NamedTuple

class TraceEvent(NamedTuple):
    timestamp: int
    function: str
    depth: int
    event_type: str  # "start" or "end"

class ProfilerBase(ABC):
    @abstractmethod
    def convert_to_events(self, snapshots: List[List[str]]) -> List[TraceEvent]:
        """Convert stack snapshots to trace events (start/end per function per depth)."""
        ...
`;

const PROFILER_BASE_S2 = `\
from abc import ABC, abstractmethod
from typing import List, NamedTuple

class TraceEvent(NamedTuple):
    timestamp: int
    function: str
    depth: int
    event_type: str  # "start" or "end"

class ProfilerBase(ABC):
    @abstractmethod
    def convert_to_events(self, snapshots: List[List[str]]) -> List[TraceEvent]:
        """Convert stack snapshots to trace events (start/end per function per depth)."""
        ...

    @abstractmethod
    def convert_with_denoising(self, snapshots: List[List[str]], min_samples: int = 3) -> List[TraceEvent]:
        """Filter out functions that appear for fewer than min_samples consecutive snapshots."""
        ...
`;

const PROFILER_STARTER_S1 = `\
from typing import List

class Profiler(ProfilerBase):
    def convert_to_events(self, snapshots: List[List[str]]) -> List[TraceEvent]:
        # Hint: compare consecutive snapshots.
        # Find the first position where they diverge (common_depth).
        # Emit END events from top of prev_stack down to common_depth.
        # Emit START events from common_depth up to end of curr_stack.
        # Track by POSITION, not name — handles recursion correctly.
        pass
`;

const PROFILER_STARTER_S2 = `\
from typing import List

class Profiler(ProfilerBase):
    def convert_to_events(self, snapshots: List[List[str]]) -> List[TraceEvent]:
        events = []
        prev_stack = []
        for t, curr_stack in enumerate(snapshots):
            common_depth = 0
            for i in range(min(len(prev_stack), len(curr_stack))):
                if prev_stack[i] == curr_stack[i]:
                    common_depth = i + 1
                else:
                    break
            for i in range(len(prev_stack) - 1, common_depth - 1, -1):
                events.append(TraceEvent(t, prev_stack[i], i, "end"))
            for i in range(common_depth, len(curr_stack)):
                events.append(TraceEvent(t, curr_stack[i], i, "start"))
            prev_stack = list(curr_stack)
        for i in range(len(prev_stack) - 1, -1, -1):
            events.append(TraceEvent(len(snapshots), prev_stack[i], i, "end"))
        return events

    def convert_with_denoising(self, snapshots: List[List[str]], min_samples: int = 3) -> List[TraceEvent]:
        # TODO: only emit events for functions that appear >= min_samples consecutive times
        pass
`;

const PROFILER_SOL_S1 = `\
from typing import List

class Profiler(ProfilerBase):
    def convert_to_events(self, snapshots: List[List[str]]) -> List[TraceEvent]:
        events = []
        prev_stack = []
        for t, curr_stack in enumerate(snapshots):
            common_depth = 0
            for i in range(min(len(prev_stack), len(curr_stack))):
                if prev_stack[i] == curr_stack[i]:
                    common_depth = i + 1
                else:
                    break
            for i in range(len(prev_stack) - 1, common_depth - 1, -1):
                events.append(TraceEvent(t, prev_stack[i], i, "end"))
            for i in range(common_depth, len(curr_stack)):
                events.append(TraceEvent(t, curr_stack[i], i, "start"))
            prev_stack = list(curr_stack)
        for i in range(len(prev_stack) - 1, -1, -1):
            events.append(TraceEvent(len(snapshots), prev_stack[i], i, "end"))
        return events
`;

const PROFILER_SOL_S2 = PROFILER_SOL_S1 + `
    def convert_with_denoising(self, snapshots: List[List[str]], min_samples: int = 3) -> List[TraceEvent]:
        events = []
        max_depth = max((len(s) for s in snapshots), default=0)
        confirmed_spans = []
        for depth in range(max_depth):
            run_func = None
            run_start = 0
            run_count = 0
            for t, stack in enumerate(snapshots):
                curr = stack[depth] if depth < len(stack) else None
                if curr == run_func and curr is not None:
                    run_count += 1
                else:
                    if run_func is not None and run_count >= min_samples:
                        confirmed_spans.append((depth, run_func, run_start, t))
                    run_func = curr
                    run_start = t
                    run_count = 1 if curr is not None else 0
            if run_func is not None and run_count >= min_samples:
                confirmed_spans.append((depth, run_func, run_start, len(snapshots)))
        for depth, func, start_t, end_t in confirmed_spans:
            events.append(TraceEvent(start_t, func, depth, "start"))
            events.append(TraceEvent(end_t, func, depth, "end"))
        events.sort(key=lambda e: (e.timestamp, 0 if e.event_type == "end" else 1,
                                    e.depth if e.event_type == "start" else -e.depth))
        return events
`;

// ══════════════════════════════════════════════════════════════════════════════
// 6. GREEDY TOKENIZER
// ══════════════════════════════════════════════════════════════════════════════

const TOKENIZER_BASE_S1 = `\
from abc import ABC, abstractmethod
from typing import List, Set

class TokenizerBase(ABC):
    @abstractmethod
    def tokenize(self, text: str, vocab: Set[str]) -> List[str]:
        """Greedy longest-match tokenization. Unknown chars emitted as single chars."""
        ...
`;

const TOKENIZER_BASE_S2 = `\
from abc import ABC, abstractmethod
from typing import List, Set

class TokenizerBase(ABC):
    @abstractmethod
    def tokenize(self, text: str, vocab: Set[str]) -> List[str]:
        """Greedy longest-match tokenization. Unknown chars emitted as single chars."""
        ...

    @abstractmethod
    def tokenize_trie(self, text: str, vocab: Set[str]) -> List[str]:
        """Trie-based greedy tokenizer. O(n * L) where L = actual match length."""
        ...
`;

const TOKENIZER_STARTER_S1 = `\
from typing import List, Set

class Tokenizer(TokenizerBase):
    def tokenize(self, text: str, vocab: Set[str]) -> List[str]:
        # Hint: at each position i, try lengths from max_len down to 1.
        # If text[i:i+length] is in vocab, take it. Otherwise emit text[i].
        pass
`;

const TOKENIZER_STARTER_S2 = `\
from typing import List, Set

class Trie:
    def __init__(self):
        self.children = {}
        self.is_end = False
        self.word = None

    def insert(self, word: str):
        node = self
        for ch in word:
            if ch not in node.children:
                node.children[ch] = Trie()
            node = node.children[ch]
        node.is_end = True
        node.word = word

    def longest_match(self, text: str, start: int):
        node = self
        best = None
        for i in range(start, len(text)):
            if text[i] not in node.children:
                break
            node = node.children[text[i]]
            if node.is_end:
                best = node.word
        return best

class Tokenizer(TokenizerBase):
    def tokenize(self, text: str, vocab: Set[str]) -> List[str]:
        if not text:
            return []
        max_len = max(len(w) for w in vocab) if vocab else 0
        tokens = []
        i = 0
        while i < len(text):
            matched = False
            for length in range(min(max_len, len(text) - i), 0, -1):
                if text[i:i + length] in vocab:
                    tokens.append(text[i:i + length])
                    i += length
                    matched = True
                    break
            if not matched:
                tokens.append(text[i])
                i += 1
        return tokens

    def tokenize_trie(self, text: str, vocab: Set[str]) -> List[str]:
        # TODO: build a Trie from vocab, then use longest_match at each position
        pass
`;

const TOKENIZER_SOL_S1 = `\
from typing import List, Set

class Tokenizer(TokenizerBase):
    def tokenize(self, text: str, vocab: Set[str]) -> List[str]:
        if not text:
            return []
        max_len = max(len(w) for w in vocab) if vocab else 0
        tokens = []
        i = 0
        while i < len(text):
            matched = False
            for length in range(min(max_len, len(text) - i), 0, -1):
                if text[i:i + length] in vocab:
                    tokens.append(text[i:i + length])
                    i += length
                    matched = True
                    break
            if not matched:
                tokens.append(text[i])
                i += 1
        return tokens
`;

const TOKENIZER_SOL_S2 = `\
from typing import List, Set

class Trie:
    def __init__(self):
        self.children = {}
        self.is_end = False
        self.word = None

    def insert(self, word: str):
        node = self
        for ch in word:
            if ch not in node.children:
                node.children[ch] = Trie()
            node = node.children[ch]
        node.is_end = True
        node.word = word

    def longest_match(self, text: str, start: int):
        node = self
        best = None
        for i in range(start, len(text)):
            if text[i] not in node.children:
                break
            node = node.children[text[i]]
            if node.is_end:
                best = node.word
        return best

class Tokenizer(TokenizerBase):
    def tokenize(self, text: str, vocab: Set[str]) -> List[str]:
        if not text:
            return []
        max_len = max(len(w) for w in vocab) if vocab else 0
        tokens = []
        i = 0
        while i < len(text):
            matched = False
            for length in range(min(max_len, len(text) - i), 0, -1):
                if text[i:i + length] in vocab:
                    tokens.append(text[i:i + length])
                    i += length
                    matched = True
                    break
            if not matched:
                tokens.append(text[i])
                i += 1
        return tokens

    def tokenize_trie(self, text: str, vocab: Set[str]) -> List[str]:
        trie = Trie()
        for word in vocab:
            trie.insert(word)
        tokens = []
        i = 0
        while i < len(text):
            match = trie.longest_match(text, i)
            if match:
                tokens.append(match)
                i += len(match)
            else:
                tokens.append(text[i])
                i += 1
        return tokens
`;

// ══════════════════════════════════════════════════════════════════════════════
// 7. COUNT SMALLER TO THE RIGHT
// ══════════════════════════════════════════════════════════════════════════════

const SMALLER_BASE_S1 = `\
from abc import ABC, abstractmethod
from typing import List

class CountSmallerBase(ABC):
    @abstractmethod
    def count_smaller(self, nums: List[int]) -> List[int]:
        """For each element, count how many elements to its right are strictly smaller."""
        ...
`;

const SMALLER_BASE_S2 = `\
from abc import ABC, abstractmethod
from typing import List

class CountSmallerBase(ABC):
    @abstractmethod
    def count_smaller(self, nums: List[int]) -> List[int]:
        """For each element, count how many elements to its right are strictly smaller."""
        ...

    @abstractmethod
    def count_smaller_efficient(self, nums: List[int]) -> List[int]:
        """O(n log n) version using bisect or Fenwick tree."""
        ...
`;

const SMALLER_STARTER_S1 = `\
from typing import List

class CountSmaller(CountSmallerBase):
    def count_smaller(self, nums: List[int]) -> List[int]:
        # Hint: O(n^2) brute force — for each i, count j > i where nums[j] < nums[i]
        pass
`;

const SMALLER_STARTER_S2 = `\
import bisect
from typing import List

class CountSmaller(CountSmallerBase):
    def count_smaller(self, nums: List[int]) -> List[int]:
        n = len(nums)
        result = [0] * n
        for i in range(n):
            for j in range(i + 1, n):
                if nums[j] < nums[i]:
                    result[i] += 1
        return result

    def count_smaller_efficient(self, nums: List[int]) -> List[int]:
        # TODO: implement O(n log n) using bisect.bisect_left on a sorted suffix array
        pass
`;

const SMALLER_SOL_S1 = `\
from typing import List

class CountSmaller(CountSmallerBase):
    def count_smaller(self, nums: List[int]) -> List[int]:
        n = len(nums)
        result = [0] * n
        for i in range(n):
            for j in range(i + 1, n):
                if nums[j] < nums[i]:
                    result[i] += 1
        return result
`;

const SMALLER_SOL_S2 = SMALLER_SOL_S1 + `
    def count_smaller_efficient(self, nums: List[int]) -> List[int]:
        import bisect
        n = len(nums)
        result = [0] * n
        sorted_right = []
        for i in range(n - 1, -1, -1):
            pos = bisect.bisect_left(sorted_right, nums[i])
            result[i] = pos
            bisect.insort(sorted_right, nums[i])
        return result
`;

// ══════════════════════════════════════════════════════════════════════════════
// 8. IN-MEMORY DATABASE
// ══════════════════════════════════════════════════════════════════════════════

const DB_BASE_S1 = `\
from abc import ABC, abstractmethod
from typing import Optional, Any

class InMemoryDatabaseBase(ABC):
    @abstractmethod
    def set(self, key: str, value: Any) -> bool:
        """Set key to value. Returns True on success."""
        ...
    @abstractmethod
    def get(self, key: str) -> Optional[Any]:
        """Return value for key, or None if not found."""
        ...
    @abstractmethod
    def delete(self, key: str) -> bool:
        """Delete key. Returns True if key existed."""
        ...
    @abstractmethod
    def count(self) -> int:
        """Return number of keys currently stored."""
        ...
`;

const DB_BASE_S2 = DB_BASE_S1 + `
    @abstractmethod
    def history(self, key: str) -> list:
        """Return list of (timestamp, value) tuples for key."""
        ...
    @abstractmethod
    def modified_since(self, timestamp: int) -> list:
        """Return sorted list of keys modified after timestamp."""
        ...
`;

const DB_BASE_S3 = DB_BASE_S2 + `
    @abstractmethod
    def lock(self, key: str, caller_id: str) -> bool:
        """Acquire exclusive lock on key. Returns True if acquired."""
        ...
    @abstractmethod
    def unlock(self, key: str, caller_id: str) -> bool:
        """Release lock. Only the holder can unlock. Returns True if released."""
        ...
`;

const DB_BASE_S4 = DB_BASE_S3 + `
    @abstractmethod
    def begin(self, caller_id: str) -> bool:
        """Start a transaction for caller. Returns False if already in one."""
        ...
    @abstractmethod
    def commit(self, caller_id: str) -> bool:
        """Commit transaction. Returns False if not in a transaction."""
        ...
    @abstractmethod
    def rollback(self, caller_id: str) -> bool:
        """Rollback all changes since BEGIN. Returns False if not in a transaction."""
        ...
`;

const DB_STARTER_S1 = `\
from typing import Optional, Any

class InMemoryDatabase(InMemoryDatabaseBase):
    def __init__(self):
        # TODO: initialize your data store
        pass

    def set(self, key: str, value: Any) -> bool:
        pass

    def get(self, key: str) -> Optional[Any]:
        pass

    def delete(self, key: str) -> bool:
        pass

    def count(self) -> int:
        pass
`;

const DB_STARTER_S2 = `\
from collections import defaultdict
from typing import Optional, Any

class InMemoryDatabase(InMemoryDatabaseBase):
    def __init__(self):
        self.data = {}
        self.history_log = defaultdict(list)
        self._clock = 0

    def _tick(self):
        self._clock += 1
        return self._clock

    def set(self, key: str, value: Any, caller_id=None) -> bool:
        ts = self._tick()
        self.data[key] = value
        self.history_log[key].append((ts, value))
        return True

    def get(self, key: str) -> Optional[Any]:
        return self.data.get(key)

    def delete(self, key: str, caller_id=None) -> bool:
        if key not in self.data:
            return False
        ts = self._tick()
        del self.data[key]
        self.history_log[key].append((ts, None))
        return True

    def count(self) -> int:
        return len(self.data)

    def history(self, key: str) -> list:
        # TODO: return list of (timestamp, value) for key
        pass

    def modified_since(self, timestamp: int) -> list:
        # TODO: return sorted list of keys modified after timestamp
        pass
`;

const DB_STARTER_S3 = `\
from collections import defaultdict
from typing import Optional, Any

class InMemoryDatabase(InMemoryDatabaseBase):
    def __init__(self):
        self.data = {}
        self.history_log = defaultdict(list)
        self.locks = {}
        self._clock = 0

    def _tick(self):
        self._clock += 1
        return self._clock

    def set(self, key: str, value: Any, caller_id=None) -> bool:
        if key in self.locks and caller_id != self.locks[key]:
            return False
        ts = self._tick()
        self.data[key] = value
        self.history_log[key].append((ts, value))
        return True

    def get(self, key: str) -> Optional[Any]:
        return self.data.get(key)

    def delete(self, key: str, caller_id=None) -> bool:
        if key not in self.data:
            return False
        if key in self.locks and caller_id != self.locks[key]:
            return False
        ts = self._tick()
        del self.data[key]
        self.history_log[key].append((ts, None))
        return True

    def count(self) -> int:
        return len(self.data)

    def history(self, key: str) -> list:
        return list(self.history_log[key])

    def modified_since(self, timestamp: int) -> list:
        result = set()
        for key, entries in self.history_log.items():
            for ts, _ in entries:
                if ts > timestamp:
                    result.add(key)
                    break
        return sorted(result)

    def lock(self, key: str, caller_id: str) -> bool:
        # TODO: acquire lock; idempotent if same caller
        pass

    def unlock(self, key: str, caller_id: str) -> bool:
        # TODO: release lock; only holder can unlock
        pass
`;

const DB_STARTER_S4 = `\
from collections import defaultdict
from typing import Optional, Any

class InMemoryDatabase(InMemoryDatabaseBase):
    def __init__(self):
        self.data = {}
        self.history_log = defaultdict(list)
        self.locks = {}
        self.transactions = {}
        self._clock = 0

    def _tick(self):
        self._clock += 1
        return self._clock

    def set(self, key: str, value: Any, caller_id=None) -> bool:
        if key in self.locks and caller_id != self.locks[key]:
            return False
        ts = self._tick()
        old_value = self.data.get(key)
        if caller_id and caller_id in self.transactions:
            self.transactions[caller_id].append(("set", key, old_value))
        self.data[key] = value
        self.history_log[key].append((ts, value))
        return True

    def get(self, key: str) -> Optional[Any]:
        return self.data.get(key)

    def delete(self, key: str, caller_id=None) -> bool:
        if key not in self.data:
            return False
        if key in self.locks and caller_id != self.locks[key]:
            return False
        ts = self._tick()
        old_value = self.data[key]
        if caller_id and caller_id in self.transactions:
            self.transactions[caller_id].append(("delete", key, old_value))
        del self.data[key]
        self.history_log[key].append((ts, None))
        return True

    def count(self) -> int:
        return len(self.data)

    def history(self, key: str) -> list:
        return list(self.history_log[key])

    def modified_since(self, timestamp: int) -> list:
        result = set()
        for key, entries in self.history_log.items():
            for ts, _ in entries:
                if ts > timestamp:
                    result.add(key)
                    break
        return sorted(result)

    def lock(self, key: str, caller_id: str) -> bool:
        if key in self.locks:
            return self.locks[key] == caller_id
        self.locks[key] = caller_id
        return True

    def unlock(self, key: str, caller_id: str) -> bool:
        if key not in self.locks or self.locks[key] != caller_id:
            return False
        del self.locks[key]
        return True

    def begin(self, caller_id: str) -> bool:
        # TODO: start a transaction (undo log)
        pass

    def commit(self, caller_id: str) -> bool:
        # TODO: discard undo log
        pass

    def rollback(self, caller_id: str) -> bool:
        # TODO: replay undo log in reverse
        pass
`;

const DB_SOL_S1 = `\
from collections import defaultdict
from typing import Optional, Any

class InMemoryDatabase(InMemoryDatabaseBase):
    def __init__(self):
        self.data = {}
        self.history_log = defaultdict(list)
        self.locks = {}
        self.transactions = {}
        self._clock = 0

    def _tick(self):
        self._clock += 1
        return self._clock

    def set(self, key: str, value: Any, caller_id=None) -> bool:
        if key in self.locks and caller_id != self.locks[key]:
            return False
        ts = self._tick()
        old_value = self.data.get(key)
        if caller_id and caller_id in self.transactions:
            self.transactions[caller_id].append(("set", key, old_value))
        self.data[key] = value
        self.history_log[key].append((ts, value))
        return True

    def get(self, key: str) -> Optional[Any]:
        return self.data.get(key)

    def delete(self, key: str, caller_id=None) -> bool:
        if key not in self.data:
            return False
        if key in self.locks and caller_id != self.locks[key]:
            return False
        ts = self._tick()
        old_value = self.data[key]
        if caller_id and caller_id in self.transactions:
            self.transactions[caller_id].append(("delete", key, old_value))
        del self.data[key]
        self.history_log[key].append((ts, None))
        return True

    def count(self) -> int:
        return len(self.data)

    def history(self, key: str) -> list:
        return list(self.history_log[key])

    def modified_since(self, timestamp: int) -> list:
        result = set()
        for key, entries in self.history_log.items():
            for ts, _ in entries:
                if ts > timestamp:
                    result.add(key)
                    break
        return sorted(result)

    def lock(self, key: str, caller_id: str) -> bool:
        if key in self.locks:
            return self.locks[key] == caller_id
        self.locks[key] = caller_id
        return True

    def unlock(self, key: str, caller_id: str) -> bool:
        if key not in self.locks or self.locks[key] != caller_id:
            return False
        del self.locks[key]
        return True

    def begin(self, caller_id: str) -> bool:
        if caller_id in self.transactions:
            return False
        self.transactions[caller_id] = []
        return True

    def commit(self, caller_id: str) -> bool:
        if caller_id not in self.transactions:
            return False
        del self.transactions[caller_id]
        return True

    def rollback(self, caller_id: str) -> bool:
        if caller_id not in self.transactions:
            return False
        for action, key, old_value in reversed(self.transactions[caller_id]):
            ts = self._tick()
            if action == "set":
                if old_value is None:
                    self.data.pop(key, None)
                    self.history_log[key].append((ts, None))
                else:
                    self.data[key] = old_value
                    self.history_log[key].append((ts, old_value))
            elif action == "delete":
                self.data[key] = old_value
                self.history_log[key].append((ts, old_value))
        del self.transactions[caller_id]
        return True
`;

// ══════════════════════════════════════════════════════════════════════════════
// 9. BANK SYSTEM
// ══════════════════════════════════════════════════════════════════════════════

const BANK_BASE_S1 = `\
from abc import ABC, abstractmethod
from typing import Optional

class BankSystemBase(ABC):
    @abstractmethod
    def create(self, account_id: str) -> bool:
        """Create account with balance 0. Returns False if already exists."""
        ...
    @abstractmethod
    def deposit(self, account_id: str, amount: float) -> Optional[float]:
        """Add amount to balance. Returns new balance or None on error."""
        ...
    @abstractmethod
    def withdraw(self, account_id: str, amount: float) -> Optional[float]:
        """Subtract amount. Returns new balance or None if insufficient/not found."""
        ...
    @abstractmethod
    def balance(self, account_id: str) -> Optional[float]:
        """Return current balance or None if account not found."""
        ...
`;

const BANK_BASE_S2 = BANK_BASE_S1 + `
    @abstractmethod
    def transfer(self, from_id: str, to_id: str, amount: float) -> bool:
        """Atomic transfer. Returns False if insufficient funds or account not found."""
        ...
`;

const BANK_BASE_S3 = BANK_BASE_S2 + `
    @abstractmethod
    def merge(self, source_id: str, target_id: str) -> bool:
        """Merge source into target. Source is closed; future ops on source redirect to target."""
        ...
`;

const BANK_BASE_S4 = BANK_BASE_S3 + `
    @abstractmethod
    def top_spenders(self, n: int) -> list:
        """Return top n accounts by total outgoing (withdrawals + transfers out)."""
        ...
    @abstractmethod
    def cashback(self, percentage: float) -> int:
        """Give each account % of their total outgoing back. Returns count of accounts credited."""
        ...
`;

const BANK_STARTER_S1 = `\
from typing import Optional

class BankSystem(BankSystemBase):
    def __init__(self):
        # TODO: initialize accounts dict
        pass

    def create(self, account_id: str) -> bool:
        pass

    def deposit(self, account_id: str, amount: float) -> Optional[float]:
        pass

    def withdraw(self, account_id: str, amount: float) -> Optional[float]:
        pass

    def balance(self, account_id: str) -> Optional[float]:
        pass
`;

const BANK_STARTER_S2 = `\
from typing import Optional

class BankSystem(BankSystemBase):
    def __init__(self):
        self.accounts = {}

    def create(self, account_id: str) -> bool:
        if account_id in self.accounts:
            return False
        self.accounts[account_id] = 0.0
        return True

    def deposit(self, account_id: str, amount: float) -> Optional[float]:
        if amount <= 0 or account_id not in self.accounts:
            return None
        self.accounts[account_id] += amount
        return self.accounts[account_id]

    def withdraw(self, account_id: str, amount: float) -> Optional[float]:
        if amount <= 0 or account_id not in self.accounts:
            return None
        if self.accounts[account_id] < amount:
            return None
        self.accounts[account_id] -= amount
        return self.accounts[account_id]

    def balance(self, account_id: str) -> Optional[float]:
        return self.accounts.get(account_id)

    def transfer(self, from_id: str, to_id: str, amount: float) -> bool:
        # TODO: atomic transfer — check funds before modifying either account
        pass
`;

const BANK_STARTER_S3 = `\
from collections import defaultdict
from typing import Optional

class BankSystem(BankSystemBase):
    def __init__(self):
        self.accounts = {}
        self.redirects = {}
        self.total_outgoing = defaultdict(float)
        self.closed = set()

    def _resolve(self, account_id: str) -> str:
        visited = []
        while account_id in self.redirects:
            visited.append(account_id)
            account_id = self.redirects[account_id]
        for v in visited:
            self.redirects[v] = account_id
        return account_id

    def create(self, account_id: str) -> bool:
        if account_id in self.accounts or account_id in self.closed:
            return False
        self.accounts[account_id] = 0.0
        return True

    def deposit(self, account_id: str, amount: float) -> Optional[float]:
        if amount <= 0: return None
        account_id = self._resolve(account_id)
        if account_id not in self.accounts: return None
        self.accounts[account_id] += amount
        return self.accounts[account_id]

    def withdraw(self, account_id: str, amount: float) -> Optional[float]:
        if amount <= 0: return None
        account_id = self._resolve(account_id)
        if account_id not in self.accounts: return None
        if self.accounts[account_id] < amount: return None
        self.accounts[account_id] -= amount
        self.total_outgoing[account_id] += amount
        return self.accounts[account_id]

    def balance(self, account_id: str) -> Optional[float]:
        account_id = self._resolve(account_id)
        return self.accounts.get(account_id)

    def transfer(self, from_id: str, to_id: str, amount: float) -> bool:
        if amount <= 0: return False
        from_id = self._resolve(from_id)
        to_id = self._resolve(to_id)
        if from_id not in self.accounts or to_id not in self.accounts: return False
        if from_id == to_id: return False
        if self.accounts[from_id] < amount: return False
        self.accounts[from_id] -= amount
        self.accounts[to_id] += amount
        self.total_outgoing[from_id] += amount
        return True

    def merge(self, source_id: str, target_id: str) -> bool:
        # TODO: union-find merge — combine balances, redirect source to target
        pass
`;

const BANK_STARTER_S4 = `\
from collections import defaultdict
from typing import Optional

class BankSystem(BankSystemBase):
    def __init__(self):
        self.accounts = {}
        self.redirects = {}
        self.total_outgoing = defaultdict(float)
        self.closed = set()

    def _resolve(self, account_id: str) -> str:
        visited = []
        while account_id in self.redirects:
            visited.append(account_id)
            account_id = self.redirects[account_id]
        for v in visited:
            self.redirects[v] = account_id
        return account_id

    def create(self, account_id: str) -> bool:
        if account_id in self.accounts or account_id in self.closed:
            return False
        self.accounts[account_id] = 0.0
        return True

    def deposit(self, account_id: str, amount: float) -> Optional[float]:
        if amount <= 0: return None
        account_id = self._resolve(account_id)
        if account_id not in self.accounts: return None
        self.accounts[account_id] += amount
        return self.accounts[account_id]

    def withdraw(self, account_id: str, amount: float) -> Optional[float]:
        if amount <= 0: return None
        account_id = self._resolve(account_id)
        if account_id not in self.accounts: return None
        if self.accounts[account_id] < amount: return None
        self.accounts[account_id] -= amount
        self.total_outgoing[account_id] += amount
        return self.accounts[account_id]

    def balance(self, account_id: str) -> Optional[float]:
        account_id = self._resolve(account_id)
        return self.accounts.get(account_id)

    def transfer(self, from_id: str, to_id: str, amount: float) -> bool:
        if amount <= 0: return False
        from_id = self._resolve(from_id)
        to_id = self._resolve(to_id)
        if from_id not in self.accounts or to_id not in self.accounts: return False
        if from_id == to_id: return False
        if self.accounts[from_id] < amount: return False
        self.accounts[from_id] -= amount
        self.accounts[to_id] += amount
        self.total_outgoing[from_id] += amount
        return True

    def merge(self, source_id: str, target_id: str) -> bool:
        source_id = self._resolve(source_id)
        target_id = self._resolve(target_id)
        if source_id not in self.accounts or target_id not in self.accounts: return False
        if source_id == target_id: return False
        self.accounts[target_id] += self.accounts[source_id]
        self.total_outgoing[target_id] += self.total_outgoing[source_id]
        del self.accounts[source_id]
        self.closed.add(source_id)
        self.redirects[source_id] = target_id
        return True

    def top_spenders(self, n: int) -> list:
        # TODO: return top n accounts by total_outgoing
        pass

    def cashback(self, percentage: float) -> int:
        # TODO: credit each account % of their outgoing; return count credited
        pass
`;

const BANK_SOL_S1 = `\
from collections import defaultdict
from typing import Optional

class BankSystem(BankSystemBase):
    def __init__(self):
        self.accounts = {}
        self.redirects = {}
        self.total_outgoing = defaultdict(float)
        self.closed = set()

    def _resolve(self, account_id: str) -> str:
        visited = []
        while account_id in self.redirects:
            visited.append(account_id)
            account_id = self.redirects[account_id]
        for v in visited:
            self.redirects[v] = account_id
        return account_id

    def create(self, account_id: str) -> bool:
        if account_id in self.accounts or account_id in self.closed:
            return False
        self.accounts[account_id] = 0.0
        return True

    def deposit(self, account_id: str, amount: float) -> Optional[float]:
        if amount <= 0: return None
        account_id = self._resolve(account_id)
        if account_id not in self.accounts: return None
        self.accounts[account_id] += amount
        return self.accounts[account_id]

    def withdraw(self, account_id: str, amount: float) -> Optional[float]:
        if amount <= 0: return None
        account_id = self._resolve(account_id)
        if account_id not in self.accounts: return None
        if self.accounts[account_id] < amount: return None
        self.accounts[account_id] -= amount
        self.total_outgoing[account_id] += amount
        return self.accounts[account_id]

    def balance(self, account_id: str) -> Optional[float]:
        account_id = self._resolve(account_id)
        return self.accounts.get(account_id)

    def transfer(self, from_id: str, to_id: str, amount: float) -> bool:
        if amount <= 0: return False
        from_id = self._resolve(from_id)
        to_id = self._resolve(to_id)
        if from_id not in self.accounts or to_id not in self.accounts: return False
        if from_id == to_id: return False
        if self.accounts[from_id] < amount: return False
        self.accounts[from_id] -= amount
        self.accounts[to_id] += amount
        self.total_outgoing[from_id] += amount
        return True

    def merge(self, source_id: str, target_id: str) -> bool:
        source_id = self._resolve(source_id)
        target_id = self._resolve(target_id)
        if source_id not in self.accounts or target_id not in self.accounts: return False
        if source_id == target_id: return False
        self.accounts[target_id] += self.accounts[source_id]
        self.total_outgoing[target_id] += self.total_outgoing[source_id]
        del self.accounts[source_id]
        self.closed.add(source_id)
        self.redirects[source_id] = target_id
        return True

    def top_spenders(self, n: int) -> list:
        active = [(aid, self.total_outgoing.get(aid, 0.0)) for aid in self.accounts]
        active.sort(key=lambda x: (-x[1], x[0]))
        return active[:n]

    def cashback(self, percentage: float) -> int:
        count = 0
        for aid in list(self.accounts.keys()):
            outgoing = self.total_outgoing.get(aid, 0.0)
            if outgoing > 0:
                self.accounts[aid] += outgoing * (percentage / 100.0)
                count += 1
        return count
`;

// ══════════════════════════════════════════════════════════════════════════════
// 10. LRU CACHE + TASK MANAGER
// ══════════════════════════════════════════════════════════════════════════════

const LRU_BASE_S1 = `\
from abc import ABC, abstractmethod

class LRUCacheBase(ABC):
    @abstractmethod
    def get(self, key: int) -> int:
        """Return value for key, or -1 if not found."""
        ...
    @abstractmethod
    def put(self, key: int, value: int) -> None:
        """Insert or update key. Evict LRU entry if at capacity."""
        ...
`;

const LRU_BASE_S2 = LRU_BASE_S1 + `
    @abstractmethod
    def get_with_ttl(self, key: int) -> int:
        """Return value or -1 if not found or expired."""
        ...
    @abstractmethod
    def put_with_ttl(self, key: int, value: int, ttl: float) -> None:
        """Insert with explicit TTL (seconds). Evict LRU if at capacity."""
        ...
`;

const LRU_BASE_S3 = LRU_BASE_S2 + `

class TaskBase(ABC):
    task_id: str
    description: str
    priority: int
    status: str  # "pending" or "complete"

class TaskManagerBase(ABC):
    @abstractmethod
    def add_task(self, task_id: str, description: str, priority: int) -> bool:
        """Add task. Returns False if task_id already exists."""
        ...
    @abstractmethod
    def get_task(self, task_id: str):
        """Return Task or None."""
        ...
    @abstractmethod
    def complete_task(self, task_id: str) -> bool:
        """Mark task complete. Returns False if not found or already complete."""
        ...
    @abstractmethod
    def get_highest_priority(self):
        """Return highest-priority pending Task, or None."""
        ...
    @abstractmethod
    def list_tasks(self, status=None) -> list:
        """Return tasks sorted by descending priority. Filter by status if given."""
        ...
`;

const LRU_STARTER_S1 = `\
from collections import OrderedDict

class LRUCache(LRUCacheBase):
    def __init__(self, capacity: int):
        self.capacity = capacity
        # Hint: use OrderedDict — move_to_end() + popitem(last=False) = O(1)

    def get(self, key: int) -> int:
        pass

    def put(self, key: int, value: int) -> None:
        pass
`;

const LRU_STARTER_S2 = `\
from collections import OrderedDict
import time

class LRUCache(LRUCacheBase):
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()  # key → value

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
            self.cache[key] = value
        else:
            if len(self.cache) >= self.capacity:
                self.cache.popitem(last=False)
            self.cache[key] = value

    def get_with_ttl(self, key: int) -> int:
        # TODO: check expiry, return -1 if expired
        pass

    def put_with_ttl(self, key: int, value: int, ttl: float) -> None:
        # TODO: store (value, expiry) pair
        pass
`;

const LRU_STARTER_S3 = `\
from collections import OrderedDict
import heapq, time

class LRUCache(LRUCacheBase):
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()
        self.ttl_cache = OrderedDict()  # key → (value, expiry)

    def get(self, key: int) -> int:
        if key not in self.cache: return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
            self.cache[key] = value
        else:
            if len(self.cache) >= self.capacity:
                self.cache.popitem(last=False)
            self.cache[key] = value

    def get_with_ttl(self, key: int) -> int:
        if key not in self.ttl_cache: return -1
        value, expiry = self.ttl_cache[key]
        if time.time() > expiry:
            del self.ttl_cache[key]
            return -1
        self.ttl_cache.move_to_end(key)
        return value

    def put_with_ttl(self, key: int, value: int, ttl: float) -> None:
        expiry = time.time() + ttl
        if key in self.ttl_cache:
            self.ttl_cache.move_to_end(key)
        elif len(self.ttl_cache) >= self.capacity:
            self.ttl_cache.popitem(last=False)
        self.ttl_cache[key] = (value, expiry)

class Task:
    def __init__(self, task_id, description, priority):
        self.task_id = task_id
        self.description = description
        self.priority = priority
        self.status = "pending"

class TaskManager(TaskManagerBase):
    def __init__(self):
        self.tasks = {}
        self.pq = []

    def add_task(self, task_id: str, description: str, priority: int) -> bool:
        # TODO: add task, push to heap
        pass

    def get_task(self, task_id: str):
        return self.tasks.get(task_id)

    def complete_task(self, task_id: str) -> bool:
        # TODO: mark task complete
        pass

    def get_highest_priority(self):
        # TODO: lazy deletion from heap
        pass

    def list_tasks(self, status=None) -> list:
        # TODO: return sorted by descending priority
        pass
`;

const LRU_SOL_S1 = `\
from collections import OrderedDict

class LRUCache(LRUCacheBase):
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self.cache: return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
            self.cache[key] = value
        else:
            if len(self.cache) >= self.capacity:
                self.cache.popitem(last=False)
            self.cache[key] = value
`;

const LRU_SOL_S2 = `\
from collections import OrderedDict
import time

class LRUCache(LRUCacheBase):
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()
        self.ttl_cache = OrderedDict()  # key → (value, expiry)

    def get(self, key: int) -> int:
        if key not in self.cache: return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
            self.cache[key] = value
        else:
            if len(self.cache) >= self.capacity:
                self.cache.popitem(last=False)
            self.cache[key] = value

    def get_with_ttl(self, key: int) -> int:
        if key not in self.ttl_cache: return -1
        value, expiry = self.ttl_cache[key]
        if time.time() > expiry:
            del self.ttl_cache[key]
            return -1
        self.ttl_cache.move_to_end(key)
        return value

    def put_with_ttl(self, key: int, value: int, ttl: float) -> None:
        expiry = time.time() + ttl
        if key in self.ttl_cache:
            self.ttl_cache.move_to_end(key)
        elif len(self.ttl_cache) >= self.capacity:
            self.ttl_cache.popitem(last=False)
        self.ttl_cache[key] = (value, expiry)
`;

const LRU_SOL_S3 = LRU_SOL_S2 + `

class Task:
    def __init__(self, task_id, description, priority):
        self.task_id = task_id
        self.description = description
        self.priority = priority
        self.status = "pending"

class TaskManager(TaskManagerBase):
    def __init__(self):
        self.tasks = {}
        self.pq = []  # (-priority, task_id)

    def add_task(self, task_id: str, description: str, priority: int) -> bool:
        if task_id in self.tasks: return False
        task = Task(task_id, description, priority)
        self.tasks[task_id] = task
        import heapq
        heapq.heappush(self.pq, (-priority, task_id))
        return True

    def get_task(self, task_id: str):
        return self.tasks.get(task_id)

    def complete_task(self, task_id: str) -> bool:
        task = self.tasks.get(task_id)
        if not task or task.status == "complete": return False
        task.status = "complete"
        return True

    def get_highest_priority(self):
        import heapq
        while self.pq:
            neg_pri, task_id = self.pq[0]
            task = self.tasks.get(task_id)
            if task and task.status == "pending":
                return task
            heapq.heappop(self.pq)
        return None

    def list_tasks(self, status=None) -> list:
        tasks = list(self.tasks.values())
        if status:
            tasks = [t for t in tasks if t.status == status]
        tasks.sort(key=lambda t: -t.priority)
        return tasks
`;

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════════════

export async function runStagedSeed() {
  // ── 3. Rate Limiter ─────────────────────────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 3001,
      slug: "rate-limiter",
      title: "Rate Limiter",
      difficulty: "Medium",
      tags: "design,sliding-window,threading",
      description: `## Rate Limiter\n\n**Difficulty:** Medium | **Type:** Systems / Design\n\nImplement a per-user rate limiter that allows at most **N requests per T seconds** per user.\n\n### Stage 1: Sliding Window Log\n\nImplement \`allow_request(user_id)\` using a sliding window. At most \`max_requests\` calls per \`window_seconds\` per user.\n\n**Key insight:** Use a \`deque\` of timestamps per user. On each call, prune expired timestamps, then check count.\n\n### Stage 2: Memory Cleanup\n\nAdd \`cleanup()\` that removes users with no recent requests and returns the count removed.\n\n### Stage 3: Thread Safety\n\nAdd \`allow_request_thread_safe(user_id)\` that uses per-user locking to prevent race conditions.\n\n**Follow-up discussion:** Distributed rate limiting with Redis + Lua scripts for atomic sliding window.`,
      starterCode: RATE_LIMITER_STARTER_S1,
    },
    [
      {
        stageNumber: 1,
        title: "Sliding Window",
        description: `## Stage 1: Sliding Window Rate Limiter\n\nImplement \`allow_request(user_id: str) -> bool\`.\n\nAllow at most \`max_requests\` requests per \`window_seconds\` per user.\n\n**Approach:** Keep a \`deque\` of timestamps per user. On each call:\n1. Prune timestamps older than \`now - window_seconds\`\n2. If count < max_requests: append timestamp, return True\n3. Otherwise: return False\n\n**Why deque?** \`popleft()\` is O(1). \`list.pop(0)\` is O(n).\n\n\`\`\`python\nrl = RateLimiter(max_requests=3, window_seconds=1.0)\nrl.allow_request("alice")  # True\nrl.allow_request("alice")  # True\nrl.allow_request("alice")  # True\nrl.allow_request("alice")  # False — limit reached\n\`\`\``,
        baseClass: RATE_LIMITER_BASE_S1,
        starterCode: RATE_LIMITER_STARTER_S1,
        solution: RATE_LIMITER_SOL_S1,
        solutionExplanation: "Use a defaultdict(deque) mapping user_id to timestamps. On each request, prune entries older than window_seconds, then check if count < max_requests.",
        testCases: [
          {
            description: "Basic allow/deny within window",
            inputData: `import time\nrl = RateLimiter(max_requests=3, window_seconds=60.0)\n_result = [rl.allow_request("alice") for _ in range(4)]`,
            expectedOutput: "[true, true, true, false]",
            orderIndex: 0,
          },
          {
            description: "Different users have independent limits",
            inputData: `import time\nrl = RateLimiter(max_requests=2, window_seconds=60.0)\n_result = [rl.allow_request("alice"), rl.allow_request("alice"), rl.allow_request("alice"), rl.allow_request("bob")]`,
            expectedOutput: "[true, true, false, true]",
            orderIndex: 1,
          },
          {
            description: "Single request always allowed",
            inputData: `rl = RateLimiter(max_requests=1, window_seconds=60.0)\n_result = [rl.allow_request("x"), rl.allow_request("x")]`,
            expectedOutput: "[true, false]",
            orderIndex: 2,
          },
        ],
      },
      {
        stageNumber: 2,
        title: "Memory Cleanup",
        description: `## Stage 2: Memory Cleanup\n\nAdd \`cleanup() -> int\` that removes users with no recent requests and returns the count removed.\n\n**Why this matters:** A long-running service accumulates state for departed users. Cleanup prevents unbounded memory growth.\n\n**Implementation:** Iterate over all users. For each, prune expired timestamps. If the deque is empty, delete the entry and increment the counter.\n\n\`\`\`python\nrl = RateLimiter(max_requests=5, window_seconds=0.001)  # 1ms window\nrl.allow_request("alice")\nrl.allow_request("bob")\ntime.sleep(0.01)  # window expires\nprint(rl.cleanup())  # 2\n\`\`\``,
        baseClass: RATE_LIMITER_BASE_S2,
        starterCode: RATE_LIMITER_STARTER_S2,
        solution: RATE_LIMITER_SOL_S2,
        solutionExplanation: "Iterate over all user keys, prune expired timestamps, delete empty entries, and return the count removed.",
        testCases: [
          {
            description: "Cleanup removes expired users",
            inputData: `import time\nrl = RateLimiter(max_requests=5, window_seconds=0.001)\nrl.allow_request("alice")\nrl.allow_request("bob")\ntime.sleep(0.05)\ncount = rl.cleanup()\n_result = count >= 2`,
            expectedOutput: "true",
            orderIndex: 0,
          },
          {
            description: "Cleanup returns 0 when no users expired",
            inputData: `rl = RateLimiter(max_requests=5, window_seconds=60.0)\nrl.allow_request("alice")\n_result = rl.cleanup()`,
            expectedOutput: "0",
            orderIndex: 1,
          },
        ],
      },
      {
        stageNumber: 3,
        title: "Thread Safety",
        description: `## Stage 3: Thread-Safe Rate Limiter\n\nAdd \`allow_request_thread_safe(user_id: str) -> bool\` that uses per-user locking.\n\n**Why per-user locks?** A single global lock serializes all users. Per-user locks allow Alice and Bob to be checked concurrently.\n\n**Pattern:**\n1. Lazily create a \`threading.Lock\` per user (protected by a global lock for creation)\n2. Acquire the user lock before reading/writing the timestamps deque\n\n\`\`\`python\nimport threading\nrl = RateLimiter(max_requests=100, window_seconds=1.0)\nthreads = [threading.Thread(target=rl.allow_request_thread_safe, args=("alice",)) for _ in range(50)]\nfor t in threads: t.start()\nfor t in threads: t.join()\n\`\`\``,
        baseClass: RATE_LIMITER_BASE_S3,
        starterCode: RATE_LIMITER_STARTER_S3,
        solution: RATE_LIMITER_SOL_S3,
        solutionExplanation: "Use a global lock to lazily create per-user locks. The allow_request_thread_safe method acquires the user lock before accessing the timestamps deque.",
        testCases: [
          {
            description: "Thread-safe version respects limits under concurrency",
            inputData: `import threading\nrl = RateLimiter(max_requests=50, window_seconds=60.0)\nresults = []\nlock = threading.Lock()\ndef req():\n    r = rl.allow_request_thread_safe("alice")\n    with lock: results.append(r)\nthreads = [threading.Thread(target=req) for _ in range(60)]\nfor t in threads: t.start()\nfor t in threads: t.join()\n_result = [results.count(True) == 50, results.count(False) == 10]`,
            expectedOutput: "[true, true]",
            orderIndex: 0,
          },
          {
            description: "Thread-safe allows independent users concurrently",
            inputData: `import threading\nrl = RateLimiter(max_requests=1, window_seconds=60.0)\nresults = {}\nlock = threading.Lock()\ndef req(uid):\n    r = rl.allow_request_thread_safe(uid)\n    with lock: results[uid] = r\nthreads = [threading.Thread(target=req, args=(f"user{i}",)) for i in range(5)]\nfor t in threads: t.start()\nfor t in threads: t.join()\n_result = all(results.values())`,
            expectedOutput: "true",
            orderIndex: 1,
          },
        ],
      },
    ]
  );

  // ── 4. Duplicate File Finder ────────────────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 4001,
      slug: "duplicate-file-finder",
      title: "Duplicate File Finder",
      difficulty: "Medium",
      tags: "hashing,optimization,filesystem",
      description: `## Duplicate File Finder\n\n**Difficulty:** Medium | **Type:** Systems / Optimization\n\nFind all groups of files with identical content in a directory tree.\n\n### Stage 1: Hash-Based Finder\n\nWalk the directory tree, compute MD5 hash of each file, group by hash.\n\n### Stage 2: 3-Pass Optimized\n\nFor multi-GB files, reading everything is wasteful. Implement a 3-pass approach:\n- **Pass 1:** Group by file size (zero I/O — just stat())\n- **Pass 2:** Partial hash (first + middle + last 4KB)\n- **Pass 3:** Full hash only for remaining candidates\n\n**I/O savings:** 1000 files × 2GB = 2TB naive. With 3-pass: ~20GB (100x reduction).`,
      starterCode: DUP_STARTER_S1,
    },
    [
      {
        stageNumber: 1,
        title: "Hash-Based Finder",
        description: `## Stage 1: Hash-Based Duplicate Finder\n\nImplement \`find_duplicates(root_dir: str) -> List[List[str]]\`.\n\nWalk the directory tree with \`os.walk\`. For each file, compute its MD5 hash. Group files by hash. Return groups with 2+ files.\n\n\`\`\`python\n# Given:\n# /tmp/test/a.txt  (content: "hello")\n# /tmp/test/b.txt  (content: "hello")\n# /tmp/test/c.txt  (content: "world")\nfinder = DuplicateFinder()\ngroups = finder.find_duplicates("/tmp/test")\n# groups = [[\"/tmp/test/a.txt\", \"/tmp/test/b.txt\"]]\n\`\`\``,
        baseClass: DUP_BASE_S1,
        starterCode: DUP_STARTER_S1,
        solution: DUP_SOL_S1,
        solutionExplanation: "Use defaultdict(list) keyed by MD5 hash. Walk with os.walk, hash each file in 8KB chunks, then return groups with len >= 2.",
        testCases: [
          {
            description: "Finds duplicate files in a temp directory",
            inputData: `import os, tempfile\nwith tempfile.TemporaryDirectory() as d:\n    for name, content in [("a.txt","hello"),("b.txt","hello"),("c.txt","world")]:\n        open(os.path.join(d, name), "w").write(content)\n    finder = DuplicateFinder()\n    groups = finder.find_duplicates(d)\n    _result = [sorted([os.path.basename(p) for p in g]) for g in groups]`,
            expectedOutput: `[["a.txt", "b.txt"]]`,
            orderIndex: 0,
          },
          {
            description: "Returns empty list when no duplicates",
            inputData: `import os, tempfile\nwith tempfile.TemporaryDirectory() as d:\n    for name, content in [("a.txt","aaa"),("b.txt","bbb"),("c.txt","ccc")]:\n        open(os.path.join(d, name), "w").write(content)\n    finder = DuplicateFinder()\n    _result = finder.find_duplicates(d)`,
            expectedOutput: `[]`,
            orderIndex: 1,
          },
          {
            description: "Handles multiple duplicate groups",
            inputData: `import os, tempfile\nwith tempfile.TemporaryDirectory() as d:\n    for name, content in [("a.txt","x"),("b.txt","x"),("c.txt","y"),("e.txt","y")]:\n        open(os.path.join(d, name), "w").write(content)\n    finder = DuplicateFinder()\n    groups = finder.find_duplicates(d)\n    _result = sorted([sorted([os.path.basename(p) for p in g]) for g in groups])`,
            expectedOutput: `[["a.txt", "b.txt"], ["c.txt", "e.txt"]]`,
            orderIndex: 2,
          },
        ],
      },
      {
        stageNumber: 2,
        title: "3-Pass Optimized",
        description: `## Stage 2: 3-Pass Optimized Finder\n\nAdd \`find_duplicates_optimized(root_dir)\` that avoids reading large files unnecessarily.\n\n**Pass 1:** Group by file size using \`os.path.getsize()\` — zero I/O.\n**Pass 2:** For size-matched groups, read first + middle + last 4KB for a partial hash.\n**Pass 3:** Full hash only for partial-hash matches.\n\n**Narrate the savings:** "1000 files × 2GB = 2TB naive. Pass 1: 0 bytes. Pass 2: 1.2MB. Pass 3: 20GB. That's 100x."`,
        baseClass: DUP_BASE_S2,
        starterCode: DUP_STARTER_S2,
        solution: DUP_SOL_S2,
        solutionExplanation: "Three-pass filter: size grouping (stat only), partial hash (12KB per file), full hash (only for partial matches). Narrate I/O savings.",
        testCases: [
          {
            description: "Optimized finder returns same results as basic",
            inputData: `import os, tempfile\nwith tempfile.TemporaryDirectory() as d:\n    for name, content in [("a.txt","hello"),("b.txt","hello"),("c.txt","world")]:\n        open(os.path.join(d, name), "w").write(content)\n    finder = DuplicateFinder()\n    g1 = sorted([sorted([os.path.basename(p) for p in g]) for g in finder.find_duplicates(d)])\n    g2 = sorted([sorted([os.path.basename(p) for p in g]) for g in finder.find_duplicates_optimized(d)])\n    _result = [g1, g2]`,
            expectedOutput: `[[["a.txt", "b.txt"]], [["a.txt", "b.txt"]]]`,
            orderIndex: 0,
          },
          {
            description: "Optimized handles no duplicates",
            inputData: `import os, tempfile\nwith tempfile.TemporaryDirectory() as d:\n    for name, content in [("a.txt","aaa"),("b.txt","bbb")]:\n        open(os.path.join(d, name), "w").write(content)\n    finder = DuplicateFinder()\n    _result = finder.find_duplicates_optimized(d)`,
            expectedOutput: `[]`,
            orderIndex: 1,
          },
        ],
      },
    ]
  );

  // ── 5. Stack Trace Profiler ─────────────────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 5001,
      slug: "stack-trace-profiler",
      title: "Stack Trace Profiler",
      difficulty: "Hard",
      tags: "stack,diffing,profiling",
      description: `## Stack Trace Profiler\n\n**Difficulty:** Hard | **Type:** Algorithms / Diffing\n\nA sampling profiler takes periodic snapshots of the call stack. Convert these snapshots into start/end trace events.\n\n### TraceEvent fields\n\n- \`timestamp\` — the snapshot index (0-based) at which the event occurs\n- \`function\` — the name of the function\n- \`depth\` — the 0-based position in the stack (0 = outermost/bottom frame, higher = deeper/inner)\n- \`event_type\` — \`"start"\` when the function enters, \`"end"\` when it exits\n\n### Stage 1: Basic Trace Events\n\nConvert stack snapshots to trace events. Track by **position (depth)**, not name — this handles recursion correctly.\n\n### Stage 2: Denoising Filter\n\nAdd \`convert_with_denoising(snapshots, min_samples=3)\` that filters out functions appearing for fewer than N consecutive samples.\n\n**Key insight:** Track by POSITION, not NAME. This is the core insight that separates pass from fail on recursive inputs.`,
      starterCode: PROFILER_STARTER_S1,
    },
    [
      {
        stageNumber: 1,
        title: "Trace Events",
        description: `## Stage 1: Stack Snapshot → Trace Events\n\nImplement \`convert_to_events(snapshots)\`.\n\nEach snapshot is a list of function names ordered by **depth**: index 0 is the outermost (bottom) frame, higher indices are deeper (inner) frames.\n\n**TraceEvent fields:** \`timestamp\` (snapshot index), \`function\` (name), \`depth\` (0-based position in stack), \`event_type\` ("start" or "end").\n\n**Algorithm:**\n1. Compare consecutive snapshots to find the divergence point (\`common_depth\`)\n2. Emit END events top-down (deepest exits first)\n3. Emit START events bottom-up (shallowest enters first)\n4. After all snapshots, emit END for everything still on the stack\n\n**Critical:** Track by POSITION (depth), not name. Recursive calls to \`solve\` at depth 1 and depth 2 are different events.\n\n\`\`\`\nt=0: ["main", "foo"]        → start main(depth=0, t=0), start foo(depth=1, t=0)\nt=1: ["main", "foo", "bar"] → start bar(depth=2, t=1)\nt=2: ["main", "foo"]        → end bar(depth=2, t=2)\nt=3: []                     → end foo(depth=1, t=3), end main(depth=0, t=3)\n\`\`\``,
        baseClass: PROFILER_BASE_S1,
        starterCode: PROFILER_STARTER_S1,
        solution: PROFILER_SOL_S1,
        solutionExplanation: "Find divergence point between consecutive stacks. Emit ENDs top-down, STARTs bottom-up. After all snapshots, close remaining frames.",
        testCases: [
          {
            description: "Basic trace: start and end events",
            inputData: `p = Profiler()\nevents = p.convert_to_events([["main", "foo"], ["main", "foo", "bar"], ["main", "foo"], []])\n_result = [[e.function, e.depth, e.event_type, e.timestamp] for e in events]`,
            expectedOutput: `[["main", 0, "start", 0], ["foo", 1, "start", 0], ["bar", 2, "start", 1], ["bar", 2, "end", 2], ["foo", 1, "end", 3], ["main", 0, "end", 3]]`,
            orderIndex: 0,
          },
          {
            description: "Recursive calls tracked by position",
            inputData: `p = Profiler()\nevents = p.convert_to_events([["main", "solve"], ["main", "solve", "solve"], ["main", "solve"], []])\n_result = [[e.function, e.depth, e.event_type, e.timestamp] for e in events]`,
            expectedOutput: `[["main", 0, "start", 0], ["solve", 1, "start", 0], ["solve", 2, "start", 1], ["solve", 2, "end", 2], ["solve", 1, "end", 3], ["main", 0, "end", 3]]`,
            orderIndex: 1,
          },
          {
            description: "Empty snapshots returns empty list",
            inputData: `p = Profiler()\n_result = p.convert_to_events([])`,
            expectedOutput: `[]`,
            orderIndex: 2,
          },
          {
            description: "Mid-stream stack swap emits end then start at same depth",
            inputData: `p = Profiler()\nevents = p.convert_to_events([["main", "foo"], ["main", "bar"], []])\n_result = [[e.function, e.depth, e.event_type, e.timestamp] for e in events]`,
            expectedOutput: "[('main', 0, 'start', 0), ('foo', 1, 'start', 0), ('foo', 1, 'end', 1), ('bar', 1, 'start', 1), ('bar', 1, 'end', 2), ('main', 0, 'end', 2)]",
            orderIndex: 3,
          },
        ],
      },
      {
        stageNumber: 2,
        title: "Denoising Filter",
        description: `## Stage 2: Denoising Filter\n\nAdd \`convert_with_denoising(snapshots, min_samples=3)\`.\n\nA sampling profiler has noise: functions that appear for only 1–2 samples are likely not real work. Filter them out.\n\n**Algorithm:**\n- For each depth, find runs of the same function\n- Only emit events for runs of length >= min_samples\n- Sort final events by (timestamp, end-before-start, depth)\n\n\`\`\`\nsnapshots = [["main"], ["main"], ["main", "noise"], ["main"], ["main"]]\n# "noise" appears only once at depth 1 → filtered out with min_samples=2\n\`\`\``,
        baseClass: PROFILER_BASE_S2,
        starterCode: PROFILER_STARTER_S2,
        solution: PROFILER_SOL_S2,
        solutionExplanation: "For each depth, scan for runs of the same function. Only emit start/end for runs >= min_samples. Sort by (timestamp, end-before-start, depth).",
        testCases: [
          {
            description: "Denoising filters short-lived functions",
            inputData: `p = Profiler()\nsnaps = [["main"]] * 5 + [["main", "noise"]] + [["main"]] * 5\nevents = p.convert_with_denoising(snaps, min_samples=3)\n_result = [[e.function, e.depth, e.event_type, e.timestamp] for e in events]`,
            expectedOutput: `[["main", 0, "start", 0], ["main", 0, "end", 11]]`,
            orderIndex: 0,
          },
          {
            description: "Denoising keeps long-lived functions",
            inputData: `p = Profiler()\nsnaps = [["main", "worker"]] * 5\nevents = p.convert_with_denoising(snaps, min_samples=3)\n_result = [[e.function, e.depth, e.event_type, e.timestamp] for e in events]`,
            expectedOutput: `[["main", 0, "start", 0], ["worker", 1, "start", 0], ["main", 0, "end", 5], ["worker", 1, "end", 5]]`,
            orderIndex: 1,
          },
        ],
      },
    ]
  );

  // ── 6. Greedy Tokenizer ─────────────────────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 6001,
      slug: "greedy-tokenizer",
      title: "Greedy Tokenizer",
      difficulty: "Medium",
      tags: "trie,strings,nlp",
      description: `## Greedy Tokenizer\n\n**Difficulty:** Medium | **Type:** Algorithms / Strings\n\nImplement greedy longest-match tokenization — the inference step of BPE/WordPiece tokenizers.\n\n### Stage 1: Set Lookup\n\nAt each position, try lengths from max_len down to 1. Take the longest match. If nothing matches, emit the single character.\n\n### Stage 2: Trie Optimization\n\nFor 100K+ vocab entries, set lookup creates O(n × M) substrings. A Trie avoids substring creation and terminates early. O(n × L) where L = actual match length.`,
      starterCode: TOKENIZER_STARTER_S1,
    },
    [
      {
        stageNumber: 1,
        title: "Set Lookup",
        description: `## Stage 1: Greedy Tokenizer (Set Lookup)\n\nImplement \`tokenize(text, vocab) -> List[str]\`.\n\nAt each position i:\n1. Try lengths from \`max(len(w) for w in vocab)\` down to 1\n2. If \`text[i:i+length]\` is in vocab, emit it and advance i by length\n3. If nothing matches, emit \`text[i]\` and advance by 1\n\n\`\`\`python\nvocab = {"the", "there", "he", "her", "here", "red"}\ntokenize("theredhered", vocab)\n# → ["there", "d", "here", "d"]\n# At pos 0: "there" (5) beats "the" (3)\n# At pos 6: "here" (4) beats "her" (3)\n\`\`\``,
        baseClass: TOKENIZER_BASE_S1,
        starterCode: TOKENIZER_STARTER_S1,
        solution: TOKENIZER_SOL_S1,
        solutionExplanation: "Greedy longest-match: at each position try decreasing lengths. First match wins. Unknown chars emitted as single characters.",
        testCases: [
          {
            description: "Basic tokenization with longest-match preference",
            inputData: `t = Tokenizer()\nvocab = {"the", "there", "he", "her", "here", "red"}\n_result = t.tokenize("theredhered", vocab)`,
            expectedOutput: `["there", "d", "here", "d"]`,
            orderIndex: 0,
          },
          {
            description: "Unknown characters emitted as single chars",
            inputData: `t = Tokenizer()\nvocab = {"ab", "cd"}\n_result = t.tokenize("abxcd", vocab)`,
            expectedOutput: `["ab", "x", "cd"]`,
            orderIndex: 1,
          },
          {
            description: "Empty text returns empty list",
            inputData: `t = Tokenizer()\n_result = t.tokenize("", {"a", "b"})`,
            expectedOutput: `[]`,
            orderIndex: 2,
          },
        ],
      },
      {
        stageNumber: 2,
        title: "Trie Optimization",
        description: `## Stage 2: Trie-Based Tokenizer\n\nAdd \`tokenize_trie(text, vocab)\` using a Trie for O(n × L) performance.\n\n**Why Trie?** Set lookup creates a new substring object for every candidate. Trie walks character by character — no substring allocation, early termination when no prefix matches.\n\n**Trie structure:**\n- Each node has \`children: dict\`, \`is_end: bool\`, \`word\`\n- \`insert(word)\`: walk/create nodes for each char, mark end\n- \`longest_match(text, start)\`: walk from start, track last \`is_end\` position\n\n**Don't stop at first match** — keep walking to find the *longest* one.`,
        baseClass: TOKENIZER_BASE_S2,
        starterCode: TOKENIZER_STARTER_S2,
        solution: TOKENIZER_SOL_S2,
        solutionExplanation: "Build Trie from vocab. At each position, walk the trie character by character, tracking the last is_end position (longest match). No substring allocation.",
        testCases: [
          {
            description: "Trie tokenizer matches set tokenizer output",
            inputData: `t = Tokenizer()\nvocab = {"the", "there", "he", "her", "here", "red"}\n_result = t.tokenize_trie("theredhered", vocab)`,
            expectedOutput: `["there", "d", "here", "d"]`,
            orderIndex: 0,
          },
          {
            description: "Trie handles unknown chars",
            inputData: `t = Tokenizer()\nvocab = {"ab", "cd"}\n_result = t.tokenize_trie("abxcd", vocab)`,
            expectedOutput: `["ab", "x", "cd"]`,
            orderIndex: 1,
          },
        ],
      },
    ]
  );

  // ── 7. Count Smaller to the Right ──────────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 7001,
      slug: "count-smaller-to-right",
      title: "Count Smaller to the Right",
      difficulty: "Hard",
      tags: "sorting,fenwick-tree,bisect",
      description: `## Count Smaller to the Right\n\n**Difficulty:** Hard | **Type:** Algorithms / Classic\n\nFor each element in an array, count how many elements to its right are strictly smaller.\n\n\`\`\`\n[5, 2, 6, 1] → [2, 1, 1, 0]\n5: two smaller to right (2, 1)\n2: one smaller (1)\n6: one smaller (1)\n1: zero\n\`\`\`\n\n### Stage 1: Brute Force O(n²)\n\nFor each i, count j > i where nums[j] < nums[i].\n\n### Stage 2: O(n log n) with Bisect\n\nProcess right to left, maintaining a sorted list. Use \`bisect_left\` to count elements smaller than current.`,
      starterCode: SMALLER_STARTER_S1,
    },
    [
      {
        stageNumber: 1,
        title: "Brute Force",
        description: `## Stage 1: Brute Force O(n²)\n\nImplement \`count_smaller(nums) -> List[int]\`.\n\nFor each index i, count the number of elements at indices j > i where nums[j] < nums[i].\n\n\`\`\`python\ncount_smaller([5, 2, 6, 1])  # → [2, 1, 1, 0]\n\`\`\`\n\n**Start here** — 30 seconds, shows understanding. The interviewer will ask "can you do better?"`,
        baseClass: SMALLER_BASE_S1,
        starterCode: SMALLER_STARTER_S1,
        solution: SMALLER_SOL_S1,
        solutionExplanation: "Two nested loops: for each i, iterate j from i+1 to n-1, increment result[i] when nums[j] < nums[i]. O(n²) time, O(n) space.",
        testCases: [
          {
            description: "Basic example from problem statement",
            inputData: `s = CountSmaller()\n_result = s.count_smaller([5, 2, 6, 1])`,
            expectedOutput: `[2, 1, 1, 0]`,
            orderIndex: 0,
          },
          {
            description: "Sorted ascending — all zeros",
            inputData: `s = CountSmaller()\n_result = s.count_smaller([1, 2, 3, 4])`,
            expectedOutput: `[0, 0, 0, 0]`,
            orderIndex: 1,
          },
          {
            description: "Sorted descending — count all right elements",
            inputData: `s = CountSmaller()\n_result = s.count_smaller([4, 3, 2, 1])`,
            expectedOutput: `[3, 2, 1, 0]`,
            orderIndex: 2,
          },
          {
            description: "Single element",
            inputData: `s = CountSmaller()\n_result = s.count_smaller([42])`,
            expectedOutput: `[0]`,
            orderIndex: 3,
          },
        ],
      },
      {
        stageNumber: 2,
        title: "O(n log n) Bisect",
        description: `## Stage 2: O(n log n) with Bisect\n\nAdd \`count_smaller_efficient(nums) -> List[int]\`.\n\n**Approach:** Process right to left, maintaining a sorted list of elements seen so far.\n\n1. For each element (right to left), \`bisect_left(sorted_right, nums[i])\` gives the count of elements strictly smaller\n2. Insert nums[i] into sorted_right with \`bisect.insort\`\n\n\`\`\`python\nimport bisect\nsorted_right = []\nfor i in range(n-1, -1, -1):\n    pos = bisect.bisect_left(sorted_right, nums[i])  # count smaller\n    result[i] = pos\n    bisect.insort(sorted_right, nums[i])\n\`\`\`\n\n**Note:** \`bisect.insort\` is O(n) due to list shifting, so worst case is still O(n²). Mention Fenwick tree for true O(n log n).`,
        baseClass: SMALLER_BASE_S2,
        starterCode: SMALLER_STARTER_S2,
        solution: SMALLER_SOL_S2,
        solutionExplanation: "Process right to left. bisect_left on a sorted suffix gives count of smaller elements. insort maintains sorted order. O(n log n) average.",
        testCases: [
          {
            description: "Efficient version matches brute force",
            inputData: `s = CountSmaller()\n_result = s.count_smaller_efficient([5, 2, 6, 1])`,
            expectedOutput: `[2, 1, 1, 0]`,
            orderIndex: 0,
          },
          {
            description: "Sorted ascending",
            inputData: `s = CountSmaller()\n_result = s.count_smaller_efficient([1, 2, 3, 4])`,
            expectedOutput: `[0, 0, 0, 0]`,
            orderIndex: 1,
          },
          {
            description: "Sorted descending",
            inputData: `s = CountSmaller()\n_result = s.count_smaller_efficient([4, 3, 2, 1])`,
            expectedOutput: `[3, 2, 1, 0]`,
            orderIndex: 2,
          },
        ],
      },
    ]
  );

  // ── 8. In-Memory Database ───────────────────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 8001,
      slug: "in-memory-database",
      title: "In-Memory Database",
      difficulty: "Medium",
      tags: "design,dict,transactions",
      description: `## In-Memory Database\n\n**Difficulty:** Medium | **Type:** Systems / Progressive\n\nBuild a progressive in-memory key-value database. Each stage adds new capabilities.\n\n### Stage 1: Basic CRUD\nSET, GET, DELETE, COUNT.\n\n### Stage 2: Modification Tracking\nHISTORY (all timestamps for a key), MODIFIED_SINCE.\n\n### Stage 3: Record Locking\nLOCK/UNLOCK — SET/DELETE require the caller to hold the lock.\n\n### Stage 4: Transactions\nBEGIN/COMMIT/ROLLBACK — undo log pattern.\n\n**Key insight:** Don't refactor between levels. Each level should be ~10 lines added to the existing class.`,
      starterCode: DB_STARTER_S1,
    },
    [
      {
        stageNumber: 1,
        title: "Basic CRUD",
        description: `## Stage 1: Basic CRUD\n\nImplement \`set\`, \`get\`, \`delete\`, \`count\`.\n\n**Level 1 is literally a dict.** \`data = {}\` — that's your database.\n\n\`\`\`python\ndb = InMemoryDatabase()\ndb.set("x", 42)\nprint(db.get("x"))     # 42\nprint(db.count())      # 1\nprint(db.delete("x"))  # True\nprint(db.get("x"))     # None\nprint(db.count())      # 0\n\`\`\``,
        baseClass: DB_BASE_S1,
        starterCode: DB_STARTER_S1,
        solution: DB_SOL_S1,
        solutionExplanation: "Level 1 is a dict. set/get/delete/count are direct dict operations. Add history_log and _clock for future stages.",
        testCases: [
          {
            description: "Basic set/get/delete/count",
            inputData: `db = InMemoryDatabase()\ndb.set("x", 42)\n_result = [db.get("x"), db.count(), db.delete("x"), db.get("x"), db.count()]`,
            expectedOutput: `[42, 1, true, null, 0]`,
            orderIndex: 0,
          },
          {
            description: "Delete non-existent key returns False",
            inputData: `db = InMemoryDatabase()\n_result = db.delete("missing")`,
            expectedOutput: `false`,
            orderIndex: 1,
          },
          {
            description: "Overwrite existing key",
            inputData: `db = InMemoryDatabase()\ndb.set("k", "v1")\ndb.set("k", "v2")\n_result = [db.get("k"), db.count()]`,
            expectedOutput: `["v2", 1]`,
            orderIndex: 2,
          },
        ],
      },
      {
        stageNumber: 2,
        title: "Modification Tracking",
        description: `## Stage 2: Modification Tracking\n\nAdd \`history(key)\` and \`modified_since(timestamp)\`.\n\n**Timestamps:** Use a monotonic counter (\`_clock\`), not \`time.time()\`. Deterministic, testable, no clock skew.\n\n\`\`\`python\ndb = InMemoryDatabase()\ndb.set("x", 1)  # ts=1\ndb.set("x", 2)  # ts=2\ndb.history("x")  # [(1, 1), (2, 2)]\ndb.modified_since(1)  # ["x"]  (modified at ts=2 > 1)\n\`\`\``,
        baseClass: DB_BASE_S2,
        starterCode: DB_STARTER_S2,
        solution: DB_SOL_S1,
        solutionExplanation: "history_log maps key to list of (timestamp, value). _tick() increments _clock. modified_since scans history_log for entries with ts > timestamp.",
        testCases: [
          {
            description: "History tracks all values",
            inputData: `db = InMemoryDatabase()\ndb.set("x", 1)\ndb.set("x", 2)\ndb.set("x", 3)\nh = db.history("x")\n_result = [len(h) == 3, [v for _, v in h] == [1, 2, 3]]`,
            expectedOutput: `[true, true]`,
            orderIndex: 0,
          },
          {
            description: "modified_since returns correct keys",
            inputData: `db = InMemoryDatabase()\ndb.set("a", 1)\ndb.set("b", 2)\nresult = db.modified_since(1)\n_result = ["b" in result, "a" not in result]`,
            expectedOutput: `[true, true]`,
            orderIndex: 1,
          },
        ],
      },
      {
        stageNumber: 3,
        title: "Record Locking",
        description: `## Stage 3: Record Locking\n\nAdd \`lock(key, caller_id)\` and \`unlock(key, caller_id)\`.\n\nOnce locked, only the holder can SET or DELETE that key.\n\n**Implementation:** \`locks = {key: caller_id}\`. Two lines at the top of SET/DELETE.\n\n\`\`\`python\ndb = InMemoryDatabase()\ndb.set("x", 1)\ndb.lock("x", "alice")\nprint(db.set("x", 2, caller_id="bob"))    # False — locked by alice\nprint(db.set("x", 2, caller_id="alice"))  # True\ndb.unlock("x", "alice")\nprint(db.set("x", 3))  # True — unlocked\n\`\`\``,
        baseClass: DB_BASE_S3,
        starterCode: DB_STARTER_S3,
        solution: DB_SOL_S1,
        solutionExplanation: "locks dict maps key to caller_id. SET/DELETE check if key is locked and caller doesn't match. lock() is idempotent for same caller. unlock() requires matching caller.",
        testCases: [
          {
            description: "Lock prevents write by other caller",
            inputData: `db = InMemoryDatabase()\ndb.set("x", 1)\ndb.lock("x", "alice")\n_result = [db.set("x", 2, caller_id="bob"), db.get("x")]`,
            expectedOutput: `[false, 1]`,
            orderIndex: 0,
          },
          {
            description: "Lock holder can write",
            inputData: `db = InMemoryDatabase()\ndb.set("x", 1)\ndb.lock("x", "alice")\n_result = [db.set("x", 99, caller_id="alice"), db.get("x")]`,
            expectedOutput: `[true, 99]`,
            orderIndex: 1,
          },
          {
            description: "Unlock allows anyone to write",
            inputData: `db = InMemoryDatabase()\ndb.set("x", 1)\ndb.lock("x", "alice")\ndb.unlock("x", "alice")\n_result = [db.set("x", 5), db.get("x")]`,
            expectedOutput: `[true, 5]`,
            orderIndex: 2,
          },
        ],
      },
      {
        stageNumber: 4,
        title: "Transactions",
        description: `## Stage 4: Transactions (Undo Log)\n\nAdd \`begin(caller_id)\`, \`commit(caller_id)\`, \`rollback(caller_id)\`.\n\n**Transactions = undo log.** Before each mutation, record \`(action, key, old_value)\`. Rollback = replay in reverse. Commit = discard the log.\n\n\`\`\`python\ndb = InMemoryDatabase()\ndb.set("x", 1)\ndb.begin("alice")\ndb.set("x", 99, caller_id="alice")\nprint(db.get("x"))      # 99\ndb.rollback("alice")\nprint(db.get("x"))      # 1 — restored!\n\`\`\``,
        baseClass: DB_BASE_S4,
        starterCode: DB_STARTER_S4,
        solution: DB_SOL_S1,
        solutionExplanation: "transactions dict maps caller_id to undo log list. begin() initializes empty list. Each SET/DELETE records (action, key, old_value). rollback() replays in reverse. commit() discards log.",
        testCases: [
          {
            description: "Rollback restores previous value",
            inputData: `db = InMemoryDatabase()\ndb.set("x", 1)\ndb.begin("alice")\ndb.set("x", 99, caller_id="alice")\nbefore = db.get("x")\ndb.rollback("alice")\nafter = db.get("x")\n_result = [before, after]`,
            expectedOutput: `[99, 1]`,
            orderIndex: 0,
          },
          {
            description: "Commit makes changes permanent",
            inputData: `db = InMemoryDatabase()\ndb.set("x", 1)\ndb.begin("alice")\ndb.set("x", 99, caller_id="alice")\ndb.commit("alice")\n_result = [db.get("x"), db.begin("alice")]`,
            expectedOutput: `[99, true]`,
            orderIndex: 1,
          },
          {
            description: "Rollback of delete restores key",
            inputData: `db = InMemoryDatabase()\ndb.set("x", 42)\ndb.begin("bob")\ndb.delete("x", caller_id="bob")\nbefore = db.get("x")\ndb.rollback("bob")\nafter = db.get("x")\n_result = [before, after]`,
            expectedOutput: `[null, 42]`,
            orderIndex: 2,
          },
        ],
      },
    ]
  );

  // ── 9. Bank System ──────────────────────────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 9001,
      slug: "bank-system",
      title: "Bank System",
      difficulty: "Medium",
      tags: "design,union-find,dict",
      description: `## Bank System\n\n**Difficulty:** Medium | **Type:** Systems / Progressive\n\nBuild a progressive banking system. Each stage adds new capabilities.\n\n### Stage 1: Basic Accounts\nCREATE, DEPOSIT, WITHDRAW, BALANCE.\n\n### Stage 2: Transfers\nATOMIC transfer between accounts.\n\n### Stage 3: Account Merging\nMERGE — union-find pattern with path compression.\n\n### Stage 4: Cashback / Rewards\nTOP_SPENDERS, CASHBACK.`,
      starterCode: BANK_STARTER_S1,
    },
    [
      {
        stageNumber: 1,
        title: "Basic Accounts",
        description: `## Stage 1: Basic Accounts\n\nImplement \`create\`, \`deposit\`, \`withdraw\`, \`balance\`.\n\n\`\`\`python\nbank = BankSystem()\nbank.create("alice")\nprint(bank.deposit("alice", 100))   # 100.0\nprint(bank.withdraw("alice", 30))   # 70.0\nprint(bank.withdraw("alice", 100))  # None — insufficient\nprint(bank.balance("alice"))        # 70.0\n\`\`\``,
        baseClass: BANK_BASE_S1,
        starterCode: BANK_STARTER_S1,
        solution: BANK_SOL_S1,
        solutionExplanation: "accounts dict maps id to balance. create checks for duplicates. deposit/withdraw check existence and amount validity. withdraw checks sufficient funds.",
        testCases: [
          {
            description: "Basic deposit and withdraw",
            inputData: `bank = BankSystem()\nbank.create("alice")\n_result = [bank.deposit("alice", 100), bank.withdraw("alice", 30), bank.balance("alice")]`,
            expectedOutput: `[100.0, 70.0, 70.0]`,
            orderIndex: 0,
          },
          {
            description: "Withdraw fails on insufficient funds",
            inputData: `bank = BankSystem()\nbank.create("alice")\nbank.deposit("alice", 50)\n_result = bank.withdraw("alice", 100)`,
            expectedOutput: `null`,
            orderIndex: 1,
          },
          {
            description: "Create duplicate returns False",
            inputData: `bank = BankSystem()\n_result = [bank.create("alice"), bank.create("alice")]`,
            expectedOutput: `[true, false]`,
            orderIndex: 2,
          },
        ],
      },
      {
        stageNumber: 2,
        title: "Transfers",
        description: `## Stage 2: Atomic Transfers\n\nAdd \`transfer(from_id, to_id, amount) -> bool\`.\n\n**Atomicity:** Check funds BEFORE modifying either account. If from_id has insufficient funds, return False without touching to_id.\n\n\`\`\`python\nbank = BankSystem()\nbank.create("alice"); bank.deposit("alice", 100)\nbank.create("bob")\nprint(bank.transfer("alice", "bob", 40))  # True\nprint(bank.balance("alice"))              # 60.0\nprint(bank.balance("bob"))                # 40.0\n\`\`\``,
        baseClass: BANK_BASE_S2,
        starterCode: BANK_STARTER_S2,
        solution: BANK_SOL_S1,
        solutionExplanation: "Check both accounts exist, check sufficient funds, then atomically subtract from source and add to destination. Track total_outgoing for future cashback.",
        testCases: [
          {
            description: "Successful transfer",
            inputData: `bank = BankSystem()\nbank.create("alice"); bank.deposit("alice", 100)\nbank.create("bob"); bank.deposit("bob", 0)\n_result = [bank.transfer("alice", "bob", 40), bank.balance("alice"), bank.balance("bob")]`,
            expectedOutput: `[true, 60.0, 40.0]`,
            orderIndex: 0,
          },
          {
            description: "Transfer fails on insufficient funds",
            inputData: `bank = BankSystem()\nbank.create("alice"); bank.deposit("alice", 10)\nbank.create("bob")\n_result = [bank.transfer("alice", "bob", 50), bank.balance("alice")]`,
            expectedOutput: `[false, 10.0]`,
            orderIndex: 1,
          },
          {
            description: "Transfer fails for unknown account",
            inputData: `bank = BankSystem()\nbank.create("alice"); bank.deposit("alice", 100)\n_result = bank.transfer("alice", "ghost", 10)`,
            expectedOutput: `false`,
            orderIndex: 2,
          },
        ],
      },
      {
        stageNumber: 3,
        title: "Account Merging",
        description: `## Stage 3: Account Merging (Union-Find)\n\nAdd \`merge(source_id, target_id) -> bool\`.\n\nAfter merge:\n- source's balance is added to target\n- source is closed (no new accounts with that ID)\n- Future operations on source redirect to target\n\n**Pattern:** Union-Find with path compression.`,
        baseClass: BANK_BASE_S3,
        starterCode: BANK_STARTER_S3,
        solution: BANK_SOL_S1,
        solutionExplanation: "redirects dict maps closed account to active account. _resolve() follows the chain with path compression. merge() combines balances, adds to closed set, sets redirect.",
        testCases: [
          {
            description: "Merge combines balances",
            inputData: `bank = BankSystem()\nbank.create("alice"); bank.deposit("alice", 100)\nbank.create("bob"); bank.deposit("bob", 50)\nbank.merge("alice", "bob")\n_result = [bank.balance("bob"), bank.balance("alice")]`,
            expectedOutput: `[150.0, 150.0]`,
            orderIndex: 0,
          },
          {
            description: "Operations on merged account redirect to target",
            inputData: `bank = BankSystem()\nbank.create("a"); bank.deposit("a", 100)\nbank.create("b"); bank.deposit("b", 50)\nbank.merge("a", "b")\n_result = [bank.deposit("a", 10), bank.balance("b")]`,
            expectedOutput: `[160.0, 160.0]`,
            orderIndex: 1,
          },
          {
            description: "Chained merges resolve correctly",
            inputData: `bank = BankSystem()\nfor aid in ["a","b","c"]:\n    bank.create(aid); bank.deposit(aid, 10)\nbank.merge("a", "b")\nbank.merge("b", "c")\n_result = [bank.balance("a"), bank.balance("c")]`,
            expectedOutput: `[30.0, 30.0]`,
            orderIndex: 2,
          },
        ],
      },
      {
        stageNumber: 4,
        title: "Cashback & Rewards",
        description: `## Stage 4: Cashback & Rewards\n\nAdd \`top_spenders(n)\` and \`cashback(percentage)\`.\n\n**Key:** Track \`total_outgoing\` separately — you cannot derive it from balance.\n\n\`\`\`python\nbank.withdraw("alice", 30)\nbank.transfer("alice", "bob", 20)\nbank.top_spenders(1)  # [("alice", 50.0)]\nbank.cashback(10)     # alice gets 5.0 back\n\`\`\``,
        baseClass: BANK_BASE_S4,
        starterCode: BANK_STARTER_S4,
        solution: BANK_SOL_S1,
        solutionExplanation: "total_outgoing tracks withdrawals + transfers out. top_spenders sorts by (-outgoing, account_id). cashback credits outgoing * percentage/100 to each account.",
        testCases: [
          {
            description: "Top spenders returns correct ranking",
            inputData: `bank = BankSystem()\nbank.create("alice"); bank.deposit("alice", 200)\nbank.create("bob"); bank.deposit("bob", 100)\nbank.withdraw("alice", 50)\nbank.withdraw("bob", 80)\nresult = bank.top_spenders(2)\n_result = [result[0][0], result[1][0]]`,
            expectedOutput: `["bob", "alice"]`,
            orderIndex: 0,
          },
          {
            description: "Cashback credits accounts with outgoing",
            inputData: `bank = BankSystem()\nbank.create("alice"); bank.deposit("alice", 100)\nbank.withdraw("alice", 40)\nbal_before = bank.balance("alice")\nbank.cashback(10)\nbal_after = bank.balance("alice")\n_result = round(bal_after - bal_before, 2)`,
            expectedOutput: `4.0`,
            orderIndex: 1,
          },
          {
            description: "Cashback returns count of credited accounts",
            inputData: `bank = BankSystem()\nfor aid in ["a","b","c"]:\n    bank.create(aid); bank.deposit(aid, 100)\nbank.withdraw("a", 10)\nbank.withdraw("b", 20)\n_result = bank.cashback(5)`,
            expectedOutput: `2`,
            orderIndex: 2,
          },
        ],
      },
    ]
  );

  // ── 10. LRU Cache + Task Manager ────────────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 10001,
      slug: "lru-cache-task-manager",
      title: "LRU Cache + Task Manager",
      difficulty: "Medium",
      tags: "lru,heap,design",
      description: `## LRU Cache + Task Manager\n\n**Difficulty:** Medium | **Type:** Systems / Design\n\nProgressive from basic LRU cache to production task manager.\n\n### Stage 1: LRU Cache\nO(1) get and put with LRU eviction.\n\n### Stage 2: TTL Support\nEntries expire after a specified duration.\n\n### Stage 3: Task Manager\nPriority queue with lazy deletion.\n\n**Key tools:** \`OrderedDict\` for LRU. \`heapq\` for task manager with lazy deletion.`,
      starterCode: LRU_STARTER_S1,
    },
    [
      {
        stageNumber: 1,
        title: "LRU Cache",
        description: `## Stage 1: LRU Cache\n\nImplement \`get(key) -> int\` and \`put(key, value)\`. Both must be O(1).\n\n**Pythonic approach:** \`OrderedDict\` — \`move_to_end(key)\` promotes to MRU, \`popitem(last=False)\` evicts LRU.\n\n\`\`\`python\ncache = LRUCache(capacity=2)\ncache.put(1, 10)\ncache.put(2, 20)\nprint(cache.get(1))   # 10\ncache.put(3, 30)      # evicts 2 (LRU)\nprint(cache.get(2))   # -1\n\`\`\``,
        baseClass: LRU_BASE_S1,
        starterCode: LRU_STARTER_S1,
        solution: LRU_SOL_S1,
        solutionExplanation: "Use OrderedDict. get() moves key to end (MRU). put() moves to end if exists, else inserts; if over capacity, popitem(last=False) evicts LRU.",
        testCases: [
          {
            description: "Basic LRU eviction",
            inputData: `cache = LRUCache(capacity=2)\ncache.put(1, 10)\ncache.put(2, 20)\nv1 = cache.get(1)\ncache.put(3, 30)\n_result = [v1, cache.get(2), cache.get(3)]`,
            expectedOutput: `[10, -1, 30]`,
            orderIndex: 0,
          },
          {
            description: "Update existing key does not evict",
            inputData: `cache = LRUCache(capacity=2)\ncache.put(1, 1)\ncache.put(2, 2)\ncache.put(1, 10)\ncache.put(3, 3)\n_result = [cache.get(1), cache.get(2)]`,
            expectedOutput: `[10, -1]`,
            orderIndex: 1,
          },
          {
            description: "Get missing key returns -1",
            inputData: `cache = LRUCache(capacity=3)\n_result = cache.get(99)`,
            expectedOutput: `-1`,
            orderIndex: 2,
          },
        ],
      },
      {
        stageNumber: 2,
        title: "TTL Cache",
        description: `## Stage 2: TTL Cache\n\nAdd \`get_with_ttl(key)\` and \`put_with_ttl(key, value, ttl)\`.\n\nEntries expire after \`ttl\` seconds. Expired entries return -1 (lazy expiration).\n\n\`\`\`python\ncache = LRUCache(capacity=3)\ncache.put_with_ttl(1, 100, ttl=0.01)\nprint(cache.get_with_ttl(1))  # 100\ntime.sleep(0.02)\nprint(cache.get_with_ttl(1))  # -1\n\`\`\``,
        baseClass: LRU_BASE_S2,
        starterCode: LRU_STARTER_S2,
        solution: LRU_SOL_S2,
        solutionExplanation: "ttl_cache stores (value, expiry) pairs. get_with_ttl checks time.time() > expiry and deletes if expired. put_with_ttl sets expiry = time.time() + ttl.",
        testCases: [
          {
            description: "TTL entry accessible before expiry",
            inputData: `cache = LRUCache(capacity=3)\ncache.put_with_ttl(1, 100, ttl=60.0)\n_result = cache.get_with_ttl(1)`,
            expectedOutput: `100`,
            orderIndex: 0,
          },
          {
            description: "TTL entry returns -1 after expiry",
            inputData: `import time\ncache = LRUCache(capacity=3)\ncache.put_with_ttl(1, 100, ttl=0.01)\ntime.sleep(0.05)\n_result = cache.get_with_ttl(1)`,
            expectedOutput: `-1`,
            orderIndex: 1,
          },
          {
            description: "TTL and regular cache are independent",
            inputData: `cache = LRUCache(capacity=2)\ncache.put(1, 10)\ncache.put_with_ttl(2, 20, ttl=60.0)\n_result = [cache.get(1), cache.get_with_ttl(2)]`,
            expectedOutput: `[10, 20]`,
            orderIndex: 2,
          },
        ],
      },
      {
        stageNumber: 3,
        title: "Task Manager",
        description: `## Stage 3: Task Manager\n\nImplement \`TaskManager\` with priority queue and lazy deletion.\n\n**Data structures:**\n- \`tasks: dict\` — O(1) lookup by task_id\n- \`pq: list\` — min-heap with \`(-priority, task_id)\`\n\n**Lazy deletion:** \`complete_task\` just marks the task. \`get_highest_priority\` pops from heap until it finds a pending task.\n\n\`\`\`python\ntm = TaskManager()\ntm.add_task("t1", "Deploy", priority=5)\ntm.add_task("t2", "Fix bug", priority=10)\ntm.complete_task("t2")\nprint(tm.get_highest_priority().task_id)  # "t1"\n\`\`\``,
        baseClass: LRU_BASE_S3,
        starterCode: LRU_STARTER_S3,
        solution: LRU_SOL_S3,
        solutionExplanation: "TaskManager uses dict + heap. add_task pushes (-priority, task_id). complete_task marks status. get_highest_priority uses lazy deletion: pop until pending task found.",
        testCases: [
          {
            description: "get_highest_priority returns highest pending task",
            inputData: `tm = TaskManager()\ntm.add_task("t1", "Low", priority=1)\ntm.add_task("t2", "High", priority=10)\ntm.add_task("t3", "Mid", priority=5)\nresult = tm.get_highest_priority()\n_result = [result.task_id, result.priority]`,
            expectedOutput: `["t2", 10]`,
            orderIndex: 0,
          },
          {
            description: "Completed tasks are skipped",
            inputData: `tm = TaskManager()\ntm.add_task("t1", "A", priority=10)\ntm.add_task("t2", "B", priority=5)\ntm.complete_task("t1")\n_result = tm.get_highest_priority().task_id`,
            expectedOutput: `"t2"`,
            orderIndex: 1,
          },
          {
            description: "list_tasks with status filter",
            inputData: `tm = TaskManager()\ntm.add_task("t1", "A", priority=3)\ntm.add_task("t2", "B", priority=7)\ntm.complete_task("t1")\npending = tm.list_tasks(status="pending")\n_result = [len(pending), pending[0].task_id]`,
            expectedOutput: `[1, "t2"]`,
            orderIndex: 2,
          },
        ],
      },
    ]
  );

  // ── Post-seed: ensure testFileContent is populated for all staged stages ────
  await backfillTestFileContent();
}

/**
 * For every staged problem stage that has null testFileContent, generate and
 * store the cumulative Python unittest display file.
 * Safe to call multiple times (only updates rows where testFileContent is null).
 */
async function backfillTestFileContent(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const { stageTestCases } = await import("../drizzle/schema");
  const allProblems = await db.select({ id: problems.id, title: problems.title })
    .from(problems)
    .where(eq(problems.isStaged, 1));
  for (const prob of allProblems) {
    const stages = await db.select().from(problemStages)
      .where(eq(problemStages.problemId, prob.id))
      .orderBy(problemStages.stageNumber);
    const needsUpdate = stages.some(s => !s.testFileContent);
    if (!needsUpdate) continue;
    const stagesWithCases: StageSeed[] = [];
    for (const stage of stages) {
      const cases = await db.select({
        description: stageTestCases.description,
        inputData: stageTestCases.inputData,
        expectedOutput: stageTestCases.expectedOutput,
        orderIndex: stageTestCases.orderIndex,
      }).from(stageTestCases)
        .where(eq(stageTestCases.stageId, stage.id))
        .orderBy(stageTestCases.orderIndex);
      stagesWithCases.push({ stageNumber: stage.stageNumber, title: stage.title, testCases: cases });
    }
    for (let i = 0; i < stages.length; i++) {
      const content = generateTestFileContent(prob.title, stagesWithCases[i]);
      await db.update(problemStages)
        .set({ testFileContent: content })
        .where(eq(problemStages.id, stages[i].id));
    }
    console.log(`[Seed] Backfilled testFileContent for: ${prob.title}`);
  }
}
