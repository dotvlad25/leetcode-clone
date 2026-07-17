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
    // Indent each line of inputData by 8 spaces (inside the test method)
    const bodyLines = tc.inputData
      .split("\n")
      .map(l => `        ${l}`);
    lines.push(`class Test_Stage${stage.stageNumber}_Case${testNum}(unittest.TestCase):`);
    lines.push(`    """`);
    lines.push(`    ${desc}`);
    lines.push(`    Expected: ${tc.expectedOutput}`);
    lines.push(`    """`);
    lines.push(`    def test(self):`);
    lines.push(...bodyLines);
    lines.push(`        self.assertEqual(_result, ${tc.expectedOutput})`);
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
        # defaultdict(deque) auto-creates an empty deque for each new user_id on first access
        self.requests = defaultdict(deque)  # user_id -> deque of request timestamps

    def allow_request(self, user_id: str) -> bool:
        now = time.time()
        cutoff = now - self.window_seconds  # timestamps at or before this are outside the window
        ts = self.requests[user_id]         # O(1) lookup; empty deque created if new user
        # Evict expired timestamps from the front (oldest end) of the deque
        while ts and ts[0] <= cutoff:
            ts.popleft()                    # O(1) per removal
        if len(ts) < self.max_requests:     # quota not yet exhausted for this window
            ts.append(now)                  # record this request timestamp
            return True
        return False                        # too many requests in the current window
`;

const RATE_LIMITER_SOL_S2 = RATE_LIMITER_SOL_S1 + `
    def cleanup(self) -> int:
        now = time.time()
        removed = 0  # count of users whose entry was fully pruned
        # Iterate over a snapshot of keys so we can safely delete during iteration
        for uid in list(self.requests.keys()):
            cutoff = now - self.window_seconds
            ts = self.requests[uid]
            while ts and ts[0] <= cutoff:
                ts.popleft()
            if not ts:                   # no recent requests — safe to remove the entry
                del self.requests[uid]
                removed += 1
        return removed                   # callers can log how much memory was freed
`;

const RATE_LIMITER_SOL_S3 = `\
from collections import defaultdict, deque
import threading, time

class RateLimiter(RateLimiterBase):
    def __init__(self, max_requests: int, window_seconds: float):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(deque)
        self._global_lock = threading.Lock()  # guards the _user_locks dict itself
        self._user_locks: dict = {}            # per-user locks, created lazily

    def _get_user_lock(self, user_id: str) -> threading.Lock:
        if user_id not in self._user_locks:    # fast path: no locking needed if already exists
            with self._global_lock:            # serialize creation of new per-user locks
                # Double-checked locking: re-test after acquiring the global lock because
                # another thread may have created it between our check and the acquire
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
        with self._get_user_lock(user_id):  # per-user lock: different users run concurrently
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
        hash_to_paths = defaultdict(list)  # md5_hex -> [path1, path2, ...]
        for dirpath, _, filenames in os.walk(root_dir):
            for fname in filenames:
                fpath = os.path.join(dirpath, fname)
                if not os.path.isfile(fpath):  # skip symlinks and directories
                    continue
                try:
                    h = hashlib.md5()
                    with open(fpath, 'rb') as f:
                        # Stream in 8 KB chunks — avoids loading large files into memory
                        while chunk := f.read(8192):
                            h.update(chunk)
                    hash_to_paths[h.hexdigest()].append(fpath)  # group by content fingerprint
                except (PermissionError, OSError):
                    continue  # skip unreadable files gracefully
        # Only return groups with 2+ files — single-file hashes are not duplicates
        return [g for g in hash_to_paths.values() if len(g) >= 2]
`;

const DUP_SOL_S2 = DUP_SOL_S1 + `
    def find_duplicates_optimized(self, root_dir: str) -> List[List[str]]:
        # Pass 1: group by file size — files of different sizes can't be identical
        size_to_paths = defaultdict(list)  # size_bytes -> [paths]
        for dirpath, _, filenames in os.walk(root_dir):
            for fname in filenames:
                fpath = os.path.join(dirpath, fname)
                if not os.path.isfile(fpath):
                    continue
                try:
                    size_to_paths[os.path.getsize(fpath)].append(fpath)  # O(1) stat call
                except (PermissionError, OSError):
                    continue
        # Eliminate size groups with only one file — they can't have duplicates
        candidates = {s: p for s, p in size_to_paths.items() if len(p) >= 2}
        # Pass 2: partial hash — sample beginning + middle + end to avoid full reads
        partial_groups = defaultdict(list)  # (size, partial_hex) -> [paths]
        for size, paths in candidates.items():
            for fpath in paths:
                try:
                    h = hashlib.md5()
                    with open(fpath, 'rb') as f:
                        h.update(f.read(4096))           # first 4 KB
                        if size > 4096 * 3:              # only sample middle/end for large files
                            f.seek(size // 2)
                            h.update(f.read(4096))       # middle 4 KB
                            f.seek(-4096, 2)             # seek 4 KB from end of file
                            h.update(f.read(4096))       # last 4 KB
                    partial_groups[(size, h.hexdigest())].append(fpath)
                except (PermissionError, OSError):
                    continue
        # Pass 3: full hash only for files that survived both previous filters
        candidates2 = {k: p for k, p in partial_groups.items() if len(p) >= 2}
        full_groups = defaultdict(list)  # full_md5_hex -> [paths]
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
        prev_stack = []  # the call stack at the previous timestamp
        for t, curr_stack in enumerate(snapshots):
            # Find the divergence point: how many frames from the top are identical
            common_depth = 0  # number of shared prefix frames between prev and curr
            for i in range(min(len(prev_stack), len(curr_stack))):
                if prev_stack[i] == curr_stack[i]:
                    common_depth = i + 1  # this frame is still the same function at this depth
                else:
                    break  # first mismatch — everything below this depth diverged
            # Emit END events for frames that left the stack, deepest first (LIFO order)
            for i in range(len(prev_stack) - 1, common_depth - 1, -1):
                events.append(TraceEvent(t, prev_stack[i], i, "end"))
            # Emit START events for frames that entered the stack, shallowest first
            for i in range(common_depth, len(curr_stack)):
                events.append(TraceEvent(t, curr_stack[i], i, "start"))
            prev_stack = list(curr_stack)  # advance: curr becomes prev for next iteration
        # Flush: functions still on the stack at the end never got an END event from the main loop
        # Timestamp = len(snapshots) — one tick past the last snapshot
        for i in range(len(prev_stack) - 1, -1, -1):  # deepest frame ends first
            events.append(TraceEvent(len(snapshots), prev_stack[i], i, "end"))
        return events
`;

const PROFILER_SOL_S2 = PROFILER_SOL_S1 + `
    def convert_with_denoising(self, snapshots: List[List[str]], min_samples: int = 3) -> List[TraceEvent]:
        events = []
        max_depth = max((len(s) for s in snapshots), default=0)  # deepest stack seen
        confirmed_spans = []  # (depth, func, start_t, end_t) for spans that pass the filter
        # Scan each depth level independently — functions at the same depth don't overlap
        for depth in range(max_depth):
            run_func = None   # function currently being tracked at this depth
            run_start = 0     # snapshot index where the current run began
            run_count = 0     # consecutive snapshots the current function has appeared
            for t, stack in enumerate(snapshots):
                curr = stack[depth] if depth < len(stack) else None  # None if stack is shallower
                if curr == run_func and curr is not None:
                    run_count += 1  # same function continues — extend the run
                else:
                    # Run ended — check if it was long enough to keep
                    if run_func is not None and run_count >= min_samples:
                        confirmed_spans.append((depth, run_func, run_start, t))
                    run_func = curr
                    run_start = t
                    run_count = 1 if curr is not None else 0
            # Handle a run that extends all the way to the last snapshot
            if run_func is not None and run_count >= min_samples:
                confirmed_spans.append((depth, run_func, run_start, len(snapshots)))
        for depth, func, start_t, end_t in confirmed_spans:
            events.append(TraceEvent(start_t, func, depth, "start"))
            events.append(TraceEvent(end_t, func, depth, "end"))
        # Sort: by timestamp, then ENDs before STARTs at the same tick,
        # then shallowest-first for starts and deepest-first for ends
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
        # Pre-compute the longest vocab word length to bound the inner loop
        max_len = max(len(w) for w in vocab) if vocab else 0  # O(|vocab|) once
        tokens = []
        i = 0
        while i < len(text):
            matched = False
            # Try longest possible match first (greedy), shrink until we find a vocab word
            for length in range(min(max_len, len(text) - i), 0, -1):
                if text[i:i + length] in vocab:
                    tokens.append(text[i:i + length])
                    i += length
                    matched = True
                    break  # take the longest match and advance
            if not matched:             # no vocab word starts here
                tokens.append(text[i])  # emit the single unknown character as its own token
                i += 1
        return tokens
`;

const TOKENIZER_SOL_S2 = `\
from typing import List, Set

class Trie:
    def __init__(self):
        self.children = {}   # char -> child Trie node
        self.is_end = False  # True if a vocab word ends at this node
        self.word = None     # the full word stored at this terminal node

    def insert(self, word: str):
        node = self
        for ch in word:
            if ch not in node.children:
                node.children[ch] = Trie()  # create child node on demand
            node = node.children[ch]
        node.is_end = True   # mark the end of this word
        node.word = word     # store the full word for O(1) retrieval at match time

    def longest_match(self, text: str, start: int):
        node = self
        best = None  # best (longest) vocab word found so far
        for i in range(start, len(text)):
            if text[i] not in node.children:
                break  # no vocab word can extend further from this point
            node = node.children[text[i]]  # follow the trie edge
            if node.is_end:
                best = node.word  # update best — keep going to find an even longer match
        return best

class Tokenizer(TokenizerBase):
    def tokenize(self, text: str, vocab: Set[str]) -> List[str]:
        if not text:
            return []
        # Pre-compute the longest vocab word length to bound the inner loop
        max_len = max(len(w) for w in vocab) if vocab else 0  # O(|vocab|) once
        tokens = []
        i = 0
        while i < len(text):
            matched = False
            # Try longest possible match first (greedy), shrink until we find a vocab word
            for length in range(min(max_len, len(text) - i), 0, -1):
                if text[i:i + length] in vocab:
                    tokens.append(text[i:i + length])
                    i += length
                    matched = True
                    break  # take the longest match and advance
            if not matched:             # no vocab word starts here
                tokens.append(text[i])  # emit the single unknown character as its own token
                i += 1
        return tokens

    def tokenize_trie(self, text: str, vocab: Set[str]) -> List[str]:
        trie = Trie()  # build once per call; in production you'd cache this
        for word in vocab:
            trie.insert(word)
        tokens = []
        i = 0
        while i < len(text):
            match = trie.longest_match(text, i)  # O(L) where L = actual match length
            if match:
                tokens.append(match)
                i += len(match)
            else:
                tokens.append(text[i])  # unknown character — emit as single-char token
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
        result = [0] * n  # result[i] = count of elements to the right of i that are smaller
        for i in range(n):
            for j in range(i + 1, n):
                if nums[j] < nums[i]:  # found an element to the right that is strictly smaller
                    result[i] += 1
        return result
`;

const SMALLER_SOL_S2 = SMALLER_SOL_S1 + `
    def count_smaller_efficient(self, nums: List[int]) -> List[int]:
        import bisect
        n = len(nums)
        result = [0] * n    # result[i] = count of elements to the right smaller than nums[i]
        sorted_right = []   # sorted list of elements seen so far (right-to-left sweep)
        # Process right-to-left: when we process nums[i], sorted_right contains
        # exactly the elements to its right, in sorted order
        for i in range(n - 1, -1, -1):
            # bisect_left gives the insertion index = count of elements strictly less than nums[i]
            pos = bisect.bisect_left(sorted_right, nums[i])
            result[i] = pos                       # that count is our answer for index i
            bisect.insort(sorted_right, nums[i])  # insert to maintain sorted order
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
        self.data = {}                       # key -> current value
        self.history_log = defaultdict(list) # key -> [(timestamp, value), ...]
        self.locks = {}                      # key -> owner caller_id
        self.transactions = {}               # caller_id -> list of undo operations
        self._clock = 0                      # logical clock; incremented on every write

    def _tick(self):
        self._clock += 1   # advance logical time
        return self._clock # return the new timestamp for the caller to record

    def set(self, key: str, value: Any, caller_id=None) -> bool:
        if key in self.locks and caller_id != self.locks[key]:  # locked by someone else
            return False
        ts = self._tick()
        old_value = self.data.get(key)  # save for potential rollback
        if caller_id and caller_id in self.transactions:
            # Record the undo operation: to rollback a set, restore the old value
            self.transactions[caller_id].append(("set", key, old_value))
        self.data[key] = value
        self.history_log[key].append((ts, value))  # append-only audit log
        return True

    def get(self, key: str) -> Optional[Any]:
        return self.data.get(key)

    def delete(self, key: str, caller_id=None) -> bool:
        if key not in self.data:
            return False
        if key in self.locks and caller_id != self.locks[key]:  # locked by someone else
            return False
        ts = self._tick()
        old_value = self.data[key]  # save for potential rollback
        if caller_id and caller_id in self.transactions:
            # Record the undo operation: to rollback a delete, restore the value
            self.transactions[caller_id].append(("delete", key, old_value))
        del self.data[key]
        self.history_log[key].append((ts, None))  # None signals deletion in the audit log
        return True

    def count(self) -> int:
        return len(self.data)

    def history(self, key: str) -> list:
        return list(self.history_log[key])

    def modified_since(self, timestamp: int) -> list:
        result = set()  # use a set to deduplicate keys modified multiple times
        for key, entries in self.history_log.items():
            for ts, _ in entries:
                if ts > timestamp:   # at least one write happened after the given timestamp
                    result.add(key)
                    break            # no need to scan further entries for this key
        return sorted(result)        # sorted for deterministic output

    def lock(self, key: str, caller_id: str) -> bool:
        if key in self.locks:
            return self.locks[key] == caller_id  # idempotent: re-locking by the same owner is OK
        self.locks[key] = caller_id  # acquire the lock
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
        # Replay undo operations in reverse order (LIFO) to restore original state
        for action, key, old_value in reversed(self.transactions[caller_id]):
            ts = self._tick()
            if action == "set":
                if old_value is None:  # the key didn't exist before the set — delete it again
                    self.data.pop(key, None)
                    self.history_log[key].append((ts, None))
                else:                  # restore the previous value
                    self.data[key] = old_value
                    self.history_log[key].append((ts, old_value))
            elif action == "delete":   # the key existed before the delete — restore it
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
        self.accounts = {}                        # account_id -> balance
        self.redirects = {}                       # closed_id -> canonical_id (union-find)
        self.total_outgoing = defaultdict(float)  # account_id -> total withdrawn/transferred out
        self.closed = set()                       # account_ids that have been merged away

    def _resolve(self, account_id: str) -> str:
        visited = []  # collect intermediate nodes for path compression
        # Follow the redirect chain until we reach the canonical account
        while account_id in self.redirects:
            visited.append(account_id)
            account_id = self.redirects[account_id]
        # Path compression: point all visited nodes directly to the root
        # This flattens the chain so future lookups are O(1)
        for v in visited:
            self.redirects[v] = account_id
        return account_id  # the canonical (non-redirected) account

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
        self.total_outgoing[account_id] += amount  # track outgoing for top_spenders/cashback
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
        self.total_outgoing[from_id] += amount  # transfers count as outgoing spend
        return True

    def merge(self, source_id: str, target_id: str) -> bool:
        source_id = self._resolve(source_id)
        target_id = self._resolve(target_id)
        if source_id not in self.accounts or target_id not in self.accounts: return False
        if source_id == target_id: return False
        self.accounts[target_id] += self.accounts[source_id]              # absorb balance
        self.total_outgoing[target_id] += self.total_outgoing[source_id]  # absorb spend history
        del self.accounts[source_id]        # source no longer has its own balance entry
        self.closed.add(source_id)          # mark as closed so create() rejects it
        self.redirects[source_id] = target_id  # future ops on source_id resolve to target_id
        return True

    def top_spenders(self, n: int) -> list:
        # Only consider currently active accounts (merged-away accounts are excluded)
        active = [(aid, self.total_outgoing.get(aid, 0.0)) for aid in self.accounts]
        # Sort by total outgoing descending; break ties alphabetically by account_id
        active.sort(key=lambda x: (-x[1], x[0]))
        return active[:n]  # return the top n

    def cashback(self, percentage: float) -> int:
        count = 0  # number of accounts that received a cashback credit
        for aid in list(self.accounts.keys()):
            outgoing = self.total_outgoing.get(aid, 0.0)
            if outgoing > 0:  # only credit accounts that have actually spent something
                self.accounts[aid] += outgoing * (percentage / 100.0)  # credit the cashback
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
        # OrderedDict preserves insertion order and supports O(1) move_to_end + popitem
        self.cache = OrderedDict()  # key -> value; most-recently-used at the right end

    def get(self, key: int) -> int:
        if key not in self.cache: return -1  # cache miss
        self.cache.move_to_end(key)          # mark as most-recently-used
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)  # update existing key — promote to MRU
            self.cache[key] = value
        else:
            if len(self.cache) >= self.capacity:
                self.cache.popitem(last=False)  # evict LRU: remove from the left (oldest) end
            self.cache[key] = value             # insert at the right (MRU) end
`;

const LRU_SOL_S2 = `\
from collections import OrderedDict
import time

class LRUCache(LRUCacheBase):
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()
        self.ttl_cache = OrderedDict()  # key -> (value, expiry_unix_timestamp)

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
        if time.time() > expiry:         # entry has expired — evict it lazily on access
            del self.ttl_cache[key]
            return -1
        self.ttl_cache.move_to_end(key)  # still valid — promote to MRU
        return value

    def put_with_ttl(self, key: int, value: int, ttl: float) -> None:
        expiry = time.time() + ttl       # compute absolute expiry time
        if key in self.ttl_cache:
            self.ttl_cache.move_to_end(key)      # refresh position (update TTL below)
        elif len(self.ttl_cache) >= self.capacity:
            self.ttl_cache.popitem(last=False)   # evict LRU entry to make room
        self.ttl_cache[key] = (value, expiry)    # store value + expiry together
`;

const LRU_SOL_S3 = LRU_SOL_S2 + `

class Task:
    def __init__(self, task_id, description, priority):
        self.task_id = task_id
        self.description = description
        self.priority = priority
        self.status = "pending"  # "pending" or "complete"

class TaskManager(TaskManagerBase):
    def __init__(self):
        self.tasks = {}   # task_id -> Task object
        self.pq = []      # min-heap of (-priority, task_id); negated so highest priority pops first

    def add_task(self, task_id: str, description: str, priority: int) -> bool:
        if task_id in self.tasks: return False
        task = Task(task_id, description, priority)
        self.tasks[task_id] = task
        import heapq
        heapq.heappush(self.pq, (-priority, task_id))  # negate priority for max-heap semantics
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
        # Lazy deletion: the heap may contain stale entries for completed tasks
        # Keep popping until we find a pending task or exhaust the heap
        while self.pq:
            neg_pri, task_id = self.pq[0]       # peek at the top without removing
            task = self.tasks.get(task_id)
            if task and task.status == "pending":
                return task                     # found a valid pending task
            heapq.heappop(self.pq)              # stale entry — discard and continue
        return None  # no pending tasks remain

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
      badges: "anth",
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
            expectedOutput: "[True, True, True, False]",
            orderIndex: 0,
          },
          {
            description: "Different users have independent limits",
            inputData: `import time\nrl = RateLimiter(max_requests=2, window_seconds=60.0)\n_result = [rl.allow_request("alice"), rl.allow_request("alice"), rl.allow_request("alice"), rl.allow_request("bob")]`,
            expectedOutput: "[True, True, False, True]",
            orderIndex: 1,
          },
          {
            description: "Single request always allowed",
            inputData: `rl = RateLimiter(max_requests=1, window_seconds=60.0)\n_result = [rl.allow_request("x"), rl.allow_request("x")]`,
            expectedOutput: "[True, False]",
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
            expectedOutput: "True",
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
            expectedOutput: "[True, True]",
            orderIndex: 0,
          },
          {
            description: "Thread-safe allows independent users concurrently",
            inputData: `import threading\nrl = RateLimiter(max_requests=1, window_seconds=60.0)\nresults = {}\nlock = threading.Lock()\ndef req(uid):\n    r = rl.allow_request_thread_safe(uid)\n    with lock: results[uid] = r\nthreads = [threading.Thread(target=req, args=(f"user{i}",)) for i in range(5)]\nfor t in threads: t.start()\nfor t in threads: t.join()\n_result = all(results.values())`,
            expectedOutput: "True",
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
      badges: "anth",
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
      badges: "anth",
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
            expectedOutput: `[["main", 0, "start", 0], ["foo", 1, "start", 0], ["foo", 1, "end", 1], ["bar", 1, "start", 1], ["bar", 1, "end", 2], ["main", 0, "end", 2]]`,
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
            expectedOutput: `[["main", 0, "start", 0], ["worker", 1, "start", 0], ["worker", 1, "end", 5], ["main", 0, "end", 5]]`,
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
      badges: "anth",
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
      badges: "anth",
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
      badges: "anth",
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
            expectedOutput: `[42, 1, True, None, 0]`,
            orderIndex: 0,
          },
          {
            description: "Delete non-existent key returns False",
            inputData: `db = InMemoryDatabase()\n_result = db.delete("missing")`,
            expectedOutput: `False`,
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
            expectedOutput: `[True, True]`,
            orderIndex: 0,
          },
          {
            description: "modified_since returns correct keys",
            inputData: `db = InMemoryDatabase()\ndb.set("a", 1)\ndb.set("b", 2)\nresult = db.modified_since(1)\n_result = ["b" in result, "a" not in result]`,
            expectedOutput: `[True, True]`,
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
            expectedOutput: `[False, 1]`,
            orderIndex: 0,
          },
          {
            description: "Lock holder can write",
            inputData: `db = InMemoryDatabase()\ndb.set("x", 1)\ndb.lock("x", "alice")\n_result = [db.set("x", 99, caller_id="alice"), db.get("x")]`,
            expectedOutput: `[True, 99]`,
            orderIndex: 1,
          },
          {
            description: "Unlock allows anyone to write",
            inputData: `db = InMemoryDatabase()\ndb.set("x", 1)\ndb.lock("x", "alice")\ndb.unlock("x", "alice")\n_result = [db.set("x", 5), db.get("x")]`,
            expectedOutput: `[True, 5]`,
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
            expectedOutput: `[99, True]`,
            orderIndex: 1,
          },
          {
            description: "Rollback of delete restores key",
            inputData: `db = InMemoryDatabase()\ndb.set("x", 42)\ndb.begin("bob")\ndb.delete("x", caller_id="bob")\nbefore = db.get("x")\ndb.rollback("bob")\nafter = db.get("x")\n_result = [before, after]`,
            expectedOutput: `[None, 42]`,
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
      badges: "anth",
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
            expectedOutput: `None`,
            orderIndex: 1,
          },
          {
            description: "Create duplicate returns False",
            inputData: `bank = BankSystem()\n_result = [bank.create("alice"), bank.create("alice")]`,
            expectedOutput: `[True, False]`,
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
            expectedOutput: `[True, 60.0, 40.0]`,
            orderIndex: 0,
          },
          {
            description: "Transfer fails on insufficient funds",
            inputData: `bank = BankSystem()\nbank.create("alice"); bank.deposit("alice", 10)\nbank.create("bob")\n_result = [bank.transfer("alice", "bob", 50), bank.balance("alice")]`,
            expectedOutput: `[False, 10.0]`,
            orderIndex: 1,
          },
          {
            description: "Transfer fails for unknown account",
            inputData: `bank = BankSystem()\nbank.create("alice"); bank.deposit("alice", 100)\n_result = bank.transfer("alice", "ghost", 10)`,
            expectedOutput: `False`,
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
      badges: "anth",
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
  // ── Figma problems ──────────────────────────────────────────────────────────
  await seedFigmaProblems();
}

// ══════════════════════════════════════════════════════════════════════════════
// 11. LAYER / DOCUMENT SYSTEM  (Figma — most reported coding question)
// ══════════════════════════════════════════════════════════════════════════════

const LAYER_BASE_S1 = `\
from abc import ABC, abstractmethod

class LayerDocumentBase(ABC):
    @abstractmethod
    def apply(self, layer_id: str, prop: str, value) -> None:
        """Set property 'prop' on layer 'layer_id' to 'value'."""
        pass

    @abstractmethod
    def layer(self, layer_id: str) -> dict:
        """Return a dict of all properties for 'layer_id'. Empty dict if unknown."""
        pass
`;

const LAYER_STARTER_S1 = `\
class LayerDocument(LayerDocumentBase):
    def __init__(self):
        pass  # TODO: initialise your data structures

    def apply(self, layer_id: str, prop: str, value) -> None:
        pass  # TODO

    def layer(self, layer_id: str) -> dict:
        pass  # TODO
`;

const LAYER_SOL_S1 = `\
class LayerDocument(LayerDocumentBase):
    def __init__(self):
        # Map from layer_id -> {prop -> value}
        # Using a plain dict gives O(1) apply and O(1) layer lookup.
        self._layers: dict[str, dict] = {}

    def apply(self, layer_id: str, prop: str, value) -> None:
        # Create the layer's property dict on first use (lazy init).
        if layer_id not in self._layers:
            self._layers[layer_id] = {}
        self._layers[layer_id][prop] = value

    def layer(self, layer_id: str) -> dict:
        # Return a shallow copy so callers can't accidentally mutate
        # internal state by modifying the returned dict.
        return dict(self._layers.get(layer_id, {}))
`;

const LAYER_BASE_S2 = `\
from abc import ABC, abstractmethod

class LayerDocumentBase(ABC):
    @abstractmethod
    def apply(self, layer_id: str, prop: str, value) -> None:
        pass

    @abstractmethod
    def layer(self, layer_id: str) -> dict:
        pass

    @abstractmethod
    def undo(self) -> bool:
        """Undo the last apply(). Returns False if nothing to undo."""
        pass
`;

const LAYER_STARTER_S2 = `\
class LayerDocument(LayerDocumentBase):
    def __init__(self):
        pass  # TODO: add undo history data structure

    def apply(self, layer_id: str, prop: str, value) -> None:
        pass  # TODO: record old value before overwriting

    def layer(self, layer_id: str) -> dict:
        pass  # TODO

    def undo(self) -> bool:
        pass  # TODO: pop last operation and reverse it
`;

const LAYER_SOL_S2 = `\
class LayerDocument(LayerDocumentBase):
    def __init__(self):
        self._layers: dict[str, dict] = {}
        # Each history entry: (layer_id, prop, old_value_or_None, new_value)
        # old_value is None when the property didn't exist before this apply().
        self._history: list[tuple] = []

    def apply(self, layer_id: str, prop: str, value) -> None:
        if layer_id not in self._layers:
            self._layers[layer_id] = {}
        # Snapshot the old value BEFORE overwriting — this is what undo restores.
        old = self._layers[layer_id].get(prop, None)
        self._history.append((layer_id, prop, old, value))
        self._layers[layer_id][prop] = value

    def layer(self, layer_id: str) -> dict:
        return dict(self._layers.get(layer_id, {}))

    def undo(self) -> bool:
        if not self._history:
            return False  # nothing to undo
        layer_id, prop, old, _ = self._history.pop()
        if old is None:
            # The property was created by this apply() — remove it entirely.
            del self._layers[layer_id][prop]
        else:
            # Restore the previous value.
            self._layers[layer_id][prop] = old
        return True
`;

const LAYER_BASE_S3 = `\
from abc import ABC, abstractmethod

class LayerDocumentBase(ABC):
    @abstractmethod
    def apply(self, layer_id: str, prop: str, value) -> None:
        pass

    @abstractmethod
    def layer(self, layer_id: str) -> dict:
        pass

    @abstractmethod
    def undo(self) -> bool:
        pass

    @abstractmethod
    def redo(self) -> bool:
        """Re-apply the last undone operation. Returns False if nothing to redo."""
        pass
`;

const LAYER_STARTER_S3 = `\
class LayerDocument(LayerDocumentBase):
    def __init__(self):
        pass  # TODO: two stacks — undo and redo

    def apply(self, layer_id: str, prop: str, value) -> None:
        pass  # TODO: clear redo stack on any new apply

    def layer(self, layer_id: str) -> dict:
        pass

    def undo(self) -> bool:
        pass  # TODO: move entry from undo stack to redo stack

    def redo(self) -> bool:
        pass  # TODO: move entry from redo stack back to undo stack
`;

const LAYER_SOL_S3 = `\
class LayerDocument(LayerDocumentBase):
    def __init__(self):
        self._layers: dict[str, dict] = {}
        # Two-stack undo/redo pattern — the same model used by every text editor.
        # undo_stack: operations that can be undone (most recent on top).
        # redo_stack: operations that were undone and can be re-applied.
        self._undo_stack: list[tuple] = []
        self._redo_stack: list[tuple] = []

    def apply(self, layer_id: str, prop: str, value) -> None:
        if layer_id not in self._layers:
            self._layers[layer_id] = {}
        old = self._layers[layer_id].get(prop, None)
        self._undo_stack.append((layer_id, prop, old, value))
        # KEY RULE: any new edit clears the redo stack.
        # This mirrors real editors — you can't redo after making a new change.
        self._redo_stack.clear()
        self._layers[layer_id][prop] = value

    def layer(self, layer_id: str) -> dict:
        return dict(self._layers.get(layer_id, {}))

    def undo(self) -> bool:
        if not self._undo_stack:
            return False
        entry = self._undo_stack.pop()
        # Move to redo stack so it can be re-applied later.
        self._redo_stack.append(entry)
        layer_id, prop, old, _ = entry
        if old is None:
            del self._layers[layer_id][prop]
        else:
            self._layers[layer_id][prop] = old
        return True

    def redo(self) -> bool:
        if not self._redo_stack:
            return False
        entry = self._redo_stack.pop()
        # Move back to undo stack so it can be undone again.
        self._undo_stack.append(entry)
        layer_id, prop, old, new_val = entry
        self._layers[layer_id][prop] = new_val
        return True
`;

const LAYER_BASE_S4 = `\
from abc import ABC, abstractmethod

class LayerDocumentBase(ABC):
    @abstractmethod
    def apply(self, layer_id: str, prop: str, value) -> None:
        pass

    @abstractmethod
    def layer(self, layer_id: str) -> dict:
        pass

    @abstractmethod
    def undo(self) -> bool:
        pass

    @abstractmethod
    def redo(self) -> bool:
        pass

    @abstractmethod
    def begin_batch(self) -> None:
        """Start collecting operations into a batch."""
        pass

    @abstractmethod
    def commit_batch(self) -> None:
        """Commit the batch as a single undoable unit."""
        pass
`;

const LAYER_STARTER_S4 = `\
class LayerDocument(LayerDocumentBase):
    def __init__(self):
        pass  # TODO: add batch buffer alongside undo/redo stacks

    def apply(self, layer_id: str, prop: str, value) -> None:
        pass  # TODO: if inside a batch, buffer; else push to undo stack

    def layer(self, layer_id: str) -> dict:
        pass

    def undo(self) -> bool:
        pass  # TODO: pop a group (list of ops) and reverse all of them

    def redo(self) -> bool:
        pass  # TODO: pop a group from redo stack and re-apply all

    def begin_batch(self) -> None:
        pass  # TODO: initialise the batch buffer

    def commit_batch(self) -> None:
        pass  # TODO: push the buffer as one group onto the undo stack
`;

const LAYER_SOL_S4 = `\
class LayerDocument(LayerDocumentBase):
    def __init__(self):
        self._layers: dict[str, dict] = {}
        # Each entry on the undo/redo stacks is now a LIST of ops (a group).
        # A single apply() outside a batch creates a one-element group.
        # begin_batch/commit_batch creates a multi-element group.
        self._undo_stack: list[list[tuple]] = []
        self._redo_stack: list[list[tuple]] = []
        # _batch is None when not in a batch; a list when collecting ops.
        self._batch: list[tuple] | None = None

    def apply(self, layer_id: str, prop: str, value) -> None:
        if layer_id not in self._layers:
            self._layers[layer_id] = {}
        old = self._layers[layer_id].get(prop, None)
        op = (layer_id, prop, old, value)
        if self._batch is not None:
            # Inside a batch — collect the op without touching the undo stack.
            self._batch.append(op)
        else:
            # Outside a batch — wrap in a single-element group immediately.
            self._undo_stack.append([op])
            self._redo_stack.clear()  # new edit clears redo
        self._layers[layer_id][prop] = value

    def begin_batch(self) -> None:
        # Start a new batch buffer. Nested batches are not supported.
        self._batch = []

    def commit_batch(self) -> None:
        # Push the collected ops as one atomic group onto the undo stack.
        if self._batch:
            self._undo_stack.append(self._batch)
            self._redo_stack.clear()
        self._batch = None  # reset regardless of whether batch was empty

    def layer(self, layer_id: str) -> dict:
        return dict(self._layers.get(layer_id, {}))

    def _reverse_group(self, group: list[tuple]) -> None:
        # Undo a group by reversing each op in reverse order
        # (last op first, so the state unwinds correctly).
        for layer_id, prop, old, _ in reversed(group):
            if old is None:
                del self._layers[layer_id][prop]
            else:
                self._layers[layer_id][prop] = old

    def _apply_group(self, group: list[tuple]) -> None:
        # Re-apply a group in forward order.
        for layer_id, prop, _, new_val in group:
            self._layers[layer_id][prop] = new_val

    def undo(self) -> bool:
        if not self._undo_stack:
            return False
        group = self._undo_stack.pop()
        self._redo_stack.append(group)
        self._reverse_group(group)
        return True

    def redo(self) -> bool:
        if not self._redo_stack:
            return False
        group = self._redo_stack.pop()
        self._undo_stack.append(group)
        self._apply_group(group)
        return True
`;

// ══════════════════════════════════════════════════════════════════════════════
// 12. FILE SYSTEM WITH PERMISSIONS
// ══════════════════════════════════════════════════════════════════════════════

const FS_BASE_S1 = `\
from abc import ABC, abstractmethod

class FileSystemBase(ABC):
    @abstractmethod
    def add(self, parent_path: str, name: str, node_type: str) -> None:
        """Add a file or directory named 'name' under 'parent_path'.
        node_type is 'file' or 'dir'. The root path is '/'."""
        pass

    @abstractmethod
    def find(self, name: str) -> list:
        """Return a sorted list of absolute paths where a node named 'name' exists."""
        pass
`;

const FS_STARTER_S1 = `\
class FileSystem(FileSystemBase):
    def __init__(self):
        pass  # TODO: initialise the tree rooted at '/'

    def add(self, parent_path: str, name: str, node_type: str) -> None:
        pass  # TODO: attach a new node under parent_path

    def find(self, name: str) -> list:
        pass  # TODO: DFS to collect all paths matching 'name'
`;

const FS_SOL_S1 = `\
class FileSystem(FileSystemBase):
    def __init__(self):
        # Each node is a dict: {name, type, children: list}
        # We keep a flat index (path -> node) for O(1) parent lookup in add().
        self._root = {"name": "/", "type": "dir", "children": []}
        self._nodes: dict[str, dict] = {"/": self._root}

    def add(self, parent_path: str, name: str, node_type: str) -> None:
        node = {"name": name, "type": node_type, "children": []}
        # Build the absolute path for this new node.
        path = parent_path.rstrip("/") + "/" + name
        self._nodes[path] = node
        self._nodes[parent_path]["children"].append(node)

    def find(self, name: str) -> list:
        results: list[str] = []
        def dfs(node: dict, path: str) -> None:
            # Skip the virtual root node itself.
            if node["name"] == name and path != "/":
                results.append(path)
            for child in node["children"]:
                child_path = path.rstrip("/") + "/" + child["name"]
                dfs(child, child_path)
        dfs(self._root, "/")
        # Sort so the result is deterministic regardless of insertion order.
        return sorted(results)
`;

const FS_BASE_S2 = `\
from abc import ABC, abstractmethod

class FileSystemBase(ABC):
    @abstractmethod
    def add(self, parent_path: str, name: str, node_type: str) -> None:
        pass

    @abstractmethod
    def find(self, name: str) -> list:
        pass

    @abstractmethod
    def grant(self, path: str, user: str) -> None:
        """Grant 'user' explicit access to the node at 'path'."""
        pass

    @abstractmethod
    def accessible(self, user: str) -> list:
        """Return sorted list of TOPMOST paths accessible to 'user'.
        A path is topmost if no ancestor is also accessible to the same user."""
        pass
`;

const FS_STARTER_S2 = `\
class FileSystem(FileSystemBase):
    def __init__(self):
        pass  # TODO: store per-node user sets

    def add(self, parent_path: str, name: str, node_type: str) -> None:
        pass

    def find(self, name: str) -> list:
        pass

    def grant(self, path: str, user: str) -> None:
        pass  # TODO: add user to node's access set

    def accessible(self, user: str) -> list:
        pass  # TODO: DFS — report topmost nodes where user has access
`;

const FS_SOL_S2 = `\
class FileSystem(FileSystemBase):
    def __init__(self):
        self._root = {"name": "/", "type": "dir", "children": [], "users": set()}
        self._nodes: dict[str, dict] = {"/": self._root}

    def add(self, parent_path: str, name: str, node_type: str) -> None:
        node = {"name": name, "type": node_type, "children": [], "users": set()}
        path = parent_path.rstrip("/") + "/" + name
        self._nodes[path] = node
        self._nodes[parent_path]["children"].append(node)

    def find(self, name: str) -> list:
        results: list[str] = []
        def dfs(node: dict, path: str) -> None:
            if node["name"] == name and path != "/":
                results.append(path)
            for child in node["children"]:
                dfs(child, path.rstrip("/") + "/" + child["name"])
        dfs(self._root, "/")
        return sorted(results)

    def grant(self, path: str, user: str) -> None:
        self._nodes[path]["users"].add(user)

    def accessible(self, user: str) -> list:
        results: list[str] = []
        def dfs(node: dict, path: str, ancestor_has_access: bool) -> None:
            has_access = user in node["users"]
            if has_access and not ancestor_has_access:
                # This is the topmost node in this branch with access.
                # We report it and continue DFS so children are NOT reported
                # (they would be redundant — access is already granted above).
                results.append(path)
            for child in node["children"]:
                child_path = path.rstrip("/") + "/" + child["name"]
                # Pass True if this node or any ancestor had access.
                dfs(child, child_path, ancestor_has_access or has_access)
        for child in self._root["children"]:
            dfs(child, "/" + child["name"], False)
        return sorted(results)
`;

const FS_BASE_S3 = `\
from abc import ABC, abstractmethod

class FileSystemBase(ABC):
    @abstractmethod
    def add(self, parent_path: str, name: str, node_type: str) -> None:
        pass

    @abstractmethod
    def find(self, name: str) -> list:
        pass

    @abstractmethod
    def grant(self, path: str, user: str) -> None:
        pass

    @abstractmethod
    def revoke(self, path: str, user: str) -> None:
        """Explicitly revoke 'user' access at 'path'.
        An explicit revoke overrides any inherited grant from an ancestor."""
        pass

    @abstractmethod
    def accessible(self, user: str) -> list:
        pass
`;

const FS_STARTER_S3 = `\
class FileSystem(FileSystemBase):
    def __init__(self):
        pass  # TODO: track both grants and explicit revokes per node

    def add(self, parent_path: str, name: str, node_type: str) -> None:
        pass

    def find(self, name: str) -> list:
        pass

    def grant(self, path: str, user: str) -> None:
        pass

    def revoke(self, path: str, user: str) -> None:
        pass  # TODO: mark explicit revoke so DFS stops inheritance here

    def accessible(self, user: str) -> list:
        pass  # TODO: DFS with effective_access = (granted or inherited) and not revoked
`;

const FS_SOL_S3 = `\
class FileSystem(FileSystemBase):
    def __init__(self):
        # Each node stores two sets: grants (explicit allow) and revokes (explicit deny).
        # An explicit revoke at a node blocks inherited access from ancestors.
        self._root = {"name": "/", "type": "dir", "children": [],
                      "grants": set(), "revokes": set()}
        self._nodes: dict[str, dict] = {"/": self._root}

    def add(self, parent_path: str, name: str, node_type: str) -> None:
        node = {"name": name, "type": node_type, "children": [],
                "grants": set(), "revokes": set()}
        path = parent_path.rstrip("/") + "/" + name
        self._nodes[path] = node
        self._nodes[parent_path]["children"].append(node)

    def find(self, name: str) -> list:
        results: list[str] = []
        def dfs(node: dict, path: str) -> None:
            if node["name"] == name and path != "/":
                results.append(path)
            for child in node["children"]:
                dfs(child, path.rstrip("/") + "/" + child["name"])
        dfs(self._root, "/")
        return sorted(results)

    def grant(self, path: str, user: str) -> None:
        self._nodes[path]["grants"].add(user)
        # Granting removes any prior explicit revoke at this node.
        self._nodes[path]["revokes"].discard(user)

    def revoke(self, path: str, user: str) -> None:
        self._nodes[path]["revokes"].add(user)
        # Revoking removes any prior explicit grant at this node.
        self._nodes[path]["grants"].discard(user)

    def accessible(self, user: str) -> list:
        results: list[str] = []
        def dfs(node: dict, path: str, inherited: bool) -> None:
            # Explicit revoke at this node overrides any inherited grant.
            revoked = user in node["revokes"]
            granted = user in node["grants"]
            # Effective access: (explicitly granted OR inherited) AND NOT explicitly revoked.
            effective = (granted or inherited) and not revoked
            # Report this node only if it's the topmost accessible node in this branch.
            if effective and not inherited:
                results.append(path)
            for child in node["children"]:
                child_path = path.rstrip("/") + "/" + child["name"]
                dfs(child, child_path, effective)
        for child in self._root["children"]:
            dfs(child, "/" + child["name"], False)
        return sorted(results)
`;

// ══════════════════════════════════════════════════════════════════════════════
// 13. 2D CANVAS ORDERING
// ══════════════════════════════════════════════════════════════════════════════

const CANVAS_BASE_S1 = `\
from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class CanvasObject:
    id: str
    x: float   # left edge
    y: float   # top edge
    w: float   # width
    h: float   # height

class CanvasSorterBase(ABC):
    @abstractmethod
    def sort(self, objects: list) -> list:
        """Return a list of object ids sorted in reading order:
        top-to-bottom first, then left-to-right within the same row.
        Each element of 'objects' is a CanvasObject."""
        pass
`;

const CANVAS_STARTER_S1 = `\
class CanvasSorter(CanvasSorterBase):
    def sort(self, objects: list) -> list:
        pass  # TODO: sort by (y, x) and return ids
`;

const CANVAS_SOL_S1 = `\
class CanvasSorter(CanvasSorterBase):
    def sort(self, objects: list) -> list:
        # Reading order: primary sort key is y (top edge), secondary is x (left edge).
        # This is the same order a human reads text on a page.
        # sorted() is stable and O(n log n).
        return [obj.id for obj in sorted(objects, key=lambda o: (o.y, o.x))]
`;

const CANVAS_BASE_S2 = `\
from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class CanvasObject:
    id: str
    x: float
    y: float
    w: float
    h: float

class CanvasSorterBase(ABC):
    @abstractmethod
    def sort(self, objects: list) -> list:
        pass

    @abstractmethod
    def sort_rows(self, objects: list) -> list:
        """Group objects into rows where their y-ranges overlap, then sort
        rows top-to-bottom and objects within each row left-to-right.
        Returns a list of object ids."""
        pass
`;

const CANVAS_STARTER_S2 = `\
class CanvasSorter(CanvasSorterBase):
    def sort(self, objects: list) -> list:
        return [obj.id for obj in sorted(objects, key=lambda o: (o.y, o.x))]

    def sort_rows(self, objects: list) -> list:
        pass  # TODO: group by overlapping y-ranges, then sort within rows
`;

const CANVAS_SOL_S2 = `\
class CanvasSorter(CanvasSorterBase):
    def sort(self, objects: list) -> list:
        return [obj.id for obj in sorted(objects, key=lambda o: (o.y, o.x))]

    def sort_rows(self, objects: list) -> list:
        if not objects:
            return []
        # Sort by top edge first so we process objects top-to-bottom.
        sorted_objs = sorted(objects, key=lambda o: o.y)
        rows: list[list] = []
        for obj in sorted_objs:
            placed = False
            for row in rows:
                # Two objects are in the same row if their y-ranges overlap.
                # Overlap condition: obj starts before existing ends AND obj ends after existing starts.
                for existing in row:
                    if obj.y < existing.y + existing.h and obj.y + obj.h > existing.y:
                        row.append(obj)
                        placed = True
                        break
                if placed:
                    break
            if not placed:
                # No overlapping row found — start a new row.
                rows.append([obj])
        # Within each row, sort left-to-right by x.
        result: list[str] = []
        for row in rows:
            result.extend(obj.id for obj in sorted(row, key=lambda o: o.x))
        return result
`;

// ══════════════════════════════════════════════════════════════════════════════
// 14. COMPONENT TREE TRAVERSAL
// ══════════════════════════════════════════════════════════════════════════════

const COMP_BASE_S1 = `\
from abc import ABC, abstractmethod

class ComponentTreeBase(ABC):
    ROOT = "__root__"  # virtual root id — do not include in results

    @abstractmethod
    def add(self, parent_id: str, node_id: str, node_type: str) -> None:
        """Add a component node as a child of parent_id.
        Use ComponentTreeBase.ROOT as parent_id to add top-level nodes."""
        pass

    @abstractmethod
    def flatten(self) -> list:
        """Return all node ids in DFS pre-order (parent before its children).
        Do not include ROOT itself."""
        pass
`;

const COMP_STARTER_S1 = `\
class ComponentTree(ComponentTreeBase):
    def __init__(self):
        pass  # TODO: initialise the tree with a virtual root node

    def add(self, parent_id: str, node_id: str, node_type: str) -> None:
        pass  # TODO: attach node under parent

    def flatten(self) -> list:
        pass  # TODO: DFS pre-order, skip ROOT
`;

const COMP_SOL_S1 = `\
class ComponentTree(ComponentTreeBase):
    def __init__(self):
        # Each node: {id, type, children: list}
        # Virtual root is never included in results — it just anchors the tree.
        self._root = {"id": self.ROOT, "type": "root", "children": []}
        self._nodes: dict[str, dict] = {self.ROOT: self._root}

    def add(self, parent_id: str, node_id: str, node_type: str) -> None:
        node = {"id": node_id, "type": node_type, "children": []}
        self._nodes[node_id] = node
        self._nodes[parent_id]["children"].append(node)

    def flatten(self) -> list:
        result: list[str] = []
        def dfs(node: dict) -> None:
            # Pre-order: visit node before its children.
            if node["id"] != self.ROOT:
                result.append(node["id"])
            for child in node["children"]:
                dfs(child)
        dfs(self._root)
        return result
`;

const COMP_BASE_S2 = `\
from abc import ABC, abstractmethod

class ComponentTreeBase(ABC):
    ROOT = "__root__"

    @abstractmethod
    def add(self, parent_id: str, node_id: str, node_type: str) -> None:
        pass

    @abstractmethod
    def flatten(self) -> list:
        pass

    @abstractmethod
    def find_by_type(self, node_type: str) -> list:
        """Return ids of all nodes with the given type, in DFS pre-order."""
        pass

    @abstractmethod
    def depth(self, node_id: str) -> int:
        """Return the depth of node_id. Top-level nodes (direct children of ROOT) have depth 1."""
        pass
`;

const COMP_STARTER_S2 = `\
class ComponentTree(ComponentTreeBase):
    def __init__(self):
        pass  # TODO: store parent reference so depth() can walk upward

    def add(self, parent_id: str, node_id: str, node_type: str) -> None:
        pass  # TODO: record parent_id on each node

    def flatten(self) -> list:
        pass

    def find_by_type(self, node_type: str) -> list:
        pass  # TODO: filter flatten() by type

    def depth(self, node_id: str) -> int:
        pass  # TODO: walk parent pointers until ROOT, count steps
`;

const COMP_SOL_S2 = `\
class ComponentTree(ComponentTreeBase):
    def __init__(self):
        # Store parent_id on each node so depth() can walk upward in O(depth).
        self._root = {"id": self.ROOT, "type": "root", "children": [], "parent": None}
        self._nodes: dict[str, dict] = {self.ROOT: self._root}

    def add(self, parent_id: str, node_id: str, node_type: str) -> None:
        node = {"id": node_id, "type": node_type, "children": [], "parent": parent_id}
        self._nodes[node_id] = node
        self._nodes[parent_id]["children"].append(node)

    def flatten(self) -> list:
        result: list[str] = []
        def dfs(node: dict) -> None:
            if node["id"] != self.ROOT:
                result.append(node["id"])
            for child in node["children"]:
                dfs(child)
        dfs(self._root)
        return result

    def find_by_type(self, node_type: str) -> list:
        # Reuse flatten() to get DFS order, then filter by type.
        # O(n) — visits every node once.
        return [nid for nid in self.flatten() if self._nodes[nid]["type"] == node_type]

    def depth(self, node_id: str) -> int:
        # Walk parent pointers until we reach ROOT.
        # Depth of ROOT's direct children is 1.
        depth = 0
        current = node_id
        while self._nodes[current]["parent"] is not None:
            depth += 1
            current = self._nodes[current]["parent"]
        return depth
`;

const COMP_BASE_S3 = `\
from abc import ABC, abstractmethod

class ComponentTreeBase(ABC):
    ROOT = "__root__"

    @abstractmethod
    def add(self, parent_id: str, node_id: str, node_type: str,
            master_id: str = None) -> None:
        """Add a node. If master_id is given, this is an instance that
        inherits properties from the master component."""
        pass

    @abstractmethod
    def flatten(self) -> list:
        pass

    @abstractmethod
    def find_by_type(self, node_type: str) -> list:
        pass

    @abstractmethod
    def depth(self, node_id: str) -> int:
        pass

    @abstractmethod
    def set_prop(self, node_id: str, key: str, value) -> None:
        """Set a property on a node. Overrides the master's value for this instance."""
        pass

    @abstractmethod
    def get_prop(self, node_id: str, key: str):
        """Get a property. Falls back to the master component if not set locally.
        Returns None if not found anywhere."""
        pass
`;

const COMP_STARTER_S3 = `\
class ComponentTree(ComponentTreeBase):
    def __init__(self):
        pass  # TODO: store props dict and master_id per node

    def add(self, parent_id: str, node_id: str, node_type: str,
            master_id: str = None) -> None:
        pass  # TODO: record master_id for instance nodes

    def flatten(self) -> list:
        pass

    def find_by_type(self, node_type: str) -> list:
        pass

    def depth(self, node_id: str) -> int:
        pass

    def set_prop(self, node_id: str, key: str, value) -> None:
        pass  # TODO: store in node's own props dict

    def get_prop(self, node_id: str, key: str):
        pass  # TODO: own props first, then master's props, then None
`;

const COMP_SOL_S3 = `\
class ComponentTree(ComponentTreeBase):
    def __init__(self):
        self._root = {"id": self.ROOT, "type": "root", "children": [],
                      "parent": None, "props": {}, "master": None}
        self._nodes: dict[str, dict] = {self.ROOT: self._root}

    def add(self, parent_id: str, node_id: str, node_type: str,
            master_id: str = None) -> None:
        node = {"id": node_id, "type": node_type, "children": [],
                "parent": parent_id, "props": {}, "master": master_id}
        self._nodes[node_id] = node
        self._nodes[parent_id]["children"].append(node)

    def flatten(self) -> list:
        result: list[str] = []
        def dfs(node: dict) -> None:
            if node["id"] != self.ROOT:
                result.append(node["id"])
            for child in node["children"]:
                dfs(child)
        dfs(self._root)
        return result

    def find_by_type(self, node_type: str) -> list:
        return [nid for nid in self.flatten() if self._nodes[nid]["type"] == node_type]

    def depth(self, node_id: str) -> int:
        depth = 0
        current = node_id
        while self._nodes[current]["parent"] is not None:
            depth += 1
            current = self._nodes[current]["parent"]
        return depth

    def set_prop(self, node_id: str, key: str, value) -> None:
        # Store in the node's own props dict — this overrides the master's value.
        self._nodes[node_id]["props"][key] = value

    def get_prop(self, node_id: str, key: str):
        node = self._nodes[node_id]
        # Own props take priority over inherited props.
        if key in node["props"]:
            return node["props"][key]
        # Fall back to master component's props (one level of inheritance).
        if node["master"] and node["master"] in self._nodes:
            return self._nodes[node["master"]]["props"].get(key, None)
        return None
`;

export async function seedFigmaProblems(): Promise<void> {
  // ── 11. Layer / Document System ─────────────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 11001,
      slug: "layer-document-system",
      title: "Layer Document System",
      difficulty: "Medium",
      description: `## Layer Document System\n\nIn Figma every design is a **document** made up of named layers. Each layer can have arbitrary properties — position, fill colour, opacity, and so on.\n\nYou will build a \`LayerDocument\` class that supports applying property changes and undoing/redoing them, just like Ctrl+Z in a real editor.\n\n**Stages:**\n1. Basic \`apply\` / \`layer\` — store and retrieve layer properties.\n2. \`undo()\` — revert the last change.\n3. \`redo()\` — re-apply a previously undone change.\n4. \`begin_batch\` / \`commit_batch\` — group multiple changes into one atomic undo unit.\n\nThis is one of the most commonly reported Figma coding interview questions.`,
      starterCode: LAYER_STARTER_S1,
      tags: "figma",
      badges: "figma",
    },
    [
      {
        stageNumber: 1,
        title: "Apply and Retrieve",
        description: `## Stage 1: Apply and Retrieve\n\nImplement \`apply(layer_id, prop, value)\` and \`layer(layer_id)\`.\n\n**Data structure:** a dict of dicts — \`{layer_id: {prop: value}}\`.\n\n- \`apply\` sets a property on a layer (creates the layer if it doesn't exist yet).\n- \`layer\` returns a copy of all properties for that layer (empty dict if unknown).\n\n\`\`\`python\ndoc = LayerDocument()\ndoc.apply("rect1", "x", 10)\ndoc.apply("rect1", "y", 20)\ndoc.apply("rect1", "x", 30)  # overwrite\nprint(doc.layer("rect1"))   # {"x": 30, "y": 20}\n\`\`\``,
        baseClass: LAYER_BASE_S1,
        starterCode: LAYER_STARTER_S1,
        solution: LAYER_SOL_S1,
        solutionExplanation: "Use a dict of dicts: _layers[layer_id][prop] = value. apply() lazy-creates the inner dict. layer() returns a shallow copy to prevent external mutation.",
        testCases: [
          {
            description: "apply overwrites previous value; layer returns current state",
            inputData: `doc = LayerDocument()\ndoc.apply("rect1", "x", 10)\ndoc.apply("rect1", "y", 20)\ndoc.apply("rect1", "x", 30)\n_result = doc.layer("rect1")`,
            expectedOutput: `{"x": 30, "y": 20}`,
            orderIndex: 0,
          },
          {
            description: "layer returns empty dict for unknown layer_id",
            inputData: `doc = LayerDocument()\n_result = doc.layer("nonexistent")`,
            expectedOutput: `{}`,
            orderIndex: 1,
          },
          {
            description: "multiple layers are independent",
            inputData: `doc = LayerDocument()\ndoc.apply("a", "fill", "red")\ndoc.apply("b", "fill", "blue")\n_result = [doc.layer("a")["fill"], doc.layer("b")["fill"]]`,
            expectedOutput: `["red", "blue"]`,
            orderIndex: 2,
          },
        ],
      },
      {
        stageNumber: 2,
        title: "Undo",
        description: `## Stage 2: Undo\n\nAdd \`undo()\` — revert the most recent \`apply()\` call.\n\n**Data structure:** a history stack. Before overwriting a property, push \`(layer_id, prop, old_value, new_value)\` onto the stack. \`undo()\` pops the top entry and restores the old value. If \`old_value\` was \`None\` the property didn't exist before and should be deleted.\n\n\`\`\`python\ndoc = LayerDocument()\ndoc.apply("rect1", "x", 10)\ndoc.apply("rect1", "x", 20)\ndoc.undo()\nprint(doc.layer("rect1")["x"])  # 10\n\`\`\``,
        baseClass: LAYER_BASE_S2,
        starterCode: LAYER_STARTER_S2,
        solution: LAYER_SOL_S2,
        solutionExplanation: "Add a _history list. apply() records (layer_id, prop, old, new) before overwriting. undo() pops and restores old; if old is None the property is deleted.",
        testCases: [
          {
            description: "undo restores previous value",
            inputData: `doc = LayerDocument()\ndoc.apply("rect1", "x", 10)\ndoc.apply("rect1", "x", 20)\ndoc.undo()\n_result = doc.layer("rect1")["x"]`,
            expectedOutput: `10`,
            orderIndex: 0,
          },
          {
            description: "undo removes property when it was newly created",
            inputData: `doc = LayerDocument()\ndoc.apply("a", "fill", "red")\ndoc.undo()\n_result = doc.layer("a")`,
            expectedOutput: `{}`,
            orderIndex: 1,
          },
          {
            description: "undo on empty history returns False",
            inputData: `doc = LayerDocument()\n_result = doc.undo()`,
            expectedOutput: `False`,
            orderIndex: 2,
          },
        ],
      },
      {
        stageNumber: 3,
        title: "Redo",
        description: `## Stage 3: Redo\n\nAdd \`redo()\` — re-apply the last undone operation (Ctrl+Shift+Z).\n\n**Two-stack pattern:** maintain an \`_undo_stack\` and a \`_redo_stack\`.\n- \`apply()\` pushes to \`_undo_stack\` and **clears** \`_redo_stack\` (a new edit invalidates the redo history).\n- \`undo()\` pops from \`_undo_stack\`, pushes to \`_redo_stack\`, and reverses the change.\n- \`redo()\` pops from \`_redo_stack\`, pushes back to \`_undo_stack\`, and re-applies the change.\n\n\`\`\`python\ndoc = LayerDocument()\ndoc.apply("r", "x", 5)\ndoc.undo()\ndoc.redo()\nprint(doc.layer("r")["x"])  # 5\n\`\`\``,
        baseClass: LAYER_BASE_S3,
        starterCode: LAYER_STARTER_S3,
        solution: LAYER_SOL_S3,
        solutionExplanation: "Two-stack undo/redo. apply() clears redo stack. undo() moves entry to redo stack. redo() moves entry back to undo stack and re-applies.",
        testCases: [
          {
            description: "undo then redo restores value",
            inputData: `doc = LayerDocument()\ndoc.apply("r", "x", 5)\ndoc.undo()\ndoc.redo()\n_result = doc.layer("r")["x"]`,
            expectedOutput: `5`,
            orderIndex: 0,
          },
          {
            description: "new apply after undo clears redo stack",
            inputData: `doc = LayerDocument()\ndoc.apply("r", "x", 1)\ndoc.apply("r", "x", 2)\ndoc.undo()\ndoc.apply("r", "x", 3)\n_result = doc.redo()`,
            expectedOutput: `False`,
            orderIndex: 1,
          },
          {
            description: "multiple undo then one redo",
            inputData: `doc = LayerDocument()\ndoc.apply("r", "x", 10)\ndoc.apply("r", "y", 20)\ndoc.undo()\ndoc.undo()\ndoc.redo()\n_result = doc.layer("r")`,
            expectedOutput: `{"x": 10}`,
            orderIndex: 2,
          },
        ],
      },
      {
        stageNumber: 4,
        title: "Batch Commit",
        description: `## Stage 4: Batch Commit\n\nAdd \`begin_batch()\` and \`commit_batch()\` to group multiple \`apply()\` calls into a single atomic undo unit.\n\n**Motivation:** In Figma, moving a group of layers updates many properties at once. A single Ctrl+Z should undo all of them together, not one by one.\n\n**Implementation:** change the undo/redo stacks to hold **groups** (lists of ops) instead of individual ops.\n- Outside a batch: each \`apply()\` creates a one-element group.\n- Inside a batch: \`apply()\` collects ops into a buffer without touching the undo stack.\n- \`commit_batch()\` pushes the buffer as one group.\n- \`undo()\` / \`redo()\` reverse/re-apply the entire group at once.\n\n\`\`\`python\ndoc = LayerDocument()\ndoc.begin_batch()\ndoc.apply("r", "x", 10)\ndoc.apply("r", "y", 20)\ndoc.commit_batch()\ndoc.undo()  # undoes both x and y in one step\nprint(doc.layer("r"))  # {}\n\`\`\``,
        baseClass: LAYER_BASE_S4,
        starterCode: LAYER_STARTER_S4,
        solution: LAYER_SOL_S4,
        solutionExplanation: "Stacks now hold lists of ops (groups). apply() outside a batch creates a [op] group; inside a batch it appends to _batch buffer. commit_batch() pushes the buffer as one group. undo/redo reverse/apply the whole group.",
        testCases: [
          {
            description: "undo reverses all ops in a batch at once",
            inputData: `doc = LayerDocument()\ndoc.begin_batch()\ndoc.apply("r", "x", 10)\ndoc.apply("r", "y", 20)\ndoc.apply("r", "fill", "red")\ndoc.commit_batch()\ndoc.undo()\n_result = doc.layer("r")`,
            expectedOutput: `{}`,
            orderIndex: 0,
          },
          {
            description: "redo re-applies entire batch",
            inputData: `doc = LayerDocument()\ndoc.begin_batch()\ndoc.apply("a", "x", 1)\ndoc.apply("b", "x", 2)\ndoc.commit_batch()\ndoc.undo()\ndoc.redo()\n_result = [doc.layer("a").get("x"), doc.layer("b").get("x")]`,
            expectedOutput: `[1, 2]`,
            orderIndex: 1,
          },
          {
            description: "undo batch leaves earlier single-op intact",
            inputData: `doc = LayerDocument()\ndoc.apply("r", "x", 5)\ndoc.begin_batch()\ndoc.apply("r", "x", 10)\ndoc.apply("r", "y", 20)\ndoc.commit_batch()\ndoc.undo()\n_result = doc.layer("r")`,
            expectedOutput: `{"x": 5}`,
            orderIndex: 2,
          },
        ],
      },
    ]
  );

  // ── 12. File System with Permissions ────────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 12001,
      slug: "file-system-permissions",
      title: "File System with Permissions",
      difficulty: "Medium",
      description: `## File System with Permissions\n\nDesign a simple in-memory file system tree that supports permission-based access control — similar to how Figma manages who can view or edit a file.\n\n**Stages:**\n1. Build the tree and implement \`find(name)\`.\n2. Add \`grant(path, user)\` and \`accessible(user)\` — return the topmost accessible paths.\n3. Add \`revoke(path, user)\` — explicit revoke overrides inherited access.\n\nThis problem tests tree traversal (DFS), inheritance semantics, and clean state management.`,
      starterCode: FS_STARTER_S1,
      tags: "figma",
      badges: "figma",
    },
    [
      {
        stageNumber: 1,
        title: "Build the Tree and Find",
        description: `## Stage 1: Build the Tree and Find\n\nImplement \`add(parent_path, name, node_type)\` and \`find(name)\`.\n\n**Tree structure:** each node stores its name, type (\`"file"\` or \`"dir"\`), and a list of children. Keep a flat index \`{path: node}\` for O(1) parent lookup.\n\n- \`add\` attaches a new node under \`parent_path\`. The root path is \`"/"\`.\n- \`find\` does a DFS and returns a **sorted** list of absolute paths where a node with the given name exists.\n\n\`\`\`python\nfs = FileSystem()\nfs.add("/", "docs", "dir")\nfs.add("/docs", "report.txt", "file")\nfs.add("/", "report.txt", "file")\nprint(fs.find("report.txt"))  # ["/docs/report.txt", "/report.txt"]\n\`\`\``,
        baseClass: FS_BASE_S1,
        starterCode: FS_STARTER_S1,
        solution: FS_SOL_S1,
        solutionExplanation: "Store nodes as dicts with a children list. Keep a flat path->node index for O(1) add. find() does DFS and collects matching paths, then sorts.",
        testCases: [
          {
            description: "find returns all paths matching the name, sorted",
            inputData: `fs = FileSystem()\nfs.add("/", "docs", "dir")\nfs.add("/docs", "report.txt", "file")\nfs.add("/", "report.txt", "file")\n_result = fs.find("report.txt")`,
            expectedOutput: `["/docs/report.txt", "/report.txt"]`,
            orderIndex: 0,
          },
          {
            description: "find works for deeply nested files",
            inputData: `fs = FileSystem()\nfs.add("/", "a", "dir")\nfs.add("/a", "b", "dir")\nfs.add("/a/b", "c.txt", "file")\n_result = fs.find("c.txt")`,
            expectedOutput: `["/a/b/c.txt"]`,
            orderIndex: 1,
          },
          {
            description: "find returns empty list when name not found",
            inputData: `fs = FileSystem()\n_result = fs.find("missing.txt")`,
            expectedOutput: `[]`,
            orderIndex: 2,
          },
        ],
      },
      {
        stageNumber: 2,
        title: "Grant Access and Accessible",
        description: `## Stage 2: Grant Access and Accessible\n\nAdd \`grant(path, user)\` and \`accessible(user)\`.\n\n**Semantics:** \`accessible\` returns the **topmost** paths where \`user\` has been granted access. A path is topmost if no ancestor also grants access to the same user (because access to a directory implies access to everything inside it).\n\n**Algorithm:** DFS with a flag \`ancestor_has_access\`. When you reach a node where \`user\` is in the granted set AND \`ancestor_has_access\` is False, add it to results and continue DFS with \`ancestor_has_access = True\`.\n\n\`\`\`python\nfs = FileSystem()\nfs.add("/", "docs", "dir")\nfs.add("/docs", "secret.txt", "file")\nfs.grant("/docs", "alice")\nprint(fs.accessible("alice"))  # ["/docs"]\n\`\`\``,
        baseClass: FS_BASE_S2,
        starterCode: FS_STARTER_S2,
        solution: FS_SOL_S2,
        solutionExplanation: "DFS with ancestor_has_access flag. When user is in node's grants AND ancestor_has_access is False, report as topmost and continue DFS with flag=True.",
        testCases: [
          {
            description: "accessible returns topmost granted paths",
            inputData: `fs = FileSystem()\nfs.add("/", "docs", "dir")\nfs.add("/docs", "report.txt", "file")\nfs.add("/docs", "private.txt", "file")\nfs.add("/", "public.txt", "file")\nfs.grant("/docs", "alice")\nfs.grant("/public.txt", "alice")\n_result = fs.accessible("alice")`,
            expectedOutput: `["/docs", "/public.txt"]`,
            orderIndex: 0,
          },
          {
            description: "child grant is subsumed by parent grant",
            inputData: `fs = FileSystem()\nfs.add("/", "a", "dir")\nfs.add("/a", "b", "dir")\nfs.grant("/a", "bob")\nfs.grant("/a/b", "bob")\n_result = fs.accessible("bob")`,
            expectedOutput: `["/a"]`,
            orderIndex: 1,
          },
          {
            description: "accessible returns empty list when no grants",
            inputData: `fs = FileSystem()\nfs.add("/", "x", "file")\n_result = fs.accessible("carol")`,
            expectedOutput: `[]`,
            orderIndex: 2,
          },
        ],
      },
      {
        stageNumber: 3,
        title: "Revoke Access",
        description: `## Stage 3: Revoke Access\n\nAdd \`revoke(path, user)\`. An explicit revoke at a node **overrides** any inherited grant from an ancestor.\n\n**Semantics:** each node now has two sets — \`grants\` and \`revokes\`. During DFS:\n- If \`user\` is in \`revokes\`: effective access is False (regardless of inheritance).\n- If \`user\` is in \`grants\`: effective access is True.\n- Otherwise: inherit from parent.\n\n\`\`\`python\nfs = FileSystem()\nfs.add("/", "docs", "dir")\nfs.add("/docs", "secret.txt", "file")\nfs.grant("/docs", "alice")\nfs.revoke("/docs/secret.txt", "alice")\nprint(fs.accessible("alice"))  # ["/docs"]  (secret.txt is blocked)\n\`\`\``,
        baseClass: FS_BASE_S3,
        starterCode: FS_STARTER_S3,
        solution: FS_SOL_S3,
        solutionExplanation: "Each node has grants and revokes sets. DFS computes effective = (granted or inherited) and not revoked. Topmost nodes where effective=True and inherited=False are reported.",
        testCases: [
          {
            description: "revoke blocks access to a child even when parent grants",
            inputData: `fs = FileSystem()\nfs.add("/", "docs", "dir")\nfs.add("/docs", "secret.txt", "file")\nfs.add("/docs", "public.txt", "file")\nfs.grant("/docs", "alice")\nfs.revoke("/docs/secret.txt", "alice")\n_result = fs.accessible("alice")`,
            expectedOutput: `["/docs"]`,
            orderIndex: 0,
          },
          {
            description: "explicit grant on child after parent revoke restores access",
            inputData: `fs = FileSystem()\nfs.add("/", "a", "dir")\nfs.add("/a", "b", "file")\nfs.grant("/a", "bob")\nfs.revoke("/a", "bob")\nfs.grant("/a/b", "bob")\n_result = fs.accessible("bob")`,
            expectedOutput: `["/a/b"]`,
            orderIndex: 1,
          },
          {
            description: "revoke without prior grant returns empty",
            inputData: `fs = FileSystem()\nfs.add("/", "x", "dir")\nfs.add("/x", "y", "file")\nfs.grant("/x", "carol")\nfs.revoke("/x", "carol")\n_result = fs.accessible("carol")`,
            expectedOutput: `[]`,
            orderIndex: 2,
          },
        ],
      },
    ]
  );

  // ── 13. 2D Canvas Ordering ───────────────────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 13001,
      slug: "canvas-ordering",
      title: "2D Canvas Ordering",
      difficulty: "Easy",
      description: `## 2D Canvas Ordering\n\nIn Figma, objects on a canvas are rectangles with a position \`(x, y)\` and size \`(w, h)\`. When exporting or processing a design, you often need to visit objects in **reading order** — top-to-bottom, left-to-right.\n\n**Stages:**\n1. Simple sort by \`(y, x)\` — works when objects don't overlap vertically.\n2. Row-based grouping — objects whose y-ranges overlap belong to the same row and should be sorted together.\n\nThis problem tests sorting, coordinate geometry, and greedy grouping.`,
      starterCode: CANVAS_STARTER_S1,
      tags: "figma",
      badges: "figma",
    },
    [
      {
        stageNumber: 1,
        title: "Sort by Position",
        description: `## Stage 1: Sort by Position\n\nImplement \`sort(objects)\` — return a list of object ids sorted in reading order.\n\n**Rule:** sort primarily by \`y\` (top edge, ascending), then by \`x\` (left edge, ascending) as a tiebreaker.\n\nEach element of \`objects\` is a \`CanvasObject\` with fields \`id\`, \`x\`, \`y\`, \`w\`, \`h\`.\n\n\`\`\`python\nsorter = CanvasSorter()\nobjects = [\n    CanvasObject("B", x=100, y=50, w=50, h=50),\n    CanvasObject("A", x=10,  y=50, w=50, h=50),\n    CanvasObject("C", x=50,  y=10, w=50, h=50),\n]\nprint(sorter.sort(objects))  # ["C", "A", "B"]\n\`\`\``,
        baseClass: CANVAS_BASE_S1,
        starterCode: CANVAS_STARTER_S1,
        solution: CANVAS_SOL_S1,
        solutionExplanation: "Sort by (y, x) tuple key. Python's sorted() is stable and O(n log n). Return the id field of each sorted object.",
        testCases: [
          {
            description: "objects sorted top-to-bottom then left-to-right",
            inputData: `sorter = CanvasSorter()\nobjects = [CanvasObject("B", x=100, y=50, w=50, h=50), CanvasObject("A", x=10, y=50, w=50, h=50), CanvasObject("C", x=50, y=10, w=50, h=50)]\n_result = sorter.sort(objects)`,
            expectedOutput: `["C", "A", "B"]`,
            orderIndex: 0,
          },
          {
            description: "single object returns list with that id",
            inputData: `sorter = CanvasSorter()\nobjects = [CanvasObject("X", x=0, y=0, w=10, h=10)]\n_result = sorter.sort(objects)`,
            expectedOutput: `["X"]`,
            orderIndex: 1,
          },
          {
            description: "same y, sorted by x",
            inputData: `sorter = CanvasSorter()\nobjects = [CanvasObject("D", x=200, y=100, w=20, h=20), CanvasObject("E", x=10, y=100, w=20, h=20), CanvasObject("F", x=100, y=0, w=20, h=20)]\n_result = sorter.sort(objects)`,
            expectedOutput: `["F", "E", "D"]`,
            orderIndex: 2,
          },
        ],
      },
      {
        stageNumber: 2,
        title: "Row-Based Grouping",
        description: `## Stage 2: Row-Based Grouping\n\nImplement \`sort_rows(objects)\` — a smarter sort that groups objects into rows.\n\n**Problem with simple (y, x) sort:** if object A is at y=0 and object B is at y=10 but both have height 40, they visually overlap and belong in the same row. A simple y-sort would put them in separate rows.\n\n**Rule:** two objects are in the same row if their **y-ranges overlap** (i.e. \`A.y < B.y + B.h\` AND \`A.y + A.h > B.y\`). Rows are sorted top-to-bottom by their minimum y; objects within a row are sorted left-to-right by x.\n\n\`\`\`python\nsorter = CanvasSorter()\nobjects = [\n    CanvasObject("A", x=10,  y=0,  w=50, h=40),\n    CanvasObject("B", x=100, y=10, w=50, h=40),  # overlaps A\n    CanvasObject("C", x=50,  y=60, w=50, h=40),  # new row\n]\nprint(sorter.sort_rows(objects))  # ["A", "B", "C"]\n\`\`\``,
        baseClass: CANVAS_BASE_S2,
        starterCode: CANVAS_STARTER_S2,
        solution: CANVAS_SOL_S2,
        solutionExplanation: "Sort by y, then greedily assign each object to the first row it overlaps with. Within each row, sort by x. Overlap: obj.y < existing.y+existing.h AND obj.y+obj.h > existing.y.",
        testCases: [
          {
            description: "overlapping objects grouped into same row",
            inputData: `sorter = CanvasSorter()\nobjects = [CanvasObject("A", x=10, y=0, w=50, h=40), CanvasObject("B", x=100, y=10, w=50, h=40), CanvasObject("C", x=50, y=60, w=50, h=40)]\n_result = sorter.sort_rows(objects)`,
            expectedOutput: `["A", "B", "C"]`,
            orderIndex: 0,
          },
          {
            description: "non-overlapping objects in separate rows, sorted by x within row",
            inputData: `sorter = CanvasSorter()\nobjects = [CanvasObject("X", x=200, y=0, w=20, h=20), CanvasObject("Y", x=10, y=0, w=20, h=20), CanvasObject("Z", x=100, y=50, w=20, h=20)]\n_result = sorter.sort_rows(objects)`,
            expectedOutput: `["Y", "X", "Z"]`,
            orderIndex: 1,
          },
          {
            description: "empty list returns empty list",
            inputData: `sorter = CanvasSorter()\n_result = sorter.sort_rows([])`,
            expectedOutput: `[]`,
            orderIndex: 2,
          },
        ],
      },
    ]
  );

  // ── 14. Component Tree Traversal ─────────────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 14001,
      slug: "component-tree-traversal",
      title: "Component Tree Traversal",
      difficulty: "Medium",
      description: `## Component Tree Traversal\n\nFigma's design hierarchy is a tree of components — frames contain groups, groups contain shapes, shapes have properties. This problem asks you to build and traverse that tree.\n\n**Stages:**\n1. Build the tree and implement \`flatten()\` — DFS pre-order traversal.\n2. Add \`find_by_type()\` and \`depth()\`.\n3. Add component inheritance — instances inherit properties from a master component but can override them.\n\nThis mirrors Figma's actual component/instance model and is a common system design coding question.`,
      starterCode: COMP_STARTER_S1,
      tags: "figma",
      badges: "figma",
    },
    [
      {
        stageNumber: 1,
        title: "Build and Flatten",
        description: `## Stage 1: Build and Flatten\n\nImplement \`add(parent_id, node_id, node_type)\` and \`flatten()\`.\n\n**Tree structure:** each node has an id, type, and list of children. Use a virtual root node (\`ComponentTreeBase.ROOT = "__root__"\`) to anchor the tree — it should never appear in \`flatten()\` results.\n\n\`flatten()\` returns all node ids in **DFS pre-order** (parent before its children).\n\n\`\`\`python\ntree = ComponentTree()\ntree.add(ComponentTree.ROOT, "frame1", "frame")\ntree.add("frame1", "group1", "group")\ntree.add("group1", "rect1", "rectangle")\nprint(tree.flatten())  # ["frame1", "group1", "rect1"]\n\`\`\``,
        baseClass: COMP_BASE_S1,
        starterCode: COMP_STARTER_S1,
        solution: COMP_SOL_S1,
        solutionExplanation: "Store nodes as dicts with a children list. Keep a flat id->node index. flatten() does recursive DFS pre-order, skipping ROOT.",
        testCases: [
          {
            description: "flatten returns DFS pre-order (parent before children)",
            inputData: `tree = ComponentTree()\ntree.add(ComponentTree.ROOT, "frame1", "frame")\ntree.add("frame1", "group1", "group")\ntree.add("group1", "rect1", "rectangle")\ntree.add("group1", "text1", "text")\ntree.add("frame1", "rect2", "rectangle")\n_result = tree.flatten()`,
            expectedOutput: `["frame1", "group1", "rect1", "text1", "rect2"]`,
            orderIndex: 0,
          },
          {
            description: "single top-level node",
            inputData: `tree = ComponentTree()\ntree.add(ComponentTree.ROOT, "a", "frame")\n_result = tree.flatten()`,
            expectedOutput: `["a"]`,
            orderIndex: 1,
          },
          {
            description: "empty tree returns empty list",
            inputData: `tree = ComponentTree()\n_result = tree.flatten()`,
            expectedOutput: `[]`,
            orderIndex: 2,
          },
        ],
      },
      {
        stageNumber: 2,
        title: "Find by Type and Depth",
        description: `## Stage 2: Find by Type and Depth\n\nAdd \`find_by_type(node_type)\` and \`depth(node_id)\`.\n\n- \`find_by_type\` returns ids of all nodes with the given type, in DFS pre-order. Hint: reuse \`flatten()\`.\n- \`depth\` returns the depth of a node. Direct children of ROOT have depth 1. Hint: store the parent id on each node and walk upward.\n\n\`\`\`python\ntree = ComponentTree()\ntree.add(ComponentTree.ROOT, "f1", "frame")\ntree.add("f1", "g1", "group")\ntree.add("g1", "r1", "rectangle")\nprint(tree.find_by_type("rectangle"))  # ["r1"]\nprint(tree.depth("r1"))               # 3\n\`\`\``,
        baseClass: COMP_BASE_S2,
        starterCode: COMP_STARTER_S2,
        solution: COMP_SOL_S2,
        solutionExplanation: "find_by_type filters flatten() by type. depth() walks parent pointers until ROOT, counting steps. Store parent_id on each node in add().",
        testCases: [
          {
            description: "find_by_type returns all matching nodes in DFS order",
            inputData: `tree = ComponentTree()\ntree.add(ComponentTree.ROOT, "f1", "frame")\ntree.add("f1", "g1", "group")\ntree.add("g1", "r1", "rectangle")\ntree.add("g1", "r2", "rectangle")\ntree.add("f1", "t1", "text")\n_result = tree.find_by_type("rectangle")`,
            expectedOutput: `["r1", "r2"]`,
            orderIndex: 0,
          },
          {
            description: "depth of deeply nested node",
            inputData: `tree = ComponentTree()\ntree.add(ComponentTree.ROOT, "f1", "frame")\ntree.add("f1", "g1", "group")\ntree.add("g1", "r1", "rectangle")\n_result = tree.depth("r1")`,
            expectedOutput: `3`,
            orderIndex: 1,
          },
          {
            description: "depth of top-level node is 1",
            inputData: `tree = ComponentTree()\ntree.add(ComponentTree.ROOT, "f1", "frame")\n_result = tree.depth("f1")`,
            expectedOutput: `1`,
            orderIndex: 2,
          },
        ],
      },
      {
        stageNumber: 3,
        title: "Component Inheritance",
        description: `## Stage 3: Component Inheritance\n\nAdd \`set_prop(node_id, key, value)\` and \`get_prop(node_id, key)\`, plus a \`master_id\` parameter to \`add()\`.\n\n**Figma's component model:** a master component defines default properties. Instances inherit those properties but can override individual ones.\n\n- \`add(..., master_id="btn_master")\` marks the node as an instance of \`btn_master\`.\n- \`set_prop\` stores a property on the node's own props dict (overrides master).\n- \`get_prop\` checks the node's own props first; if not found, checks the master's props; returns \`None\` if not found anywhere.\n\n\`\`\`python\ntree = ComponentTree()\ntree.add(ComponentTree.ROOT, "btn_master", "component")\ntree.set_prop("btn_master", "fill", "blue")\ntree.add(ComponentTree.ROOT, "btn1", "instance", master_id="btn_master")\ntree.set_prop("btn1", "fill", "red")   # override\nprint(tree.get_prop("btn1", "fill"))   # "red"\nprint(tree.get_prop("btn1", "radius")) # None (not set anywhere)\n\`\`\``,
        baseClass: COMP_BASE_S3,
        starterCode: COMP_STARTER_S3,
        solution: COMP_SOL_S3,
        solutionExplanation: "Each node has a props dict and a master_id. set_prop stores in own props. get_prop checks own props first, then master's props, then returns None.",
        testCases: [
          {
            description: "instance inherits property from master",
            inputData: `tree = ComponentTree()\ntree.add(ComponentTree.ROOT, "btn_master", "component")\ntree.set_prop("btn_master", "fill", "blue")\ntree.set_prop("btn_master", "radius", 4)\ntree.add(ComponentTree.ROOT, "btn1", "instance", master_id="btn_master")\ntree.set_prop("btn1", "radius", 8)\n_result = tree.get_prop("btn1", "fill")`,
            expectedOutput: `"blue"`,
            orderIndex: 0,
          },
          {
            description: "instance own prop overrides master",
            inputData: `tree = ComponentTree()\ntree.add(ComponentTree.ROOT, "m", "component")\ntree.set_prop("m", "radius", 4)\ntree.add(ComponentTree.ROOT, "i", "instance", master_id="m")\ntree.set_prop("i", "radius", 8)\n_result = tree.get_prop("i", "radius")`,
            expectedOutput: `8`,
            orderIndex: 1,
          },
          {
            description: "get_prop returns None for missing property",
            inputData: `tree = ComponentTree()\ntree.add(ComponentTree.ROOT, "m", "component")\ntree.add(ComponentTree.ROOT, "i", "instance", master_id="m")\n_result = tree.get_prop("i", "missing")`,
            expectedOutput: `None`,
            orderIndex: 2,
          },
        ],
      },
    ]
  );

  console.log("[Seed] Figma problems seeded.");
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
